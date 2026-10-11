import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, commentFreeText, walkSources } from './_i18n-ast.mjs';

/**
 * Published testing entries stay runner-agnostic: a Jasmine or Jest consumer
 * imports them without resolving Vitest. So no runner global (`vi`, `jest`,
 * `jasmine`) and no value import from `vitest` in their non-spec source. A
 * `testing/vitest/` entry is the one place that may name Vitest, and only
 * through `import type` and a `declare module 'vitest'` augmentation, both of
 * which vanish from the emitted JavaScript.
 *
 * The entries are derived from disk: every `projects/**\/testing/` folder with
 * an `ng-package.json`. Unpublished helper folders (`projects/testing`,
 * `forms/field/testing`) have none and are not scanned.
 */

const RUNNER_GLOBAL = /\b(vi|jest|jasmine)\./g;
const DYNAMIC_VITEST = /\b(?:import|require)\s*\(\s*['"]vitest['"]\s*\)/g;

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
  const code = commentFreeText(sf);
  const inVitestEntry = path.includes('/testing/vitest/');
  const out = [];
  const report = (pos, message) => {
    out.push(`${path}:${sf.getLineAndCharacterOfPosition(pos).line + 1} ${message}`);
  };

  for (const match of code.matchAll(RUNNER_GLOBAL)) {
    report(match.index, `runner global \`${match[1]}.\``);
  }
  for (const match of code.matchAll(DYNAMIC_VITEST)) {
    report(match.index, 'runtime load of vitest');
  }

  for (const stmt of sf.statements) {
    const from = stmt.moduleSpecifier;
    const fromVitest = from && ts.isStringLiteral(from) && from.text === 'vitest';
    if (ts.isImportDeclaration(stmt) && fromVitest) {
      const typeOnly = stmt.importClause?.isTypeOnly === true;
      if (!(inVitestEntry && typeOnly)) {
        report(
          stmt.getStart(sf),
          inVitestEntry ? 'value import from vitest' : 'import from vitest',
        );
      }
    } else if (ts.isExportDeclaration(stmt) && fromVitest) {
      if (!(inVitestEntry && stmt.isTypeOnly)) {
        report(stmt.getStart(sf), 're-export from vitest');
      }
    } else if (
      ts.isModuleDeclaration(stmt) &&
      ts.isStringLiteral(stmt.name) &&
      stmt.name.text === 'vitest' &&
      !inVitestEntry
    ) {
      report(stmt.getStart(sf), "declare module 'vitest' outside a testing/vitest entry");
    }
  }
  return out;
}

describe('testing-entry-runner-agnostic', () => {
  const entries = findTestingEntries('projects');

  it('finds at least one published testing entry', () => {
    expect(entries).toContain('projects/core/testing');
  });

  it('keeps every published testing entry free of runner globals and vitest values', () => {
    const violations = entries
      .flatMap((entry) => walkSources(entry, /\.ts$/))
      .flatMap((path) => scanSource(path, readFileSync(resolve(REPO_ROOT, path), 'utf8')));
    expect(violations).toEqual([]);
  });
});

describe('testing-entry-runner-agnostic - scanner', () => {
  const ENTRY = 'projects/core/testing/kit.ts';
  const VITEST_ENTRY = 'projects/core/testing/vitest/matchers.ts';

  it('reports a runner global', () => {
    expect(scanSource(ENTRY, 'export const spy = vi.fn();\n')).toEqual([
      `${ENTRY}:1 runner global \`vi.\``,
    ]);
  });

  it('reports jest and jasmine globals', () => {
    const text = 'jest.fn();\njasmine.clock();\n';
    expect(scanSource(ENTRY, text)).toHaveLength(2);
  });

  it('accepts a runner global inside a JSDoc example', () => {
    const text =
      '/**\n * ```ts\n * vi.advanceTimersByTime(120);\n * ```\n */\nexport const a = 1;\n';
    expect(scanSource(ENTRY, text)).toEqual([]);
  });

  it('accepts a name that only ends in a runner global', () => {
    expect(scanSource(ENTRY, 'const navi = { x: 1 };\nnavi.x;\n')).toEqual([]);
  });

  it('reports any vitest import outside a testing/vitest entry', () => {
    const text = "import type { Assertion } from 'vitest';\n";
    expect(scanSource(ENTRY, text)).toEqual([`${ENTRY}:1 import from vitest`]);
  });

  it('reports a value import from vitest in a testing/vitest entry', () => {
    const text = "import { expect } from 'vitest';\n";
    expect(scanSource(VITEST_ENTRY, text)).toEqual([`${VITEST_ENTRY}:1 value import from vitest`]);
  });

  it('accepts a type-only import and the augmentation in a testing/vitest entry', () => {
    const text =
      "import type { Assertion } from 'vitest';\n" +
      "declare module 'vitest' {\n  interface Assertion<T> { toHaveHeard(text: string): T }\n}\n";
    expect(scanSource(VITEST_ENTRY, text)).toEqual([]);
  });

  it('reports the augmentation outside a testing/vitest entry', () => {
    const text = "declare module 'vitest' {\n  interface Assertion<T> { x(): T }\n}\n";
    expect(scanSource(ENTRY, text)).toHaveLength(1);
  });

  it('reports a runtime load of vitest even in a testing/vitest entry', () => {
    expect(scanSource(VITEST_ENTRY, "const v = await import('vitest');\n")).toEqual([
      `${VITEST_ENTRY}:1 runtime load of vitest`,
    ]);
  });
});
