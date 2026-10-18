// A library throw constructs a `CngxRuntimeError` (`projects/utils/runtime-error.ts`)
// with a code, so a consumer can match it and a production build ships only
// the code. The message sits behind the inline guard
// `typeof ngDevMode !== 'undefined' && ngDevMode`, which the production build
// folds to `false`.
//
// T1  every `throw`, every `Promise.reject(...)`, every call of a
//     `new Promise((resolve, reject) => ...)` executor's reject parameter and
//     every global `reportError(...)` hands over either a
//     `new CngxRuntimeError(...)` constructed in place or the variable of an
//     enclosing `catch` clause (a rethrow). Anything else counts as a raw
//     site: a raw `Error`, a local holding one, a factory or method call, a
//     non-error value. A raw site is allowed only in a file of
//     RAW_THROW_EXEMPT. The rule is an allowlist, so no way of building the
//     error escapes it.
// T2  every `new CngxRuntimeError` has a `CNGXnnnn` literal first argument in
//     the file's lib range.
// T3  the message is an `&&` chain starting with the guard, unless the
//     construction itself is dev-only; a guarded construction does not run at
//     module load, where `ngDevMode` can still be undefined in a dev build.
//     The message text (the guarded tail) is a string literal, a template
//     literal or a `+` concatenation written in place whose first operand is
//     one of those: a local or a call result can carry text built before the
//     guard, and so can the first operand of `m + ' text'`. A third argument is
//     omitted or `{ cause: <enclosing catch variable> }` unless the whole
//     construction is dev-only: a `new Error('text')` cause ships its text.
// T4  `CngxRuntimeError` is only constructed, tested with `instanceof`,
//     imported, exported or named in a type: an alias, a namespace or
//     element access (`ns['CngxRuntimeError']`) or any other value use hides
//     the construction from T2/T3, the manifest and the prod-strip check.
// T5  no built-in error is constructed at all, whatever channel it leaves
//     through: `new X(...)` and `X(...)` for `Error`, `TypeError`,
//     `RangeError`, `SyntaxError`, `ReferenceError`, `EvalError`, `URIError`,
//     `AggregateError` and `DOMException`, and `class ... extends X`. This
//     covers the channels T1 does not read: `onError(new Error())`,
//     `subscriber.error(new TypeError())`, `throwError(() => new Error())`
//     and an error stored as state. A name bound locally (a parameter, an
//     import, a local class) shadows the global and passes, as in the T3
//     shadow check; `projects/utils/runtime-error.ts` declares
//     `CngxRuntimeError` and is skipped. A construction is allowed only in a
//     file of RAW_THROW_EXEMPT, whose row states the exact `constructions`
//     count next to the T1 `count`.
//
// Known limits (open bypasses, each needs more than a syntactic read):
// T5 reads the class name only: an alias (`const E = Error; new E()`), a
// global host (`globalThis.Error`), `Reflect.construct(Error, ...)` and
// `Object.create(Error.prototype)` are not seen.
// `Promise.reject` reached through an aliased or nested host
// (`globalThis.Promise.reject`, `const P = Promise`), by element access
// (`Promise['reject']`) or through `.call` / `.apply`; `reportError` read off
// a global host; `gen.throw(...)`; a catch variable reassigned or mutated
// before its rethrow. A function expression invoked in place is caught:
// called directly or with `new`, through `.call` / `.apply` (also
// `['call']` / `['apply']`), through one `.bind(...)` whose result is called
// right away or through `.call` / `.apply`, with the function wrapped in
// parentheses, `as`, `<T>`, `satisfies` or `!`, or as the last operand of a
// comma expression (`(0, fn)()`); so are the constructor and instance field
// initialisers of a class expression constructed in place
// (`new (class { ... })()`). Still counted as running later: a callback that
// a synchronous call runs at module load (`[1].forEach(() => ...)`,
// `Reflect.apply(fn, ...)`), a function expression used as a tag
// (`` (() => ...)`x` ``), a function stored in a name first and called at
// module scope (`const f = () => ...; f();`, also a class stored first and
// constructed later), two chained `.bind(...)` calls, and an accessor or
// method of a class constructed in place that runs during its construction
// (`constructor() { this.run(); }` with the guard in `run`).
// `${m}` or `'' + m` around a local built before the guard has the inline
// shape and passes the inline-message rule: it checks the message's form,
// not where the text in its operands was built (many operands are
// production values, so an identifier inside the template cannot be
// banned). A dev wrapper's parameter counts as inline; what a caller passes
// in is checked only for its guard (R4), not for where its text was built.
//
// The walk is `readSources`, shared with the raw-console guard, the manifest
// and the prod-strip check: specs, tooling roots, example folders and
// `projects/testing` are out.

import { performance } from 'node:perf_hooks';

import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  MODULE_LOAD_GUARD,
  RUNTIME_ERROR,
  collectErrorConstructions,
  collectRuntimeErrors,
  isEnclosingCatchVariable,
  lineOf,
  localNgDevModeLines,
  parse,
  singleFileChecker,
  unwrap,
} from '../dev-diagnostics.mjs';
import { libOf, rangeOf, readSources } from '../error-codes-manifest.mjs';
import { isLibrarySource } from './source-roots.mjs';

/**
 * Files allowed to throw (T1) or construct (T5) a raw error. Exact counts: a
 * new throw or construction in an exempt file fails, and so does a row whose
 * sites are gone or whose counts are both 0.
 *
 * @type {{ file: string; count: number; constructions: number; reason: string }[]}
 */
const RAW_THROW_EXEMPT = [
  {
    file: 'projects/core/testing/vitest/announcement-matchers.ts',
    count: 3,
    constructions: 3,
    reason:
      'matcher argument validation inside a test runner; TypeError is the matcher-misuse convention and never runs in an app bundle',
  },
  {
    file: 'projects/forms/select/shared/__test-helpers/field-skin-host.ts',
    count: 1,
    constructions: 1,
    reason:
      'spec-only harness; excluded-path-import-boundary.test.mjs fails any library import of a __test-helpers file',
  },
  {
    file: 'projects/forms/select/shared/__test-helpers/mobile-sheet.ts',
    count: 0,
    constructions: 1,
    reason:
      'spec-only harness that feeds a failing commit source an Error; excluded-path-import-boundary.test.mjs fails any library import of a __test-helpers file',
  },
];

/** The file that declares the class; its own declaration is no value use. */
const RUNTIME_ERROR_FILE = 'projects/utils/runtime-error.ts';
const CODE_PATTERN = /^CNGX\d{4}$/;

const isRuntimeErrorConstruction = (expr) =>
  ts.isNewExpression(expr) &&
  ts.isIdentifier(expr.expression) &&
  expr.expression.text === RUNTIME_ERROR;

/** `Promise.reject(x)`: the rejected operand (the call itself for a bare `reject()`), else null. */
const rejectedOperand = (node) => {
  if (!ts.isCallExpression(node)) {
    return null;
  }
  const callee = unwrap(node.expression);
  const isReject =
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'Promise' &&
    callee.name.text === 'reject';
  return isReject ? (node.arguments[0] ?? node) : null;
};

/** Is `param` the second parameter of an executor passed to `new Promise(...)`? */
const isExecutorReject = (param) => {
  const executor = param.parent;
  const construction = executor.parent;
  return (
    executor.parameters?.[1] === param &&
    ts.isNewExpression(construction) &&
    construction.arguments?.[0] === executor &&
    ts.isIdentifier(construction.expression) &&
    construction.expression.text === 'Promise'
  );
};

/**
 * `reject(x)` inside a `new Promise` executor or a global `reportError(x)`:
 * the reported operand (the call itself when it has none), else null.
 */
const reportedOperand = (node, symbolOf) => {
  if (!ts.isCallExpression(node)) {
    return null;
  }
  const callee = unwrap(node.expression);
  if (!ts.isIdentifier(callee)) {
    return null;
  }
  const declaration = symbolOf(callee)?.declarations?.[0];
  const reports = declaration
    ? ts.isParameter(declaration) && isExecutorReject(declaration)
    : callee.text === 'reportError';
  return reports ? (node.arguments[0] ?? node) : null;
};

/** Lines of every raw throw or rejection (T1) in one file. */
export function rawThrowLines(path, text) {
  if (!text.includes('throw') && !text.includes('Promise') && !text.includes('reportError')) {
    return [];
  }
  const sf = parse(path, text);
  let checker;
  const symbolOf = (id) => (checker ??= singleFileChecker(sf)).getSymbolAtLocation(id);
  const isAllowed = (operand, site) => {
    const inner = unwrap(operand);
    return (
      isRuntimeErrorConstruction(inner) ||
      (ts.isIdentifier(inner) && isEnclosingCatchVariable(inner, site, sf))
    );
  };
  const lines = [];
  const visit = (node) => {
    const operand = ts.isThrowStatement(node)
      ? node.expression
      : (rejectedOperand(node) ?? reportedOperand(node, symbolOf));
    if (operand && !isAllowed(operand, node)) {
      lines.push(lineOf(sf, node));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return lines;
}

/** Is the identifier a type name: `T`, `ns.T`, `typeof T` or `import('x').T`? */
const isTypeName = (node) => {
  let current = node;
  while (ts.isQualifiedName(current.parent) && current.parent.right === current) {
    current = current.parent;
  }
  const parent = current.parent;
  return (
    ts.isTypeReferenceNode(parent) ||
    ts.isTypeQueryNode(parent) ||
    (ts.isImportTypeNode(parent) && parent.qualifier === current)
  );
};

/** Why a `CngxRuntimeError` identifier is not an allowed use (T4), or null. */
function misuseOf(node, path) {
  const parent = node.parent;
  if (ts.isNewExpression(parent) && parent.expression === node) {
    return null;
  }
  if (
    ts.isBinaryExpression(parent) &&
    parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
    parent.right === node
  ) {
    return null;
  }
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) {
    return parent.propertyName ? `${RUNTIME_ERROR} is aliased` : null;
  }
  if (isTypeName(node)) {
    return null;
  }
  if (ts.isClassDeclaration(parent) && parent.name === node && path === RUNTIME_ERROR_FILE) {
    return null;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return `${RUNTIME_ERROR} is read through a namespace or object`;
  }
  return `${RUNTIME_ERROR} is used as a value`;
}

/** T4 violations in one file. */
function collectRuntimeErrorMisuse(path, text) {
  if (!text.includes(RUNTIME_ERROR)) {
    return [];
  }
  const sf = parse(path, text);
  const out = [];
  const visit = (node) => {
    if (ts.isIdentifier(node) && node.text === RUNTIME_ERROR) {
      const reason = misuseOf(node, path);
      if (reason) {
        out.push(`${path}:${lineOf(sf, node)} T4 ${reason}; construct it with new`);
      }
    }
    if (
      ts.isElementAccessExpression(node) &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      node.argumentExpression.text === RUNTIME_ERROR
    ) {
      out.push(
        `${path}:${lineOf(sf, node)} T4 ${RUNTIME_ERROR} is read by element access; construct it with new`,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/**
 * Runs T1-T5 over `files` ([{ path, text }]). `raw` counts the T1 sites per
 * file, `constructions` the T5 sites per file; `sites` lists every T5 site
 * as `file:line`.
 *
 * @returns {{ raw: Map<string, number>; constructions: Map<string, number>; sites: string[]; violations: string[] }}
 */
export function checkSources(allFiles) {
  const files = allFiles.filter(({ path }) => isLibrarySource(path));
  const raw = new Map();
  const violations = [];
  const errorConstructions = new Map();
  const sites = [];
  for (const site of collectErrorConstructions(files)) {
    errorConstructions.set(site.file, (errorConstructions.get(site.file) ?? 0) + 1);
    sites.push(`${site.file}:${site.line} T5 ${site.kind} ${site.name}`);
  }
  for (const { path, text } of files) {
    const lines = rawThrowLines(path, text);
    if (lines.length > 0) {
      raw.set(path, lines.length);
    }
    violations.push(...collectRuntimeErrorMisuse(path, text));
  }

  const constructions = collectRuntimeErrors(files);
  for (const error of constructions) {
    const where = `${error.file}:${error.line}`;
    const label = error.code ?? 'construction';
    if (error.code === null || !CODE_PATTERN.test(error.code)) {
      violations.push(`${where} T2 the first argument must be a 'CNGXnnnn' string literal`);
    } else {
      const range = rangeOf(error.code);
      const lib = libOf(error.file);
      if (!range || range.lib !== lib) {
        violations.push(`${where} T2 ${error.code} lies outside the ${lib} range`);
      }
    }
    const hasMessage = error.node.arguments.length > 1;
    if (!error.devOnly && hasMessage && !error.messageGuarded) {
      violations.push(
        `${where} T3 ${label} message is not behind the inline ngDevMode guard; ` +
          "write `typeof ngDevMode !== 'undefined' && ngDevMode && 'message'`",
      );
    }
    if ((error.devOnly || error.messageGuarded) && !error.messageInline) {
      violations.push(
        `${where} T3 ${label} message is not text written in place; ` +
          'inline the string, template or concatenation behind the guard',
      );
    }
    if (!error.optionsPlain) {
      violations.push(
        `${where} T3 ${label} options must be omitted or { cause: <enclosing catch variable> }`,
      );
    }
    if ((error.devOnly || error.messageGuarded) && error.atModuleLoad) {
      violations.push(`${where} T3 ${label} ${MODULE_LOAD_GUARD}`);
    }
  }

  const guardedFiles = new Map(constructions.map((c) => [c.file, c.sf]));
  for (const [file, sf] of guardedFiles) {
    for (const line of localNgDevModeLines(sf)) {
      violations.push(
        `${file}:${line} T3 a local ngDevMode shadows the global; its guards never fold in production`,
      );
    }
  }
  return { raw, constructions: errorConstructions, sites, violations };
}

/** The raw sites grouped per lib, for the failure message. */
export function groupPerLib(raw) {
  const out = {};
  for (const [file, count] of [...raw].sort(([a], [b]) => a.localeCompare(b))) {
    (out[libOf(file)] ??= []).push({ file, count });
  }
  return out;
}

/**
 * Exemption rows that do not match `raw` (T1) and `constructions` (T5)
 * exactly, carry no reason, or exempt nothing.
 */
export function exemptionProblems(raw, constructions, exempt = RAW_THROW_EXEMPT) {
  const out = [];
  for (const row of exempt) {
    if (!row.reason?.trim()) {
      out.push(`${row.file}: exemption without a reason`);
    }
    if (row.count === 0 && row.constructions === 0) {
      out.push(`${row.file}: exemption with no throw and no construction`);
    }
    const actual = raw.get(row.file) ?? 0;
    if (actual !== row.count) {
      out.push(`${row.file}: source ${actual}, exemption ${row.count}`);
    }
    const built = constructions.get(row.file) ?? 0;
    if (built !== row.constructions) {
      out.push(`${row.file}: source constructions ${built}, exemption ${row.constructions}`);
    }
  }
  return out;
}

const fixture = (text, path = 'projects/common/a.ts') => checkSources([{ path, text }]);
const GUARD = "typeof ngDevMode !== 'undefined' && ngDevMode";

describe('raw-throw guard - T1 raw throws', () => {
  it('counts every throw that is not CngxRuntimeError or a rethrow, never comments or strings', () => {
    const { raw } = fixture(
      [
        "// throw new Error('in a comment');",
        'const s = \'throw new Error("in a string")\';',
        "function make() { return new Error('m'); }",
        'class Svc {',
        "  private fail() { return new Error('f'); }",
        '  run() {',
        "    if (a) { throw new Error('a'); }",
        "    if (b) { throw new TypeError('b'); }",
        "    if (c) { throw Error('c'); }",
        "    if (d) { throw new errors.DomainError('d'); }",
        "    if (e) { throw new DOMException('e'); }",
        "    if (f) { throw Object.assign(new Error('f'), { status: 1 }); }",
        '    if (g) { throw make(); }',
        '    if (h) { throw this.fail(); }',
        "    if (i) { throw 'text'; }",
        "    const local = new Error('j');",
        '    throw local;',
        '  }',
        '}',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(10);
  });

  it('passes CngxRuntimeError constructed in place, also with a catch-variable cause', () => {
    const { raw, violations } = fixture(
      [
        'function f() {',
        `  if (a) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm'); }`,
        `  try { work(); } catch (e) { throw new CngxRuntimeError('CNGX1002', ${GUARD} && \`m \${String(e)}\`, { cause: e }); }`,
        "  throw (new CngxRuntimeError('CNGX1003'));",
        '}',
      ].join('\n'),
    );
    expect(raw.size).toBe(0);
    expect(violations).toEqual([]);
  });

  it('passes a rethrow of the enclosing catch variable, also from a closure inside the catch', () => {
    const { raw } = fixture(
      [
        'function f() {',
        '  try { work(); } catch (err) { throw err; }',
        '  try { work(); } catch (err) { setTimeout(() => { throw err; }); }',
        '}',
      ].join('\n'),
    );
    expect(raw.size).toBe(0);
  });

  it('counts a parameter, a shadowing local and a catch variable thrown outside its clause', () => {
    const { raw } = fixture(
      [
        'function f(e: unknown) { throw e; }',
        'function g() {',
        "  try { work(); } catch (err) { { const err = new Error('x'); throw err; } }",
        '}',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(2);
  });

  it('applies the same rule to Promise.reject', () => {
    const { raw } = fixture(
      [
        "function f() { return Promise.reject(new Error('a')); }",
        'function g() { return Promise.reject(); }',
        "function h() { return Promise.reject(new CngxRuntimeError('CNGX1001')); }",
        'async function i() { try { await work(); } catch (err) { return Promise.reject(err); } }',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(2);
  });

  it('applies the same rule to a Promise executor reject and to reportError', () => {
    const { raw } = fixture(
      [
        "function f() { return new Promise((resolve, rej) => rej(new Error('a'))); }",
        'function g() { return new Promise((res, reject) => { work(); reject(); }); }',
        "function h() { reportError(new Error('c')); }",
        "function i() { return new Promise((res, rej) => rej(new CngxRuntimeError('CNGX1001'))); }",
        'function j() { return new Promise((res, rej) => { try { work(); } catch (e) { rej(e); } }); }',
        "function k(reportError: (e: unknown) => void) { reportError(new Error('local')); }",
        "function l() { return new Promise((res) => res(new Error('value'))); }",
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(3);
  });

  it('ignores files under an examples folder', () => {
    const { raw, violations } = fixture(
      "function f() { throw new Error('demo'); }",
      'projects/ui/tabs/examples/demo.ts',
    );
    expect(raw.size).toBe(0);
    expect(violations).toEqual([]);
  });
});

describe('raw-throw guard - T2 codes', () => {
  it('fails a variable code and an out-of-range code', () => {
    expect(
      fixture(`function f(code) { throw new CngxRuntimeError(code, ${GUARD} && 'm'); }`).violations,
    ).toEqual(["projects/common/a.ts:1 T2 the first argument must be a 'CNGXnnnn' string literal"]);
    expect(
      fixture(`function f() { throw new CngxRuntimeError('CNGX2001', ${GUARD} && 'm'); }`)
        .violations,
    ).toEqual(['projects/common/a.ts:1 T2 CNGX2001 lies outside the common range']);
  });

  it('passes a literal code in the lib range, with or without a message', () => {
    expect(
      fixture(
        [
          `function f() { throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm'); }`,
          "function g() { throw new CngxRuntimeError('CNGX1002'); }",
        ].join('\n'),
      ).violations,
    ).toEqual([]);
  });
});

describe('raw-throw guard - T3 messages', () => {
  it('fails an unguarded message and a trailing guard', () => {
    expect(
      fixture("function f() { throw new CngxRuntimeError('CNGX1001', 'm'); }").violations,
    ).toHaveLength(1);
    expect(
      fixture(`function f(msg) { throw new CngxRuntimeError('CNGX1001', msg && ${GUARD}); }`)
        .violations,
    ).toHaveLength(1);
  });

  it('passes a plain message on a dev-only construction', () => {
    expect(
      fixture(`function f() { if (${GUARD}) { throw new CngxRuntimeError('CNGX1001', 'm'); } }`)
        .violations,
    ).toEqual([]);
  });

  it('passes the chip-interaction shape: an afterNextRender arrow after a negated early return', () => {
    expect(
      fixture(
        [
          'class C {',
          '  constructor() {',
          '    setup();',
          `    if (!(${GUARD})) { return; }`,
          '    const ancestor = inject(HOST, { optional: true });',
          '    afterNextRender(() => {',
          '      if (ancestor !== null) {',
          "        throw new CngxRuntimeError('CNGX1001', 'misuse');",
          '      }',
          '    });',
          '  }',
          '}',
        ].join('\n'),
      ).violations,
    ).toEqual([]);
  });

  it('fails a guarded construction in a static field initialiser or at module scope', () => {
    const message = `${GUARD} && 'm'`;
    expect(
      fixture(`class C { static e = new CngxRuntimeError('CNGX1001', ${message}); }`).violations,
    ).toEqual([`projects/common/a.ts:1 T3 CNGX1001 ${MODULE_LOAD_GUARD}`]);
    expect(fixture(`const e = new CngxRuntimeError('CNGX1001', ${message});`).violations).toEqual([
      `projects/common/a.ts:1 T3 CNGX1001 ${MODULE_LOAD_GUARD}`,
    ]);
  });

  it('passes a guarded construction in a static field of a class declared inside a function', () => {
    const message = `${GUARD} && 'm'`;
    expect(
      fixture(
        `function make() { return class { static e = new CngxRuntimeError('CNGX1001', ${message}); }; }`,
      ).violations,
    ).toEqual([]);
  });

  it('fails a message built before the guard and a call result as the message', () => {
    expect(
      fixture(
        [
          'function f(x: unknown) {',
          "  const m = 'bad value ' + JSON.stringify(x);",
          `  throw new CngxRuntimeError('CNGX1001', ${GUARD} && m);`,
          '}',
        ].join('\n'),
      ).violations,
    ).toEqual([
      'projects/common/a.ts:3 T3 CNGX1001 message is not text written in place; inline the string, template or concatenation behind the guard',
    ]);
    expect(
      fixture(
        `function f(e: unknown) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && describeError(e)); }`,
      ).violations,
    ).toHaveLength(1);
    expect(
      fixture(
        `const M = 'm';\nfunction f() { if (${GUARD}) { throw new CngxRuntimeError('CNGX1001', M); } }`,
      ).violations,
    ).toHaveLength(1);
  });

  it('fails a concatenation whose first operand is not literal text', () => {
    const message = (tail) =>
      fixture(
        `function f(m: string) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && ${tail}); }`,
      ).violations;
    expect(message("m + ''")).toHaveLength(1);
    expect(message("m + ' text'")).toHaveLength(1);
    expect(message("'[cngxX] ' + m")).toEqual([]);
  });

  it('passes a template, a concatenation and a dev wrapper parameter as the message', () => {
    expect(
      fixture(
        [
          `function f(x: string) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && \`bad \${x}\`); }`,
          `function g(x: string) { throw new CngxRuntimeError('CNGX1002', ${GUARD} && 'bad ' + x); }`,
          `function h(m: string) { if (!(${GUARD})) { return; } throw new CngxRuntimeError('CNGX1003', m); }`,
        ].join('\n'),
      ).violations,
    ).toEqual([]);
  });

  it('fails a cause that builds an error with text, and any other options', () => {
    const options = (text) =>
      fixture(text).violations.filter((v) => v.includes('options must be omitted'));
    expect(
      options(
        `function f() { throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm', { cause: new Error('text') }); }`,
      ),
    ).toEqual([
      'projects/common/a.ts:1 T3 CNGX1001 options must be omitted or { cause: <enclosing catch variable> }',
    ]);
    expect(
      options(
        `function f(e: unknown) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm', { cause: e }); }`,
      ),
    ).toHaveLength(1);
    expect(
      options(
        `function f() { try { w(); } catch (e) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm', { cause: e, extra: 'text' }); } }`,
      ),
    ).toHaveLength(1);
    expect(
      options(
        `function f() { if (${GUARD}) { throw new CngxRuntimeError('CNGX1001', 'm', { cause: new Error('dev') }); } }`,
      ),
    ).toEqual([]);
  });

  it('fails a guard whose ngDevMode is a local binding', () => {
    expect(
      fixture(
        `function f(ngDevMode: boolean) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm'); }`,
      ).violations,
    ).toEqual([
      'projects/common/a.ts:1 T3 a local ngDevMode shadows the global; its guards never fold in production',
    ]);
  });
});

describe('raw-throw guard - T3 shadows and module load', () => {
  const construct = `throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm');`;

  it('fails a class, enum, namespace or import-equals named ngDevMode', () => {
    for (const shadow of [
      'class ngDevMode {}',
      'enum ngDevMode { On }',
      'namespace ngDevMode { export const on = true; }',
      "import ngDevMode = require('./dev');",
    ]) {
      expect(fixture(`${shadow}\nfunction f() { ${construct} }`).violations).toEqual([
        'projects/common/a.ts:1 T3 a local ngDevMode shadows the global; its guards never fold in production',
      ]);
    }
  });

  it('fails a guarded construction inside a function invoked at module scope', () => {
    expect(fixture(`(() => { ${construct} })();`).violations).toEqual([
      `projects/common/a.ts:1 T3 CNGX1001 ${MODULE_LOAD_GUARD}`,
    ]);
    expect(fixture(`(function () { ${construct} })();`).violations).toHaveLength(1);
    expect(fixture(`(function () { ${construct} }).call(this);`).violations).toHaveLength(1);
    expect(fixture(`(() => { ${construct} }).apply(undefined, []);`).violations).toHaveLength(1);
    expect(fixture(`const run = () => { ${construct} };`).violations).toEqual([]);
  });

  it('fails a construction in a function invoked in place through a cast, bind, new or a string member', () => {
    for (const shape of [
      `((() => { ${construct} }) as () => void)();`,
      `(<() => void>(() => { ${construct} }))();`,
      `(function () { ${construct} }).bind(null)();`,
      `new (function () { ${construct} })();`,
      `(function () { ${construct} })['apply'](this, []);`,
    ]) {
      expect(fixture(shape).violations, shape).toEqual([
        `projects/common/a.ts:1 T3 CNGX1001 ${MODULE_LOAD_GUARD}`,
      ]);
    }
    expect(fixture(`const run = (() => { ${construct} }).bind(null);`).violations).toEqual([]);
  });

  it('fails a construction invoked through a comma callee, bind then call or apply, or a class built in place', () => {
    for (const shape of [
      `(0, () => { ${construct} })();`,
      `(function () { ${construct} }).bind(null).apply(this, []);`,
      `(() => { ${construct} }).bind(null)['call'](this);`,
      `new (class { constructor() { ${construct} } })();`,
      `new class { constructor() { ${construct} } }();`,
    ]) {
      expect(fixture(shape).violations, shape).toEqual([
        `projects/common/a.ts:1 T3 CNGX1001 ${MODULE_LOAD_GUARD}`,
      ]);
    }
    for (const later of [
      `const run = (0, () => { ${construct} });`,
      `const C = class { constructor() { ${construct} } };`,
      `new (class { run() { ${construct} } })();`,
    ]) {
      expect(fixture(later).violations, later).toEqual([]);
    }
  });
});

describe('raw-throw guard - T4 references', () => {
  it('passes new, instanceof, plain imports and exports, and type positions', () => {
    expect(
      fixture(
        [
          "import { CngxRuntimeError } from '@cngx/utils';",
          "export { CngxRuntimeError } from '@cngx/utils';",
          'function f(err: unknown): CngxRuntimeError | null {',
          '  return err instanceof CngxRuntimeError ? err : null;',
          '}',
          "function g() { throw new CngxRuntimeError('CNGX1001'); }",
        ].join('\n'),
      ).violations,
    ).toEqual([]);
  });

  it('passes qualified and import-type names in type positions', () => {
    expect(
      fixture(
        [
          "type A = typeof import('@cngx/utils').CngxRuntimeError;",
          "type B = import('@cngx/utils').CngxRuntimeError;",
          'type C = utils.CngxRuntimeError;',
          'type D = typeof utils.CngxRuntimeError;',
        ].join('\n'),
      ).violations,
    ).toEqual([]);
  });

  it('allows the declaration only in runtime-error.ts', () => {
    const declaration = 'export class CngxRuntimeError extends Error {}';
    expect(fixture(declaration, RUNTIME_ERROR_FILE).violations).toEqual([]);
    expect(fixture(declaration).violations).toHaveLength(1);
  });

  it('fails an alias, a namespace member and a value use', () => {
    expect(fixture("import { CngxRuntimeError as E } from '@cngx/utils';").violations).toHaveLength(
      1,
    );
    expect(
      fixture("function f() { throw new u.CngxRuntimeError('CNGX1001'); }").violations,
    ).toEqual([
      'projects/common/a.ts:1 T4 CngxRuntimeError is read through a namespace or object; construct it with new',
    ]);
    expect(fixture('const E = CngxRuntimeError;').violations).toHaveLength(1);
    expect(
      fixture("function f() { throw new u['CngxRuntimeError']('CNGX1001'); }").violations,
    ).toEqual([
      'projects/common/a.ts:1 T4 CngxRuntimeError is read by element access; construct it with new',
    ]);
    expect(fixture('class Mine extends CngxRuntimeError {}').violations).toHaveLength(1);
  });
});

describe('raw-throw guard - exemptions', () => {
  const raw = new Map([['projects/core/x.ts', 2]]);
  const built = new Map([
    ['projects/core/x.ts', 2],
    ['projects/core/y.ts', 1],
  ]);
  const row = (file, count, constructions, reason = 'why') => ({
    file,
    count,
    constructions,
    reason,
  });

  it('passes exact rows with a reason, also a construction-only row', () => {
    expect(
      exemptionProblems(raw, built, [
        row('projects/core/x.ts', 2, 2),
        row('projects/core/y.ts', 0, 1),
      ]),
    ).toEqual([]);
  });

  it('fails a stale row, a wrong count and a reasonless row', () => {
    expect(exemptionProblems(raw, built, [row('projects/core/gone.ts', 1, 0)])).toEqual([
      'projects/core/gone.ts: source 0, exemption 1',
    ]);
    expect(exemptionProblems(raw, built, [row('projects/core/x.ts', 1, 2)])).toEqual([
      'projects/core/x.ts: source 2, exemption 1',
    ]);
    expect(exemptionProblems(raw, built, [row('projects/core/x.ts', 2, 2, ' ')])).toEqual([
      'projects/core/x.ts: exemption without a reason',
    ]);
  });

  it('fails a stale constructions count and a row that exempts nothing', () => {
    expect(exemptionProblems(raw, built, [row('projects/core/x.ts', 2, 1)])).toEqual([
      'projects/core/x.ts: source constructions 2, exemption 1',
    ]);
    expect(exemptionProblems(raw, built, [row('projects/core/z.ts', 0, 0)])).toEqual([
      'projects/core/z.ts: exemption with no throw and no construction',
    ]);
  });
});

describe('raw-throw guard - T5 error constructions', () => {
  const sitesOf = (text, path = 'projects/common/a.ts') => fixture(text, path).sites;

  it('fails an error handed to a callback, a subscriber, throwError and a stored error', () => {
    expect(
      sitesOf(
        [
          "function a(h) { h.onError(new Error('x')); }",
          "function b(s) { s.error(new TypeError('x')); }",
          "const c = () => throwError(() => new Error('x'));",
          "class D { readonly last = new RangeError('x'); }",
        ].join('\n'),
      ),
    ).toEqual([
      'projects/common/a.ts:1 T5 new Error',
      'projects/common/a.ts:2 T5 new TypeError',
      'projects/common/a.ts:3 T5 new Error',
      'projects/common/a.ts:4 T5 new RangeError',
    ]);
  });

  it('fails Error() without new, a DOMException and a subclass of a built-in error', () => {
    expect(
      sitesOf(
        [
          "const a = Error('x');",
          "const b = new DOMException('x', 'AbortError');",
          'class E extends Error {}',
          'const F = class extends AggregateError {};',
        ].join('\n'),
      ),
    ).toEqual([
      'projects/common/a.ts:1 T5 call Error',
      'projects/common/a.ts:2 T5 new DOMException',
      'projects/common/a.ts:3 T5 extends Error',
      'projects/common/a.ts:4 T5 extends AggregateError',
    ]);
  });

  it('passes a shadowed Error, CngxRuntimeError and the runtime-error declaration', () => {
    expect(
      sitesOf(
        [
          "import { Error } from './errors';",
          "const a = new Error('x');",
          "function b(TypeError) { return new TypeError('x'); }",
          "const c = new CngxRuntimeError('CNGX1001');",
          'const d = hasError(1);',
        ].join('\n'),
      ),
    ).toEqual([]);
    expect(
      sitesOf('export class CngxRuntimeError extends Error {}', 'projects/utils/runtime-error.ts'),
    ).toEqual([]);
  });

  it('counts constructions per file next to the T1 throws', () => {
    const { raw, constructions } = fixture(
      ["throw new Error('a');", "h.onError(new Error('b'));"].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(1);
    expect(constructions.get('projects/common/a.ts')).toBe(2);
  });
});

describe('raw-throw guard - projects/**', () => {
  let result;
  let elapsed;
  beforeAll(() => {
    const started = performance.now();
    result = checkSources(readSources());
    elapsed = performance.now() - started;
  });

  it('runs in under 5 s', () => {
    expect(elapsed).toBeLessThan(5000);
  });

  it('has no uncoded, out-of-range, unguarded or aliased CngxRuntimeError', () => {
    expect(result.violations).toEqual([]);
  });

  it('matches the exemptions exactly, each with a reason', () => {
    expect(exemptionProblems(result.raw, result.constructions)).toEqual([]);
  });

  it('constructs no raw error outside the exemptions (T5)', () => {
    const exempt = new Set(RAW_THROW_EXEMPT.map((e) => e.file));
    expect(
      result.sites.filter((site) => !exempt.has(site.slice(0, site.indexOf(':')))),
      'Raw error constructions found; hand over a CngxRuntimeError instead, or model the outcome (a refusal is not an error).',
    ).toEqual([]);
  });

  it('has no raw throw outside the exemptions', () => {
    const exempt = new Set(RAW_THROW_EXEMPT.map((e) => e.file));
    const actual = new Map([...result.raw].filter(([file]) => !exempt.has(file)));
    expect(
      [...actual.keys()],
      `Raw throws found; throw CngxRuntimeError instead. Per lib:\n${JSON.stringify(groupPerLib(actual), null, 2)}`,
    ).toEqual([]);
  });
});
