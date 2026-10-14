import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { singleFileChecker } from '../dev-diagnostics.mjs';
import { REPO_ROOT, walkSources } from './_i18n-ast.mjs';

/**
 * Published testing entries stay runner-agnostic: a Jasmine or Jest consumer
 * imports them without resolving Vitest. So no runner namespace (`vi`,
 * `jest`, `jasmine`), no bare runner global (`expect`, `spyOn`, `fail`, the
 * suite and hook registrars) and no value import from `vitest`, its subpaths
 * or `@vitest/*` in their non-spec source. A helper that registers its own
 * `afterEach` teardown is bound to whichever runner defines it, so cleanup
 * stays the caller's. A `testing/vitest/` entry is the one place that may name
 * Vitest, and only through erased imports and a `declare module 'vitest'`
 * augmentation, all of which vanish from the emitted JavaScript.
 *
 * Comments and string literals never count: the scan walks the AST, and a
 * checker over the file tells a runner global from a local binding of the
 * same name, scope by scope.
 *
 * The entries are derived from disk: every `projects/**\/testing/` folder with
 * an `ng-package.json`. Unpublished helper folders (`projects/testing`,
 * `forms/field/testing`) have none and are not scanned.
 */

const RUNNER_GLOBALS = new Set([
  'vi',
  'jest',
  'jasmine',
  'expect',
  'spyOn',
  'fail',
  'pending',
  'describe',
  'fdescribe',
  'xdescribe',
  'it',
  'fit',
  'xit',
  'test',
  'beforeEach',
  'afterEach',
  'beforeAll',
  'afterAll',
]);
const GLOBAL_OBJECTS = new Set(['globalThis', 'window', 'self', 'global']);

/** `vitest`, its subpaths and the `@vitest/*` packages. */
function isVitestSpecifier(node) {
  if (!node || !ts.isStringLiteralLike(node)) {
    return false;
  }
  const s = node.text;
  return s === 'vitest' || s.startsWith('vitest/') || s.startsWith('@vitest/');
}

/** Every binding of an import or export clause is type-only, so emit drops it. */
function isErased(clause) {
  if (!clause) {
    return false;
  }
  if (clause.isTypeOnly) {
    return true;
  }
  const named = ts.isImportClause(clause) ? clause.namedBindings : clause.exportClause;
  const hasDefault = ts.isImportClause(clause) && clause.name !== undefined;
  return (
    !hasDefault &&
    named !== undefined &&
    (ts.isNamedImports(named) || ts.isNamedExports(named)) &&
    named.elements.every((el) => el.isTypeOnly)
  );
}

/**
 * No declaration behind the name. In a type position the checker answers an
 * unresolved name with a declaration-less error symbol instead of `undefined`.
 *
 * @param {ts.Symbol | undefined} symbol
 */
function isUnresolved(symbol) {
  return !symbol?.declarations?.length;
}

/**
 * @param {string} relDir repo-relative directory
 * @returns {string[]} repo-relative `testing` entry folders
 */
function findTestingEntries(relDir) {
  const out = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (entry === 'node_modules' || !statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      continue;
    }
    if (entry === 'testing' && existsSync(resolve(REPO_ROOT, rel, 'ng-package.json'))) {
      out.push(rel);
    }
    out.push(...findTestingEntries(rel));
  }
  return out;
}

/**
 * @param {string} path repo-relative path, posix separators
 * @param {string} text source text
 * @returns {string[]} one `path:line message` per violation
 */
export function scanSource(path, text) {
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const checker = singleFileChecker(sf);
  const inVitestEntry = path.includes('/testing/vitest/');
  const out = [];
  const report = (node, message) => {
    out.push(`${path}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1} ${message}`);
  };

  const visit = (node) => {
    const parent = node.parent;
    if (
      ts.isIdentifier(node) &&
      RUNNER_GLOBALS.has(node.text) &&
      !(ts.isPropertyAccessExpression(parent) && parent.name === node) &&
      !(ts.isQualifiedName(parent) && parent.right === node) &&
      isUnresolved(checker.getSymbolAtLocation(node))
    ) {
      report(node, `runner global \`${node.text}\``);
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      GLOBAL_OBJECTS.has(node.expression.text) &&
      RUNNER_GLOBALS.has(node.name.text)
    ) {
      report(node, `runner global \`${node.expression.text}.${node.name.text}\``);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
      isVitestSpecifier(node.arguments[0])
    ) {
      report(node, 'runtime load of vitest');
    } else if (ts.isImportDeclaration(node) && isVitestSpecifier(node.moduleSpecifier)) {
      if (!inVitestEntry) {
        report(node, 'import from vitest');
      } else if (!isErased(node.importClause)) {
        report(node, 'value import from vitest');
      }
    } else if (ts.isExportDeclaration(node) && isVitestSpecifier(node.moduleSpecifier)) {
      if (!(inVitestEntry && isErased(node))) {
        report(node, 're-export from vitest');
      }
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      isVitestSpecifier(node.moduleReference.expression)
    ) {
      report(node, 'runtime load of vitest');
    } else if (ts.isModuleDeclaration(node) && isVitestSpecifier(node.name) && !inVitestEntry) {
      report(node, "declare module 'vitest' outside a testing/vitest entry");
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

describe('testing-entry-runner-agnostic', () => {
  const entries = findTestingEntries('projects');
  const files = entries.flatMap((entry) => walkSources(entry, /\.ts$/));

  it('finds the published testing entries and scans their sources', () => {
    expect(entries).toContain('projects/core/testing');
    expect(files).toEqual(
      expect.arrayContaining([
        'projects/core/testing/public-api.ts',
        'projects/core/testing/provide-testing.ts',
      ]),
    );
  });

  it('keeps every published testing entry free of runner globals and vitest values', () => {
    const violations = files.flatMap((path) =>
      scanSource(path, readFileSync(resolve(REPO_ROOT, path), 'utf8')),
    );
    expect(violations).toEqual([]);
  });
});

describe('testing-entry-runner-agnostic - scanner', () => {
  const ENTRY = 'projects/core/testing/kit.ts';
  const VITEST_ENTRY = 'projects/core/testing/vitest/matchers.ts';

  it('reports a runner namespace', () => {
    expect(scanSource(ENTRY, 'export const spy = vi.fn();\n')).toEqual([
      `${ENTRY}:1 runner global \`vi\``,
    ]);
  });

  it('reports jest and jasmine namespaces, also in a type position', () => {
    const text = 'jest.fn();\njasmine.clock();\nexport let s: jasmine.Spy;\n';
    expect(scanSource(ENTRY, text)).toHaveLength(3);
  });

  it('reports a self-registered teardown', () => {
    const text = 'export function createKit() {\n  afterEach(() => stop());\n}\n';
    expect(scanSource(ENTRY, text)).toEqual([`${ENTRY}:2 runner global \`afterEach\``]);
  });

  it('reports expect, spyOn and the suite registrars', () => {
    const text =
      'expect(a).toBe(1);\nspyOn(obj, "m");\ndescribe("s", () => it("t", () => {}));\ntest("u", () => {});\nxit("v", () => {});\nfit("w", () => {});\n';
    expect(scanSource(ENTRY, text)).toHaveLength(7);
  });

  it('reports a runner global reached through a global object', () => {
    const text = 'globalThis.expect(1);\nwindow.jasmine.clock();\n';
    expect(scanSource(ENTRY, text)).toEqual([
      `${ENTRY}:1 runner global \`globalThis.expect\``,
      `${ENTRY}:2 runner global \`window.jasmine\``,
    ]);
  });

  it('accepts runner globals in comments, JSDoc examples and strings', () => {
    const text =
      '/**\n * ```ts\n * afterEach(() => capture.stop());\n * vi.advanceTimersByTime(120);\n * ```\n */\n' +
      "// expect(x)\nexport const s = 'vi.useFakeTimers expect(x)';\nexport const t = `jest.fn()`;\n";
    expect(scanSource(ENTRY, text)).toEqual([]);
  });

  it('accepts a method or a local binding with a runner-global name', () => {
    const text =
      'function fail(reason: string): never {\n  throw new Error(reason);\n}\n' +
      'fail("x");\nexport const r = assert.expect(1);\nexport const o = { it: 1 };\n';
    expect(scanSource(ENTRY, text)).toEqual([]);
  });

  it('resolves a local binding per scope, not per file', () => {
    const text =
      'export function check(expect: (v: number) => void) {\n  expect(1);\n}\n' +
      'export function leak() {\n  expect(2);\n}\n';
    expect(scanSource(ENTRY, text)).toEqual([`${ENTRY}:5 runner global \`expect\``]);
  });

  it('accepts a name that only ends in a runner global', () => {
    expect(scanSource(ENTRY, 'const navi = { x: 1 };\nnavi.x;\n')).toEqual([]);
  });

  it('reports any vitest import outside a testing/vitest entry', () => {
    const text = "import type { Assertion } from 'vitest';\n";
    expect(scanSource(ENTRY, text)).toEqual([`${ENTRY}:1 import from vitest`]);
  });

  it('reports vitest subpaths and @vitest packages', () => {
    const text = "import { a } from 'vitest/utils';\nimport { b } from '@vitest/expect';\n";
    expect(scanSource(VITEST_ENTRY, text)).toEqual([
      `${VITEST_ENTRY}:1 value import from vitest`,
      `${VITEST_ENTRY}:2 value import from vitest`,
    ]);
  });

  it('reports a value or side-effect import from vitest in a testing/vitest entry', () => {
    const text = "import { expect } from 'vitest';\nimport 'vitest';\n";
    expect(scanSource(VITEST_ENTRY, text)).toEqual([
      `${VITEST_ENTRY}:1 value import from vitest`,
      `${VITEST_ENTRY}:2 value import from vitest`,
    ]);
  });

  it('accepts erased imports and the augmentation in a testing/vitest entry', () => {
    const text =
      "import type { Assertion } from 'vitest';\n" +
      "import { type AsymmetricMatchersContaining } from 'vitest';\n" +
      "declare module 'vitest' {\n  interface Assertion<T> { toHaveHeard(text: string): T }\n}\n";
    expect(scanSource(VITEST_ENTRY, text)).toEqual([]);
  });

  it('reports a mixed type and value import in a testing/vitest entry', () => {
    const text = "import { type Assertion, expect } from 'vitest';\n";
    expect(scanSource(VITEST_ENTRY, text)).toHaveLength(1);
  });

  it('reports the augmentation outside a testing/vitest entry', () => {
    const text = "declare module 'vitest' {\n  interface Assertion<T> { x(): T }\n}\n";
    expect(scanSource(ENTRY, text)).toHaveLength(1);
  });

  it('reports a runtime load of vitest even in a testing/vitest entry', () => {
    const text = "const v = await import('vitest');\nconst w = require('@vitest/spy');\n";
    expect(scanSource(VITEST_ENTRY, text)).toEqual([
      `${VITEST_ENTRY}:1 runtime load of vitest`,
      `${VITEST_ENTRY}:2 runtime load of vitest`,
    ]);
  });
});
