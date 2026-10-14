// Every developer diagnostic in the libs goes through `cngxDevWarn` /
// `cngxDevError` (`projects/utils/dev-message.ts`) behind the inline guard
// `typeof ngDevMode !== 'undefined' && ngDevMode`, which the production build
// folds to `false`. `isDevMode()` and a guard inside a called function do not
// fold, so the message text would ship.
//
// R1  no reference to the global `console` outside dev-message.ts, unless the
//     file is in RAW_CONSOLE_EXEMPT.
// R2  every helper call has a `CNGXnnnn` literal first argument and a lexical
//     inline guard inside a function: a guard read at module load can run
//     before Angular sets `ngDevMode` in a dev build (also for R4).
// R3  the code lies in the calling file's lib range.
// R4  every direct call and every value use of a guard-first dev wrapper is
//     lexically guarded, and no wrapper is a class or object-literal member:
//     a wrapper production still references ships the helper and its doc URL.

import { performance } from 'node:perf_hooks';

import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  HELPER_FILE,
  MODULE_LOAD_GUARD,
  collectHelperCalls,
  collectHelperMisuse,
  collectWrapperPlacementProblems,
  collectWrapperShapeProblems,
  collectWrapperUses,
  collectWrappers,
  isLexicallyGuarded,
  isNameOfDeclaration,
  lineOf,
  localNgDevModeLines,
  parse,
  runsAtModuleLoad,
} from '../dev-diagnostics.mjs';
import { libOf, rangeOf, readSources } from '../error-codes-manifest.mjs';

/**
 * Files allowed to reference `console` directly. Starts empty; every entry
 * needs a reason a reviewer can check.
 *
 * @type {{ file: string; reason: string }[]}
 */
const RAW_CONSOLE_EXEMPT = [];

/**
 * Every dev wrapper (`file#name`) the guard derives. Exact list: a migration
 * adds its wrapper here in the same commit, and a wrapper that loses its
 * guard-first shape drops out of the derived set and fails this pin.
 */
const EXPECTED_DEV_WRAPPERS = [
  'projects/forms/filter-builder/filter-builder-operators.ts#warnUnknownFilterOperatorOnce',
  'projects/data-display/treetable/treetable.component.ts#warnUnlabeledColumns',
  'projects/forms/input/reactive-forms-channel.ts#injectDefaultAccessorWarning',
  'projects/ui/toc/toc-router-sync.directive.ts#warnRouterAbsent',
  'projects/ui/mat-tabs/decorations/decoration-projectors.ts#defaultRetryCeilingWarn',
  'projects/ui/mat-tabs/decorations/half-wired-slot-sink.ts#CNGX_DEFAULT_HALF_WIRED_SLOT_SINK',
  'projects/common/chart/presets/preset-state.ts#warnIfUnnamedPreset',
  'projects/common/dialog/dialog/dialog.directive.ts#warnDoubleRegistration',
  'projects/common/dialog/dialog/dialog.directive.ts#warnNonModalA11y',
  'projects/common/interactive/menu/menu-item-submenu.directive.ts#warnMissingSubmenuFallbacks',
  'projects/common/interactive/reorder/reorder.directive.ts#wireDevModeCheck',
  'projects/common/layout/router/warn-router-absent.ts#warnRouterAbsent',
  'projects/common/tabs/router-absent-warning.ts#warnTabsRouterAbsent',
  'projects/common/popover/popover.directive.ts#warnMissingPopoverApi',
  'projects/common/popover/popover.directive.ts#warnMissingFloatingMiddleware',
];

const CODE_PATTERN = /^CNGX\d{4}$/;
const GLOBAL_HOSTS = new Set(['globalThis', 'window', 'self']);

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

const isGlobalHost = (node) => {
  const inner = node && unwrap(node);
  return Boolean(inner && ts.isIdentifier(inner) && GLOBAL_HOSTS.has(inner.text));
};

/** `{ console } = globalThis` / `{ console: c } = window`: the key read off a global. */
const isDestructuredFromGlobal = (node) => {
  const element = node.parent;
  const isKey = element.propertyName ? element.propertyName === node : element.name === node;
  const declaration = element.parent?.parent;
  return (
    isKey &&
    ts.isObjectBindingPattern(element.parent) &&
    ts.isVariableDeclaration(declaration) &&
    isGlobalHost(declaration.initializer)
  );
};

/** Lines of every reference to the global `console` in one file. */
export function rawConsoleLines(path, text) {
  if (!text.includes('console')) {
    return [];
  }
  const sf = parse(path, text);
  let checker;
  const isUnresolved = (resolve) => {
    checker ??= singleFileChecker(sf);
    return !resolve(checker)?.declarations?.length;
  };
  const lines = [];
  const visit = (node) => {
    if (
      ts.isElementAccessExpression(node) &&
      isGlobalHost(node.expression) &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      node.argumentExpression.text === 'console'
    ) {
      lines.push(lineOf(sf, node));
    }
    if (ts.isIdentifier(node) && node.text === 'console') {
      const parent = node.parent;
      if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
        if (isGlobalHost(parent.expression)) {
          lines.push(lineOf(sf, node));
        }
      } else if (ts.isBindingElement(parent)) {
        if (isDestructuredFromGlobal(node)) {
          lines.push(lineOf(sf, node));
        }
      } else if (ts.isShorthandPropertyAssignment(parent)) {
        if (isUnresolved((c) => c.getShorthandAssignmentValueSymbol(parent))) {
          lines.push(lineOf(sf, node));
        }
      } else if (!isNameOfDeclaration(node)) {
        if (isUnresolved((c) => c.getSymbolAtLocation(node))) {
          lines.push(lineOf(sf, node));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return lines;
}

/**
 * Runs R1-R4 over `files` ([{ path, text }]).
 *
 * @returns {{ raw: Map<string, number>; violations: string[]; wrappers: ReturnType<typeof collectWrappers> }}
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
    } else if (runsAtModuleLoad(call.node)) {
      violations.push(`${where} R2 ${call.code ?? 'call'} ${MODULE_LOAD_GUARD}`);
    }
  }

  for (const misuse of collectHelperMisuse(files)) {
    violations.push(
      `${misuse.file}:${misuse.line} R2 ${misuse.reason}; call the helper directly by its own name`,
    );
  }

  const wrappers = collectWrappers(helperCalls);
  const { calls, problems } = collectWrapperUses(files, wrappers);
  for (const shape of collectWrapperShapeProblems(helperCalls)) {
    violations.push(
      `${shape.file}:${shape.line} R4 ${shape.name} ${shape.problem}; open it with the negated ngDevMode early return`,
    );
  }
  for (const entry of [...collectWrapperPlacementProblems(wrappers), ...problems]) {
    violations.push(`${entry.file}:${entry.line} R4 ${entry.problem}`);
  }
  for (const call of calls) {
    if (!isLexicallyGuarded(call.node)) {
      violations.push(
        `${call.file}:${call.line} R4 dev wrapper ${call.name}() is called unguarded`,
      );
    } else if (runsAtModuleLoad(call.node)) {
      violations.push(
        `${call.file}:${call.line} R4 dev wrapper ${call.name}() ${MODULE_LOAD_GUARD}`,
      );
    }
  }

  const guardedFiles = new Map(
    [...helperCalls, ...calls].map((c) => [c.file, c.node.getSourceFile()]),
  );
  for (const [file, sf] of guardedFiles) {
    for (const line of localNgDevModeLines(sf)) {
      violations.push(
        `${file}:${line} R2 a local ngDevMode shadows the global; its guards never fold in production`,
      );
    }
  }
  return { raw, violations, wrappers };
}

/** The raw sites grouped per lib, for the failure message. */
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

  it('counts console destructured from a global and read off a cast host', () => {
    const { raw } = fixture(
      [
        "const { console } = globalThis; console.warn('a');",
        'const { console: c2 } = window as any;',
        "(globalThis as any).console.error('b');",
        "(window!)['console'].log('c');",
      ].join('\n'),
    );
    expect(raw.get('projects/core/a.ts')).toBe(4);
  });

  it('counts a shorthand property that reads the global console', () => {
    expect(fixture('const bag = { console };').raw.get('projects/core/a.ts')).toBe(1);
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
  const inFunction = (body) => `function host() {\ndoWork();\n${body}\n}`;
  const ok = (body) => expect(fixture(inFunction(body)).violations).toEqual([]);
  const fails = (body) => expect(fixture(inFunction(body)).violations).not.toEqual([]);

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
    ok(`class A { m() { prep(); if (${NEGATED}) { return 1; } cngxDevWarn('CNGX0001', 'm'); } }`);
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
    expect(
      fixture(`function f() { doWork(); if (${GUARD}) { cngxDevWarn(code, 'm'); } }`).violations,
    ).toEqual(["projects/core/a.ts:1 R2 the first argument must be a 'CNGXnnnn' string literal"]);
    expect(
      fixture(`function f() { doWork(); if (${GUARD}) { cngxDevWarn('CNGX1001', 'm'); } }`)
        .violations,
    ).toEqual(['projects/core/a.ts:1 R3 CNGX1001 lies outside the core range']);
  });
});

describe('raw-console guard - R2 helper references', () => {
  const misuse = (text) =>
    fixture(text).violations.filter((v) => v.includes('call the helper directly'));

  it('fails an aliased import, a namespace member, .call and a value use', () => {
    expect(misuse("import { cngxDevWarn as w } from '@cngx/utils';")).toHaveLength(1);
    expect(
      misuse(
        `import * as u from '@cngx/utils';\nif (${GUARD}) { u.cngxDevWarn('CNGX0001', 'm'); }`,
      ),
    ).toHaveLength(1);
    expect(misuse(`if (${GUARD}) { cngxDevWarn.call(null, 'CNGX0001', 'm'); }`)).toHaveLength(1);
    expect(misuse('const sink = cngxDevError;')).toHaveLength(1);
    expect(misuse("export { cngxDevWarn } from '@cngx/utils';")).toHaveLength(1);
  });

  it('allows the utils barrel to re-export the helpers by name, nothing else', () => {
    const reExport = "export { cngxDevError, cngxDevWarn } from './dev-message';";
    expect(misuse(reExport)).toHaveLength(2);
    expect(fixture(reExport, 'projects/utils/public-api.ts').violations).toEqual([]);
    expect(
      fixture("export { cngxDevWarn as w } from './dev-message';", 'projects/utils/public-api.ts')
        .violations,
    ).toHaveLength(1);
    expect(
      fixture("export { cngxDevWarn } from './other';", 'projects/utils/public-api.ts').violations,
    ).toHaveLength(1);
  });

  it('checks a file that only looks like the helper file', () => {
    const { violations } = fixture(
      "import { cngxDevWarn as w } from '@cngx/utils';",
      'projects/core/utils/dev-message.ts',
    );
    expect(violations).toHaveLength(1);
  });

  it('passes a plain import and a direct call', () => {
    expect(
      fixture(
        `import { cngxDevWarn } from '@cngx/utils';\nfunction f() { doWork(); if (${GUARD}) { cngxDevWarn('CNGX0001', 'm'); } }`,
      ).violations,
    ).toEqual([]);
  });

  it('fails a guard whose ngDevMode is a local binding, but allows the ambient declare', () => {
    expect(
      fixture(
        `function f(ngDevMode: boolean) { doWork(); if (${GUARD}) { cngxDevWarn('CNGX0001', 'm'); } }`,
      ).violations,
    ).toEqual([
      'projects/core/a.ts:1 R2 a local ngDevMode shadows the global; its guards never fold in production',
    ]);
    expect(
      fixture(
        `declare const ngDevMode: boolean | undefined;\nfunction f() { doWork(); if (${GUARD}) { cngxDevWarn('CNGX0001', 'm'); } }`,
      ).violations,
    ).toEqual([]);
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
        '    this.keys.add(k);',
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
        `function run() { doWork(); if (${GUARD}) { warnX('guarded'); } }`,
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
        `function wire() { return opt ?? (${GUARD} ? defaultWarn(3) : noop); }`,
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
      'projects/core/a.ts:2 R4 dev wrapper warnY is a class member; move it to module level so production tree-shakes it',
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

  it('treats a guard-first class-field arrow as a wrapper and matches any receiver', () => {
    const { wrappers, violations } = fixture(
      [
        'class D {',
        `  private readonly warnF = () => { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', 'm'); };`,
        `  #warnP() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0002', 'm'); }`,
        '  run(other: D) { this.warnF(); this.#warnP(); other.warnF(); }',
        '}',
      ].join('\n'),
    );
    expect(wrappers.map((w) => w.name).sort()).toEqual(['#warnP', 'warnF']);
    expect(violations).toEqual([
      'projects/core/a.ts:2 R4 dev wrapper warnF is a class member; move it to module level so production tree-shakes it',
      'projects/core/a.ts:3 R4 dev wrapper #warnP is a class member; move it to module level so production tree-shakes it',
      'projects/core/a.ts:4 R4 dev wrapper this.warnF() is called unguarded',
      'projects/core/a.ts:4 R4 dev wrapper this.#warnP() is called unguarded',
      'projects/core/a.ts:4 R4 dev wrapper other.warnF() is called unguarded',
    ]);
  });

  it('follows a wrapper exported through an export specifier', () => {
    const { violations } = checkSources([
      {
        path: 'projects/core/warn.ts',
        text: `function warnS() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', 'm'); }\nexport { warnS as warnShared };`,
      },
      {
        path: 'projects/core/use.ts',
        text: "import { warnShared } from './warn';\nwarnShared();",
      },
    ]);
    expect(violations).toEqual([
      'projects/core/use.ts:2 R4 dev wrapper warnShared() is called unguarded',
    ]);
  });

  it('fails a guard-first method and its unguarded value use', () => {
    const { violations } = fixture(
      [
        'class D {',
        `  warnM() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', 'm'); }`,
        '  run() { afterNextRender(this.warnM); }',
        '}',
      ].join('\n'),
    );
    expect(violations).toEqual([
      'projects/core/a.ts:2 R4 dev wrapper warnM is a class member; move it to module level so production tree-shakes it',
      'projects/core/a.ts:3 R4 dev wrapper this.warnM is used as a value outside a dev-mode guard',
    ]);
  });

  it('passes the same body as a module-level function with a guarded caller', () => {
    const { wrappers, violations } = fixture(
      [
        `function warnM(id: string) { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', id); }`,
        'class D {',
        `  run() { if (${GUARD}) { warnM(this.id); } }`,
        '}',
      ].join('\n'),
    );
    expect(wrappers.map((w) => w.kind)).toEqual(['function']);
    expect(violations).toEqual([]);
  });

  it('fails a dev-only function that is not guard-first', () => {
    const shape = (text) => fixture(text).violations.filter((v) => v.includes('early return'));
    expect(shape(`const warnE = (m: string) => ${GUARD} && cngxDevWarn('CNGX0001', m);`)).toEqual([
      'projects/core/a.ts:1 R4 warnE is an expression-body dev-only function; open it with the negated ngDevMode early return',
    ]);
    expect(
      shape(
        `function warnS(m: string) { const t = m.trim(); if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', t); }`,
      ),
    ).toHaveLength(1);
    expect(
      shape(`function warnI(m: string) { if (${GUARD}) { cngxDevWarn('CNGX0001', m); } }`),
    ).toHaveLength(1);
    expect(
      shape(`let warnL = (m: string) => ${GUARD} ? cngxDevWarn('CNGX0001', m) : undefined;`),
    ).toHaveLength(1);
  });

  it('fails dev-only functions by what they do, not by their shape', () => {
    const shape = (text) => fixture(text).violations.filter((v) => v.includes('early return'));
    const closureFactory = [
      'function defaultCeilingWarn(limit: number) {',
      `  return () => { if (${GUARD}) { cngxDevWarn('CNGX0001', String(limit)); } };`,
      '}',
    ].join('\n');
    const warnOncePreamble = [
      'const warnedDocs = new WeakSet<object>();',
      'function warnApi(doc: object) {',
      '  if (warnedDocs.has(doc)) { return; }',
      '  warnedDocs.add(doc);',
      `  if (${GUARD}) { cngxDevWarn('CNGX0001', 'm'); }`,
      '}',
    ].join('\n');
    const devOnlyLocal = `function warnT(m: string) { const t = m.trim(); if (${GUARD}) { cngxDevWarn('CNGX0001', t); } }`;
    expect(shape(closureFactory)).toEqual([
      'projects/core/a.ts:1 R4 defaultCeilingWarn is a dev-only function that is not guard-first; open it with the negated ngDevMode early return',
    ]);
    expect(shape(warnOncePreamble)).toHaveLength(1);
    expect(shape(devOnlyLocal)).toHaveLength(1);
  });

  it('keeps a production function with a guarded warning out of R4', () => {
    const cache = [
      'const cache = new Map<string, number>();',
      'function lookup(k: string) {',
      `  if (cache.has(k)) { if (${GUARD}) { cngxDevWarn('CNGX0001', k); } }`,
      '  cache.set(k, 1);',
      '  return cache.get(k);',
      '}',
      "lookup('x');",
    ].join('\n');
    expect(fixture(cache).violations).toEqual([]);
    expect(fixture(cache).wrappers).toEqual([]);
  });

  it('leaves an argument-less object-property callback alone', () => {
    const { wrappers, violations } = fixture(
      `const opts = { onGiveUp: () => { if (${GUARD}) { cngxDevWarn('CNGX0001', 'gave up'); } } };`,
    );
    expect({ wrappers, violations }).toEqual({ wrappers: [], violations: [] });
  });

  it('fails a guard-first object-literal member with a parameter and a non-guard-first one', () => {
    const guardFirst = fixture(
      `const config = { onWarn: (m: string) => { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', m); } };`,
    );
    expect(guardFirst.violations).toEqual([
      'projects/core/a.ts:1 R4 dev wrapper onWarn is an object-literal member; move it to module level so production tree-shakes it',
    ]);
    const devOnly = fixture(
      `const config = { onWarn: (m: string) => { if (${GUARD}) { cngxDevWarn('CNGX0001', m); } } };`,
    );
    expect(devOnly.violations).toEqual([
      'projects/core/a.ts:1 R4 onWarn is a dev-only function that is not guard-first; open it with the negated ngDevMode early return',
    ]);
  });

  it('follows a wrapper called through a namespace import', () => {
    const { violations } = checkSources([
      {
        path: 'projects/core/warn.ts',
        text: `export function warnN() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', 'm'); }`,
      },
      { path: 'projects/core/use.ts', text: "import * as d from './warn';\nd.warnN('x');" },
    ]);
    expect(violations).toEqual([
      'projects/core/use.ts:2 R4 dev wrapper d.warnN() is called unguarded',
    ]);
  });

  it('fails a default-exported wrapper and a renamed re-export', () => {
    const { violations } = checkSources([
      {
        path: 'projects/core/warn.ts',
        text: `export function warnR() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0001', 'm'); }`,
      },
      {
        path: 'projects/core/def.ts',
        text: `export default function warnD() { if (${NEGATED}) { return; } cngxDevWarn('CNGX0002', 'm'); }`,
      },
      { path: 'projects/core/barrel.ts', text: "export { warnR as warnQ } from './warn';" },
    ]);
    expect(violations).toEqual([
      'projects/core/def.ts:1 R4 dev wrapper warnD is a default export; export it by name',
      'projects/core/barrel.ts:1 R4 dev wrapper warnR is re-exported as warnQ; keep its name',
    ]);
  });

  it('fails a guard-first const arrow passed as a value outside a guard', () => {
    const sink = (use) =>
      fixture(
        [
          'export const DEFAULT_SINK = (slot: string) => {',
          `  if (${NEGATED}) { return; }`,
          "  cngxDevWarn('CNGX0001', slot);",
          '};',
          use,
        ].join('\n'),
      );
    expect(sink('const config = { sink: DEFAULT_SINK };').violations).toEqual([
      'projects/core/a.ts:5 R4 dev wrapper DEFAULT_SINK is used as a value outside a dev-mode guard',
    ]);
    expect(
      sink(`function wire() { return opt ?? (${GUARD} ? DEFAULT_SINK : noop); }`).violations,
    ).toEqual([]);
  });

  it('passes a guarded value use in an object-literal property initialiser', () => {
    const { wrappers, violations } = fixture(
      [
        'const DEFAULT_SINK = (slot: string) => {',
        `  if (${NEGATED}) { return; }`,
        "  cngxDevWarn('CNGX0001', slot);",
        '};',
        `function config() { return { sink: ${GUARD} ? DEFAULT_SINK : () => undefined }; }`,
      ].join('\n'),
    );
    expect(wrappers.map((w) => w.name)).toEqual(['DEFAULT_SINK']);
    expect(violations).toEqual([]);
  });
});

describe('raw-console guard - guards evaluated at module load', () => {
  const SINK = [
    'const DEFAULT_SINK = (slot: string) => {',
    `  if (${NEGATED}) { return; }`,
    "  cngxDevWarn('CNGX0001', slot);",
    '};',
  ].join('\n');

  it('fails a guarded helper call at module level', () => {
    expect(fixture(`if (${GUARD}) { cngxDevWarn('CNGX0001', 'm'); }`).violations).toEqual([
      `projects/core/a.ts:1 R2 CNGX0001 ${MODULE_LOAD_GUARD}`,
    ]);
  });

  it('fails a guarded wrapper call and value use at module level', () => {
    const { violations } = fixture(
      [
        SINK,
        `${GUARD} && DEFAULT_SINK('x');`,
        `export const DEFAULTS = { sink: ${GUARD} ? DEFAULT_SINK : () => undefined };`,
      ].join('\n'),
    );
    expect(violations).toEqual([
      `projects/core/a.ts:6 R4 dev wrapper DEFAULT_SINK ${MODULE_LOAD_GUARD}`,
      `projects/core/a.ts:5 R4 dev wrapper DEFAULT_SINK() ${MODULE_LOAD_GUARD}`,
    ]);
  });

  it('fails a guard in a static field or static block, passes an instance field', () => {
    const shape = (member) =>
      fixture(`${SINK}\nclass C {\n  ${member}\n}`).violations.filter((v) =>
        v.includes('module load'),
      );
    expect(shape(`static sink = ${GUARD} ? DEFAULT_SINK : undefined;`)).toHaveLength(1);
    expect(shape(`static { if (${GUARD}) { DEFAULT_SINK('x'); } }`)).toHaveLength(1);
    expect(shape(`sink = ${GUARD} ? DEFAULT_SINK : undefined;`)).toEqual([]);
  });

  it('passes the same value use read through a getter', () => {
    const { violations } = fixture(
      [
        SINK,
        'export const DEFAULTS = {',
        `  get sink() { return ${GUARD} ? DEFAULT_SINK : undefined; },`,
        '};',
      ].join('\n'),
    );
    expect(violations).toEqual([]);
  });
});

describe('raw-console guard - projects/**', () => {
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

  it('has no unguarded, uncoded or out-of-range helper call and no unguarded wrapper call', () => {
    expect(result.violations).toEqual([]);
  });

  it('has no raw console reference outside the exemptions', () => {
    const exempt = new Set(RAW_CONSOLE_EXEMPT.map((e) => e.file));
    const actual = new Map([...result.raw].filter(([file]) => !exempt.has(file)));
    expect(
      [...actual.keys()],
      `Raw console references found; route them through cngxDevWarn / cngxDevError. Per lib:\n${JSON.stringify(groupPerLib(actual), null, 2)}`,
    ).toEqual([]);
  });

  it('gives every exemption a reason and drops exemptions that cover nothing', () => {
    expect(RAW_CONSOLE_EXEMPT.filter((e) => !e.reason?.trim())).toEqual([]);
    expect(RAW_CONSOLE_EXEMPT.filter((e) => !result.raw.has(e.file))).toEqual([]);
  });

  it('derives exactly the reviewed dev wrappers', () => {
    const wrappers = result.wrappers.map((w) => `${w.file}#${w.name}`).sort();
    expect(wrappers).toEqual([...EXPECTED_DEV_WRAPPERS].sort());
  });
});
