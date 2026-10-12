import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, walkSources } from './_i18n-ast.mjs';

/**
 * Library source never imports a testing entry. `@cngx/core/testing` ships
 * inside the `@cngx/core` package, so nothing in the package graph stops a
 * component from importing it, and Sheriff's scope tags are diagnostic only
 * (`anyTag`). A test kit pulled into a component would land in app bundles.
 *
 * Scans every published source `walkSources` yields under `projects/`: specs,
 * fixtures, `testing` folders, demos and schematics are skipped by the walk
 * itself, so what remains is exactly the shipped library code.
 */

const TESTING_SPECIFIER = /^@cngx\/(?:[^/]+\/)*testing(?:\/|$)/;

/**
 * @param {string} path repo-relative path, posix separators
 * @param {string} text source text
 * @returns {string[]} one `path:line specifier` per violation
 */
export function scanImports(path, text) {
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = [];
  const check = (node, specifier) => {
    if (specifier && ts.isStringLiteralLike(specifier) && TESTING_SPECIFIER.test(specifier.text)) {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      out.push(`${path}:${line} ${specifier.text}`);
    }
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      check(node, node.moduleSpecifier);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      check(node, node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

describe('testing-entry-import-fence', () => {
  const files = walkSources('projects', /\.ts$/);

  it('scans the shipped library sources and no testing entry', () => {
    expect(files).toContain('projects/core/utils/public-api.ts');
    expect(files.some((path) => path.includes('/testing/'))).toBe(false);
  });

  it('keeps library source free of testing-entry imports', () => {
    const violations = files.flatMap((path) =>
      scanImports(path, readFileSync(resolve(REPO_ROOT, path), 'utf8')),
    );
    expect(violations).toEqual([]);
  });
});

describe('testing-entry-import-fence - scanner', () => {
  const FILE = 'projects/ui/feedback/toast.ts';

  it('reports a static import, a re-export and a dynamic import of a testing entry', () => {
    const text =
      "import { provideCngxTesting } from '@cngx/core/testing';\n" +
      "export * from '@cngx/forms/field/testing';\n" +
      "const kit = import('@cngx/core/testing/vitest');\n";
    expect(scanImports(FILE, text)).toEqual([
      `${FILE}:1 @cngx/core/testing`,
      `${FILE}:2 @cngx/forms/field/testing`,
      `${FILE}:3 @cngx/core/testing/vitest`,
    ]);
  });

  it('reports the internal @cngx/testing helpers', () => {
    expect(scanImports(FILE, "import { x } from '@cngx/testing';\n")).toHaveLength(1);
  });

  it('accepts entries that only contain the word and specifiers in comments or strings', () => {
    const text =
      "import { a } from '@cngx/core/utils';\n" +
      "import { b } from '@cngx/common/testing-library';\n" +
      "// import { c } from '@cngx/core/testing';\n" +
      "export const s = '@cngx/core/testing';\n";
    expect(scanImports(FILE, text)).toEqual([]);
  });
});
