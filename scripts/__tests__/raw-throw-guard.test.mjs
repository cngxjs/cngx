// A library throw constructs a `CngxRuntimeError` (`projects/utils/runtime-error.ts`)
// with a code, so a consumer can match it and a production build ships only
// the code. The message sits behind the inline guard
// `typeof ngDevMode !== 'undefined' && ngDevMode`, which the production build
// folds to `false`.
//
// T1  no `throw` and no `Promise.reject(...)` whose operand builds a raw
//     error: it constructs or calls `Error`, another `...Error` class or
//     `DOMException` anywhere inside it (`Object.assign(new Error(), ...)`
//     counts), or calls a function of the same file that returns one
//     (`throw make()`, also through further local factories). Allowed only
//     in a file of the shrink-only baseline or RAW_THROW_EXEMPT.
//     `throw <identifier>` counts when that binding is initialised or
//     assigned a raw error anywhere in the file (a captured outer `const`, a
//     reassigned `let`); a rethrow of a caught value passes. Not covered: a
//     factory imported from another module, and a factory that returns a
//     variable instead of the construction.
// T2  every `new CngxRuntimeError` has a `CNGXnnnn` literal first argument in
//     the file's lib range.
// T3  the message is an `&&` chain starting with the guard, unless the
//     construction itself is dev-only; a guarded construction does not run at
//     module load, where `ngDevMode` can still be undefined in a dev build.
// T4  `CngxRuntimeError` is only constructed, tested with `instanceof`,
//     imported, exported or named in a type: an alias, a namespace or
//     element access (`ns['CngxRuntimeError']`) or any other value use hides
//     the construction from T2/T3, the manifest and the prod-strip check.
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
  collectRuntimeErrors,
  lineOf,
  localNgDevModeLines,
  parse,
  singleFileChecker,
} from '../dev-diagnostics.mjs';
import { libOf, rangeOf, readSources } from '../error-codes-manifest.mjs';
import { RAW_THROW_BASELINE } from './raw-throw-baseline.mjs';
import { isExampleSource } from './source-roots.mjs';

/**
 * Files allowed to throw a raw error. Exact count: a new throw in an exempt
 * file fails, and so does a row whose throws are gone.
 *
 * @type {{ file: string; count: number; reason: string }[]}
 */
const RAW_THROW_EXEMPT = [
  {
    file: 'projects/core/testing/vitest/announcement-matchers.ts',
    count: 3,
    reason:
      'matcher argument validation inside a test runner; TypeError is the matcher-misuse convention and never runs in an app bundle',
  },
  {
    file: 'projects/forms/select/shared/__test-helpers/field-skin-host.ts',
    count: 1,
    reason: 'spec-only harness, not reachable from any public-api.ts',
  },
  {
    file: 'projects/forms/filter-builder/filter-builder.helpers.ts',
    count: 1,
    reason: 'never exhaustiveness check, unreachable for typed callers',
  },
];

/** The file that declares the class; its own declaration is no value use. */
const RUNTIME_ERROR_FILE = 'projects/utils/runtime-error.ts';
const CODE_PATTERN = /^CNGX\d{4}$/;

/** `node` through parentheses, `as`, `satisfies`, `!` and `<T>` casts. */
const unwrap = (node) => {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
};

/** The class name a `new X()` / `X()` / `new ns.X()` operand constructs or calls. */
const constructedName = (operand) => {
  const inner = unwrap(operand);
  if (!ts.isNewExpression(inner) && !ts.isCallExpression(inner)) {
    return null;
  }
  const callee = unwrap(inner.expression);
  if (ts.isIdentifier(callee)) {
    return callee.text;
  }
  return ts.isPropertyAccessExpression(callee) ? callee.name.text : null;
};

/** Error classes whose name does not end in `Error`. */
const RAW_ERROR_CLASSES = new Set(['DOMException']);

const isRawErrorName = (name) =>
  name !== null &&
  name !== RUNTIME_ERROR &&
  (name.endsWith('Error') || RAW_ERROR_CLASSES.has(name));

/**
 * Does `expr` construct or call a raw error class, or call a local factory
 * (`isFactoryCall`), outside nested functions?
 */
const buildsRawError = (expr, isFactoryCall = () => false) => {
  let found = false;
  const visit = (node) => {
    if (found || ts.isFunctionLike(node)) {
      return;
    }
    if (
      (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
      (isRawErrorName(constructedName(node)) || isFactoryCall(node))
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(expr);
  return found;
};

/** A named function of the file: a declaration or a const bound to an arrow / function expression. */
const namedFunctions = (sf) => {
  const out = [];
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      out.push({ name: node.name, fn: node });
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      out.push({ name: node.name, fn: node.initializer });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
};

/** Does the function return an expression that `builds`? Nested functions are not its returns. */
const returnsRawError = (fn, builds) => {
  if (!ts.isBlock(fn.body)) {
    return builds(fn.body);
  }
  let found = false;
  const visit = (node) => {
    if (found || ts.isFunctionLike(node)) {
      return;
    }
    if (ts.isReturnStatement(node) && node.expression && builds(node.expression)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(fn.body, visit);
  return found;
};

/**
 * The symbols of the file's local error factories, to a fixpoint: a function
 * that returns a raw error, or the result of another local factory.
 */
function localFactories(sf, symbolOf) {
  const factories = new Set();
  const isFactoryCall = (node) =>
    ts.isCallExpression(node) &&
    ts.isIdentifier(unwrap(node.expression)) &&
    factories.has(symbolOf(unwrap(node.expression)));
  const builds = (expr) => buildsRawError(expr, isFactoryCall);
  const candidates = namedFunctions(sf);
  let grew = true;
  while (grew) {
    grew = false;
    for (const { name, fn } of candidates) {
      const symbol = symbolOf(name);
      if (symbol && !factories.has(symbol) && returnsRawError(fn, builds)) {
        factories.add(symbol);
        grew = true;
      }
    }
  }
  return isFactoryCall;
}

const ASSIGNMENTS = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
]);

/**
 * The symbols of every binding in `sf` that is initialised or assigned a raw
 * error. Resolved through the checker, so a same-named binding in another
 * scope is a different symbol.
 */
function rawErrorBindings(sf, symbolOf, builds) {
  const out = new Set();
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      builds(node.initializer)
    ) {
      out.add(symbolOf(node.name));
    }
    if (
      ts.isBinaryExpression(node) &&
      ASSIGNMENTS.has(node.operatorToken.kind) &&
      ts.isIdentifier(unwrap(node.left)) &&
      builds(node.right)
    ) {
      out.add(symbolOf(unwrap(node.left)));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  out.delete(undefined);
  return out;
}

/** `Promise.reject(x)`: the rejected operand, else null. */
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
  return isReject && node.arguments.length > 0 ? node.arguments[0] : null;
};

/** Lines of every raw error throw or rejection (T1) in one file. */
export function rawThrowLines(path, text) {
  if (!text.includes('throw') && !text.includes('Promise.reject')) {
    return [];
  }
  const sf = parse(path, text);
  let checker;
  const symbolOf = (id) => (checker ??= singleFileChecker(sf)).getSymbolAtLocation(id);
  let isFactoryCall;
  const builds = (expr) => {
    isFactoryCall ??= localFactories(sf, symbolOf);
    return buildsRawError(expr, isFactoryCall);
  };
  let bindings;
  const isRawOperand = (expr) => {
    const operand = unwrap(expr);
    if (!ts.isIdentifier(operand)) {
      return builds(operand);
    }
    bindings ??= rawErrorBindings(sf, symbolOf, builds);
    return bindings.has(symbolOf(operand));
  };
  const lines = [];
  const visit = (node) => {
    const operand = ts.isThrowStatement(node) ? node.expression : rejectedOperand(node);
    if (operand && isRawOperand(operand)) {
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
 * Runs T1-T4 over `files` ([{ path, text }]).
 *
 * @returns {{ raw: Map<string, number>; violations: string[] }}
 */
export function checkSources(allFiles) {
  const files = allFiles.filter(({ path }) => !isExampleSource(path));
  const raw = new Map();
  const violations = [];
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
  return { raw, violations };
}

/** The baseline as a flat `file -> count` map. */
const baselineMap = () =>
  new Map(Object.values(RAW_THROW_BASELINE).flatMap((rows) => rows.map((r) => [r.file, r.count])));

/** The raw sites grouped per lib, in the baseline's own shape. */
export function groupPerLib(raw) {
  const out = {};
  for (const [file, count] of [...raw].sort(([a], [b]) => a.localeCompare(b))) {
    (out[libOf(file)] ??= []).push({ file, count });
  }
  return out;
}

/** Exemption rows that do not match `raw` exactly or carry no reason. */
export function exemptionProblems(raw, exempt = RAW_THROW_EXEMPT) {
  const out = [];
  for (const row of exempt) {
    if (!row.reason?.trim()) {
      out.push(`${row.file}: exemption without a reason`);
    }
    const actual = raw.get(row.file) ?? 0;
    if (actual !== row.count) {
      out.push(`${row.file}: source ${actual}, exemption ${row.count}`);
    }
  }
  return out;
}

const fixture = (text, path = 'projects/common/a.ts') => checkSources([{ path, text }]);
const GUARD = "typeof ngDevMode !== 'undefined' && ngDevMode";

describe('raw-throw guard - T1 raw throws', () => {
  it('counts constructed and called errors, never comments, strings or rethrows', () => {
    const { raw } = fixture(
      [
        "// throw new Error('in a comment');",
        'const s = \'throw new Error("in a string")\';',
        'function f(err: unknown) {',
        "  if (a) { throw new Error('a'); }",
        "  if (b) { throw new TypeError('b'); }",
        "  if (c) { throw Error('c'); }",
        "  if (d) { throw new errors.DomainError('d'); }",
        '  throw err;',
        '}',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(4);
  });

  it('counts a raw error wrapped in a call or bound to a local before the throw', () => {
    const { raw } = fixture(
      [
        'function f() {',
        "  if (a) { throw Object.assign(new Error('a'), { status: 1 }); }",
        "  const e = new TypeError('b');",
        '  throw e;',
        '}',
        'function g() {',
        "  let err = cond ? new Error('c') : null;",
        '  throw err;',
        '}',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(3);
  });

  it('follows the binding: a reassigned let and a captured outer const count', () => {
    const { raw } = fixture(
      [
        'function f() {',
        '  let e;',
        "  e = new Error('a');",
        '  throw e;',
        '}',
        "const outer = new RangeError('b');",
        'function g() {',
        '  return () => {',
        '    throw outer;',
        '  };',
        '}',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(2);
  });

  it('counts a local factory, also through a further factory, and DOMException', () => {
    const { raw } = fixture(
      [
        "function make() { return new Error('a'); }",
        'const wrap = () => make();',
        'const typed = (m: string) => new TypeError(m);',
        'function f() {',
        '  if (a) { throw make(); }',
        '  if (b) { throw wrap(); }',
        "  if (c) { throw typed('c'); }",
        "  throw new DOMException('d');",
        '}',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(4);
  });

  it('passes a factory of CngxRuntimeError and a function that only builds an error inside', () => {
    const { raw } = fixture(
      [
        "function make() { return new CngxRuntimeError('CNGX1001'); }",
        "function other() { const ignored = () => new Error('x'); return 1; }",
        'function f() {',
        '  if (a) { throw make(); }',
        '  throw other();',
        '}',
      ].join('\n'),
    );
    expect(raw.size).toBe(0);
  });

  it('counts a rejection with a raw error, not one that passes a caught value on', () => {
    const { raw } = fixture(
      [
        "function f() { return Promise.reject(new Error('a')); }",
        'function g() {',
        "  const e = new RangeError('b');",
        '  return Promise.reject(e);',
        '}',
        'function h(err: unknown) { return Promise.reject(err); }',
      ].join('\n'),
    );
    expect(raw.get('projects/common/a.ts')).toBe(2);
  });

  it('does not count a same-named local of a nested function', () => {
    const { raw } = fixture(
      [
        'function f(e: unknown) {',
        "  const inner = () => { const e = new Error('x'); return e; };",
        '  inner();',
        '  throw e;',
        '}',
      ].join('\n'),
    );
    expect(raw.size).toBe(0);
  });

  it('passes a rethrow of a caught value and a local that holds no raw error', () => {
    const { raw } = fixture(
      [
        'function f() {',
        '  try { work(); } catch (err) { throw err; }',
        "  const e = new CngxRuntimeError('CNGX1001');",
        '  throw e;',
        '}',
        "function g() { const e = new Error('elsewhere'); return e; }",
        'function h(e: unknown) { throw e; }',
      ].join('\n'),
    );
    expect(raw.size).toBe(0);
  });

  it('passes a CngxRuntimeError throw and a thrown non-error value', () => {
    const { raw } = fixture(
      [
        'function f() {',
        `  if (a) { throw new CngxRuntimeError('CNGX1001', ${GUARD} && 'm'); }`,
        '  throw new Thing();',
        '}',
      ].join('\n'),
    );
    expect(raw.size).toBe(0);
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

  it('passes an exact row with a reason', () => {
    expect(
      exemptionProblems(raw, [{ file: 'projects/core/x.ts', count: 2, reason: 'why' }]),
    ).toEqual([]);
  });

  it('fails a stale row, a wrong count and a reasonless row', () => {
    expect(
      exemptionProblems(raw, [{ file: 'projects/core/gone.ts', count: 1, reason: 'why' }]),
    ).toEqual(['projects/core/gone.ts: source 0, exemption 1']);
    expect(
      exemptionProblems(raw, [{ file: 'projects/core/x.ts', count: 1, reason: 'why' }]),
    ).toEqual(['projects/core/x.ts: source 2, exemption 1']);
    expect(exemptionProblems(raw, [{ file: 'projects/core/x.ts', count: 2, reason: ' ' }])).toEqual(
      ['projects/core/x.ts: exemption without a reason'],
    );
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
    expect(exemptionProblems(result.raw)).toEqual([]);
  });

  it('matches the shrink-only baseline exactly (drop a row when you migrate a file)', () => {
    const exempt = new Set(RAW_THROW_EXEMPT.map((e) => e.file));
    const actual = new Map([...result.raw].filter(([file]) => !exempt.has(file)));
    const expected = baselineMap();
    const drift = [...new Set([...actual.keys(), ...expected.keys()])]
      .filter((file) => actual.get(file) !== expected.get(file))
      .map(
        (file) => `${file}: source ${actual.get(file) ?? 0}, baseline ${expected.get(file) ?? 0}`,
      );
    expect(
      drift,
      `Raw throws drifted; throw CngxRuntimeError instead. Current state, per lib:\n${JSON.stringify(groupPerLib(actual), null, 2)}`,
    ).toEqual([]);
  });
});
