// Every developer diagnostic in the libs goes through `cngxDevWarn` /
// `cngxDevError` (`projects/utils/dev-message.ts`) behind the inline guard
// `typeof ngDevMode !== 'undefined' && ngDevMode`, which the production build
// folds to `false`. `isDevMode()` and a guard inside a called function do not
// fold, so the message text would ship.
//
// R1  no reference to the global `console` outside dev-message.ts, unless the
//     file is in the shrink-only baseline or in RAW_CONSOLE_EXEMPT.
// R2  every helper call has a `CNGXnnnn` literal first argument and a lexical
//     inline guard.
// R3  the code lies in the calling file's lib range.
// R4  every direct call of a guard-first dev wrapper is lexically guarded;
//     a wrapper used as a value (indirect sink) is reported, not failed.

import { performance } from 'node:perf_hooks';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { collectHelperCalls, libOf, rangeOf, readSources } from '../error-codes-manifest.mjs';
import { RAW_CONSOLE_BASELINE } from './raw-console-baseline.mjs';

/**
 * Files allowed to reference `console` directly. Starts empty; every entry
 * needs a reason a reviewer can check.
 *
 * @type {{ file: string; reason: string }[]}
 */
const RAW_CONSOLE_EXEMPT = [];

const HELPER_FILE = 'projects/utils/dev-message.ts';
const CODE_PATTERN = /^CNGX\d{4}$/;
const GLOBAL_HOSTS = new Set(['globalThis', 'window', 'self']);

const unparen = (node) => {
  let current = node;
  while (ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }
  return current;
};

const isAnd = (node) =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken;

/** The operands of an `&&` chain, left to right, through parentheses. */
const andLeaves = (node) => {
  const inner = unparen(node);
  return isAnd(inner) ? [...andLeaves(inner.left), ...andLeaves(inner.right)] : [inner];
};

const isTypeofCheck = (node) =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
  ts.isTypeOfExpression(node.left) &&
  ts.isIdentifier(node.left.expression) &&
  node.left.expression.text === 'ngDevMode' &&
  ts.isStringLiteral(node.right) &&
  node.right.text === 'undefined';

const isNgDevMode = (node) => ts.isIdentifier(node) && node.text === 'ngDevMode';

/** Does the `&&` chain begin with `typeof ngDevMode !== 'undefined' && ngDevMode`? */
const startsWithGuard = (node) => {
  const leaves = andLeaves(node);
  return leaves.length >= 2 && isTypeofCheck(leaves[0]) && isNgDevMode(leaves[1]);
};

const isNegatedGuard = (node) => {
  const inner = unparen(node);
  return (
    ts.isPrefixUnaryExpression(inner) &&
    inner.operator === ts.SyntaxKind.ExclamationToken &&
    andLeaves(inner.operand).length === 2 &&
    startsWithGuard(inner.operand)
  );
};

const isReturnOnly = (node) =>
  ts.isReturnStatement(node) ||
  (ts.isBlock(node) && node.statements.length === 1 && ts.isReturnStatement(node.statements[0]));

/** `if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) { return ...; }` */
const isEarlyReturn = (statement) =>
  ts.isIfStatement(statement) &&
  !statement.elseStatement &&
  isNegatedGuard(statement.expression) &&
  isReturnOnly(statement.thenStatement);

const isFunctionBoundary = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isConstructorDeclaration(node) ||
  ts.isGetAccessorDeclaration(node) ||
  ts.isSetAccessorDeclaration(node) ||
  ts.isClassStaticBlockDeclaration(node) ||
  ts.isSourceFile(node);

/**
 * Is `node` behind an inline dev-mode guard in the same file? The guard may
 * sit outside an arrow function or function expression, never outside a
 * named function declaration or method.
 */
export function isLexicallyGuarded(node) {
  let child = node;
  let parent = node.parent;
  while (parent && !isFunctionBoundary(parent)) {
    if (
      ts.isIfStatement(parent) &&
      child === parent.thenStatement &&
      startsWithGuard(parent.expression)
    ) {
      return true;
    }
    if (isAnd(parent) && child === parent.right && startsWithGuard(parent.left)) {
      return true;
    }
    if (
      ts.isConditionalExpression(parent) &&
      child === parent.whenTrue &&
      startsWithGuard(parent.condition)
    ) {
      return true;
    }
    if (ts.isBlock(parent)) {
      const index = parent.statements.indexOf(child);
      if (parent.statements.slice(0, index).some(isEarlyReturn)) {
        return true;
      }
    }
    child = parent;
    parent = parent.parent;
  }
  return false;
}

const parse = (path, text) =>
  ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

/**
 * A checker over the one file, with no lib and no resolution: the global
 * `console` resolves to no symbol, a local binding of the same name does.
 */
function singleFileChecker(sf) {
  const options = { noLib: true, noResolve: true, types: [], allowJs: false };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === sf.fileName ? sf : undefined);
  host.fileExists = (name) => name === sf.fileName;
  return ts.createProgram([sf.fileName], options, host).getTypeChecker();
}

const isNameOfDeclaration = (node) => {
  const parent = node.parent;
  return (
    (ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodSignature(parent) ||
      ts.isGetAccessorDeclaration(parent) ||
      ts.isSetAccessorDeclaration(parent) ||
      ts.isEnumMember(parent)) &&
    parent.name === node
  );
};

/** Lines of every reference to the global `console` in one file. */
export function rawConsoleLines(path, text) {
  if (!text.includes('console')) {
    return [];
  }
  const sf = parse(path, text);
  let checker;
  const lines = [];
  const visit = (node) => {
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      GLOBAL_HOSTS.has(node.expression.text) &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      node.argumentExpression.text === 'console'
    ) {
      lines.push(lineOf(sf, node));
    }
    if (ts.isIdentifier(node) && node.text === 'console') {
      const parent = node.parent;
      if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
        if (ts.isIdentifier(parent.expression) && GLOBAL_HOSTS.has(parent.expression.text)) {
          lines.push(lineOf(sf, node));
        }
      } else if (!isNameOfDeclaration(node) && !ts.isBindingElement(parent)) {
        checker ??= singleFileChecker(sf);
        if (!checker.getSymbolAtLocation(node)?.declarations?.length) {
          lines.push(lineOf(sf, node));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return lines;
}

/** The name a function-like node is called by, or null. */
function functionName(node) {
  if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
    return ts.isIdentifier(node.name) ? node.name.text : null;
  }
  if (
    (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer === node &&
    ts.isIdentifier(node.parent.name) &&
    ts.isVariableDeclarationList(node.parent.parent) &&
    node.parent.parent.flags & ts.NodeFlags.Const
  ) {
    return node.parent.name.text;
  }
  return null;
}

const isExported = (node) => {
  const holder = ts.isFunctionDeclaration(node) ? node : node.parent?.parent?.parent;
  return Boolean(
    holder &&
    (ts.isFunctionDeclaration(holder) || ts.isVariableStatement(holder)) &&
    holder.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
  );
};

/**
 * Every guard-first function that contains a helper call: a dev wrapper.
 *
 * @param {{ node: ts.CallExpression }[]} calls helper calls
 */
export function collectWrappers(calls) {
  const seen = new Map();
  for (const { node, file } of calls) {
    for (let fn = node.parent; fn; fn = fn.parent) {
      const name = functionName(fn);
      if (!name || seen.has(fn)) {
        continue;
      }
      const body = fn.body;
      if (
        body &&
        ts.isBlock(body) &&
        body.statements.length > 0 &&
        isEarlyReturn(body.statements[0])
      ) {
        seen.set(fn, {
          file,
          name,
          kind: ts.isMethodDeclaration(fn) ? 'method' : 'function',
          exported: isExported(fn),
        });
      }
    }
  }
  return [...seen.values()];
}

/**
 * Direct calls of a wrapper (by name in its own file, by imported name
 * elsewhere) and wrapper references used as values.
 */
export function collectWrapperUses(files, wrappers) {
  const exportedNames = new Set(wrappers.filter((w) => w.exported).map((w) => w.name));
  const calls = [];
  const indirect = [];
  for (const { path, text } of files) {
    const local = wrappers.filter((w) => w.file === path);
    if (local.length === 0 && ![...exportedNames].some((name) => text.includes(name))) {
      continue;
    }
    const sf = parse(path, text);
    const names = new Set(local.filter((w) => w.kind === 'function').map((w) => w.name));
    const methods = new Set(local.filter((w) => w.kind === 'method').map((w) => w.name));
    for (const statement of sf.statements) {
      const bindings = ts.isImportDeclaration(statement) && statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          if (exportedNames.has((element.propertyName ?? element.name).text)) {
            names.add(element.name.text);
          }
        }
      }
    }
    if (names.size === 0 && methods.size === 0) {
      continue;
    }
    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        const byName = ts.isIdentifier(callee) && names.has(callee.text);
        const byThis =
          ts.isPropertyAccessExpression(callee) &&
          callee.expression.kind === ts.SyntaxKind.ThisKeyword &&
          methods.has(callee.name.text);
        if (byName || byThis) {
          calls.push({ file: path, line: lineOf(sf, node), name: callee.getText(sf), node });
        }
      }
      if (ts.isIdentifier(node) && names.has(node.text) && isValueUse(node)) {
        indirect.push({ file: path, line: lineOf(sf, node), name: node.text });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return { calls, indirect };
}

function isValueUse(node) {
  const parent = node.parent;
  if (ts.isCallExpression(parent) && parent.expression === node) {
    return false;
  }
  if (
    (ts.isVariableDeclaration(parent) || ts.isFunctionDeclaration(parent)) &&
    parent.name === node
  ) {
    return false;
  }
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) {
    return false;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }
  return !isNameOfDeclaration(node);
}

/**
 * Runs R1-R4 over `files` ([{ path, text }]).
 *
 * @returns {{ raw: Map<string, number>; violations: string[]; wrappers: ReturnType<typeof collectWrappers>; indirect: { file: string; line: number; name: string }[] }}
 */
export function checkSources(files) {
  const raw = new Map();
  for (const { path, text } of files) {
    if (path === HELPER_FILE) {
      continue;
    }
    const lines = rawConsoleLines(path, text);
    if (lines.length > 0) {
      raw.set(path, lines.length);
    }
  }

  const violations = [];
  const helperCalls = collectHelperCalls(files).filter((c) => c.file !== HELPER_FILE);
  for (const call of helperCalls) {
    const where = `${call.file}:${call.line}`;
    if (call.code === null || !CODE_PATTERN.test(call.code)) {
      violations.push(`${where} R2 the first argument must be a 'CNGXnnnn' string literal`);
    } else {
      const range = rangeOf(call.code);
      const lib = libOf(call.file);
      if (!range || range.lib !== lib) {
        violations.push(`${where} R3 ${call.code} lies outside the ${lib} range`);
      }
    }
    if (!isLexicallyGuarded(call.node)) {
      violations.push(`${where} R2 ${call.code ?? 'call'} is not behind an inline ngDevMode guard`);
    }
  }

  const wrappers = collectWrappers(helperCalls);
  const { calls, indirect } = collectWrapperUses(files, wrappers);
  for (const call of calls) {
    if (!isLexicallyGuarded(call.node)) {
      violations.push(
        `${call.file}:${call.line} R4 dev wrapper ${call.name}() is called unguarded`,
      );
    }
  }
  return { raw, violations, wrappers, indirect };
}

/** The baseline as a flat `file -> count` map. */
const baselineMap = () =>
  new Map(
    Object.values(RAW_CONSOLE_BASELINE).flatMap((rows) => rows.map((r) => [r.file, r.count])),
  );

/** The raw sites grouped per lib, in the baseline's own shape. */
export function groupPerLib(raw) {
  const out = {};
  for (const [file, count] of [...raw].sort(([a], [b]) => a.localeCompare(b))) {
    (out[libOf(file)] ??= []).push({ file, count });
  }
  return out;
}

const fixture = (text, path = 'projects/core/a.ts') => checkSources([{ path, text }]);
const GUARD = "typeof ngDevMode !== 'undefined' && ngDevMode";
const NEGATED = `!(${GUARD})`;

describe('raw-console guard - R1 raw console', () => {
  it('counts calls, aliases, destructures and globalThis access', () => {
    const { raw } = fixture(
      [
        "console.warn('a');",
        'const c = console;',
        'const { error } = console;',
        "globalThis.console.log('b');",
        "window['console'].info('c');",
      ].join('\n'),
    );
    expect(raw.get('projects/core/a.ts')).toBe(5);
  });

  it('ignores comments, strings and a local console binding', () => {
    const { raw } = fixture(
      [
        "// console.warn('a')",
        "/** console.error('b') */",
        "const s = 'console.warn';",
        'function f(console: { warn(m: string): void }) { console.warn(s); }',
        'const o = { console: 1 }; o.console;',
      ].join('\n'),
    );
    expect(raw.size).toBe(0);
  });

  it('allows console in dev-message.ts', () => {
    const { raw } = fixture("console.warn('x');", HELPER_FILE);
    expect(raw.size).toBe(0);
  });
});

describe('raw-console guard - R2/R3 helper calls', () => {
  const ok = (body) => expect(fixture(body).violations).toEqual([]);
  const fails = (body) => expect(fixture(body).violations).not.toEqual([]);

  it('passes an if guard and a guard with trailing conjuncts', () => {
    ok(`if (${GUARD}) { cngxDevWarn('CNGX0001', 'm'); }`);
    ok(`if (${GUARD} && a && b) { cngxDevWarn('CNGX0001', 'm'); }`);
  });

  it('passes the && form and the parenthesised guard', () => {
    ok(`${GUARD} && cond && cngxDevWarn('CNGX0001', 'm');`);
    ok(`(${GUARD}) && cond && cngxDevWarn('CNGX0001', 'm');`);
    ok(`if (${GUARD} && (cond)) { cngxDevWarn('CNGX0001', 'm'); }`);
  });

  it('passes the ternary true branch, also with a leading-conjunct condition', () => {
    ok(`const x = ${GUARD} ? cngxDevWarn('CNGX0001', 'm') : 0;`);
    ok(`const x = ${GUARD} && cond ? cngxDevWarn('CNGX0001', 'm') : 0;`);
  });

  it('fails a call in the ternary false branch', () => {
    fails(`const x = ${GUARD} ? 0 : cngxDevWarn('CNGX0001', 'm');`);
  });

  it('passes a negated early return earlier in the function', () => {
    ok(`function f() { if (${NEGATED}) { return; } doWork(); cngxDevWarn('CNGX0001', 'm'); }`);
    ok(`class A { m() { if (${NEGATED}) { return 1; } cngxDevWarn('CNGX0001', 'm'); } }`);
  });

  it('fails isDevMode() and a trailing guard', () => {
    fails(`if (isDevMode()) { cngxDevWarn('CNGX0001', 'm'); }`);
    fails(`if (cond && ${GUARD}) { cngxDevWarn('CNGX0001', 'm'); }`);
    fails(`cngxDevWarn('CNGX0001', 'm');`);
  });

  it('passes a guard outside an afterNextRender arrow', () => {
    ok(`if (${GUARD}) { afterNextRender(() => cngxDevWarn('CNGX0001', 'm')); }`);
  });

  it('fails a guard outside a named function declaration', () => {
    fails(`if (${GUARD}) { function f() { cngxDevWarn('CNGX0001', 'm'); } }`);
  });

  it('fails a variable code and a code outside the lib range', () => {
    expect(fixture(`if (${GUARD}) { cngxDevWarn(code, 'm'); }`).violations).toEqual([
      "projects/core/a.ts:1 R2 the first argument must be a 'CNGXnnnn' string literal",
    ]);
    expect(fixture(`if (${GUARD}) { cngxDevWarn('CNGX1001', 'm'); }`).violations).toEqual([
      'projects/core/a.ts:1 R3 CNGX1001 lies outside the core range',
    ]);
  });
});

describe('raw-console guard - R4 dev wrappers', () => {
  it('does not treat a function with a deep guarded helper call as a wrapper', () => {
    const { wrappers, violations } = fixture(
      [
        'function formatMessage(t: string) {',
        `  if (bad) { if (${GUARD}) { cngxDevWarn('CNGX0001', 'm'); } }`,
        '  return t;',
        '}',
        'formatMessage("x");',
      ].join('\n'),
    );
    expect(wrappers).toEqual([]);
    expect(violations).toEqual([]);
  });

  it('does not treat a register-shaped method as a wrapper', () => {
    const { wrappers, violations } = fixture(
      [
        'class R {',
        '  register(k: string) {',
        `    if (${GUARD} && this.has(k)) { cngxDevWarn('CNGX0004', k); }`,
        '  }',
        '  run() { this.register("a"); }',
        '}',
      ].join('\n'),
    );
    expect(wrappers).toEqual([]);
    expect(violations).toEqual([]);
  });

  it('treats a guard-first function as a wrapper and fails its unguarded caller', () => {
    const { wrappers, violations } = fixture(
      [
        'function warnX(name: string) {',
        `  if (${NEGATED}) { return; }`,
        "  cngxDevWarn('CNGX0001', name);",
        '}',
        "warnX('unguarded caller argument');",
        `if (${GUARD}) { warnX('guarded'); }`,
      ].join('\n'),
    );
    expect(wrappers.map((w) => w.name)).toEqual(['warnX']);
    expect(violations).toEqual(['projects/core/a.ts:5 R4 dev wrapper warnX() is called unguarded']);
  });

  it('treats a guard-first factory returning noop as a wrapper', () => {
    const { wrappers, violations } = fixture(
      [
        'function defaultWarn(limit: number) {',
        `  if (${NEGATED}) { return noop; }`,
        "  return () => cngxDevWarn('CNGX0001', String(limit));",
        '}',
        `const hook = opt ?? (${GUARD} ? defaultWarn(3) : noop);`,
      ].join('\n'),
    );
    expect(wrappers.map((w) => w.name)).toEqual(['defaultWarn']);
    expect(violations).toEqual([]);
  });

  it('fails an unguarded this.method() call of a wrapper method', () => {
    const { violations } = fixture(
      [
        'class D {',
        `  warnY() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', 'm'); }`,
        '  run() { this.warnY(); }',
        '}',
      ].join('\n'),
    );
    expect(violations).toEqual([
      'projects/core/a.ts:3 R4 dev wrapper this.warnY() is called unguarded',
    ]);
  });

  it('follows an exported wrapper into the importing file', () => {
    const { violations } = checkSources([
      {
        path: 'projects/core/warn.ts',
        text: `export function warnZ() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', 'm'); }`,
      },
      {
        path: 'projects/core/use.ts',
        text: "import { warnZ as w } from './warn';\nw();",
      },
    ]);
    expect(violations).toEqual(['projects/core/use.ts:2 R4 dev wrapper w() is called unguarded']);
  });

  it('reports a guard-first const arrow passed as a value as indirect', () => {
    const { wrappers, indirect, violations } = fixture(
      [
        'export const DEFAULT_SINK = (slot: string) => {',
        `  if (${NEGATED}) { return; }`,
        "  cngxDevWarn('CNGX0001', slot);",
        '};',
        'const config = { sink: DEFAULT_SINK };',
      ].join('\n'),
    );
    expect(wrappers.map((w) => w.name)).toEqual(['DEFAULT_SINK']);
    expect(indirect).toEqual([{ file: 'projects/core/a.ts', line: 5, name: 'DEFAULT_SINK' }]);
    expect(violations).toEqual([]);
  });
});

describe('raw-console guard - projects/**', () => {
  const started = performance.now();
  const result = checkSources(readSources());
  const elapsed = performance.now() - started;

  it('runs in under 5 s', () => {
    expect(elapsed).toBeLessThan(5000);
  });

  it('has no unguarded, uncoded or out-of-range helper call and no unguarded wrapper call', () => {
    expect(result.violations).toEqual([]);
  });

  it('matches the shrink-only baseline exactly (drop a row when you migrate a file)', () => {
    const exempt = new Set(RAW_CONSOLE_EXEMPT.map((e) => e.file));
    const actual = new Map([...result.raw].filter(([file]) => !exempt.has(file)));
    const expected = baselineMap();
    const drift = [...new Set([...actual.keys(), ...expected.keys()])]
      .filter((file) => actual.get(file) !== expected.get(file))
      .map(
        (file) => `${file}: source ${actual.get(file) ?? 0}, baseline ${expected.get(file) ?? 0}`,
      );
    expect(
      drift,
      `Raw console references drifted. Current state, per lib:\n${JSON.stringify(groupPerLib(actual), null, 2)}`,
    ).toEqual([]);
  });

  it('gives every exemption a reason', () => {
    expect(RAW_CONSOLE_EXEMPT.filter((e) => !e.reason?.trim())).toEqual([]);
  });

  it('reports indirect dev sinks', () => {
    expect(result.indirect.every((use) => typeof use.name === 'string')).toBe(true);
  });
});
