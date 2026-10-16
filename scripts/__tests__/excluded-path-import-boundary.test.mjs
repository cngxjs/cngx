// The guards, the error-code manifest and the prod-strip needles read library
// source through `readSources`, which skips specs, `examples/` folders and
// `projects/testing` by path. That is sound only while no library file pulls
// such a file into the build: a re-export of a spec would ship code no guard
// has read. `__test-helpers` folders are read by the guards but hold spec-only
// harnesses, so library code must not reach them either.
//
// B1  no library source outside a `__test-helpers` folder imports, re-exports,
//     `import x = require(...)`s or dynamically imports a relative path that lands in a spec, an
//     `examples/` folder, `projects/testing` or a `__test-helpers` folder.
//     Aliased testing entries (`@cngx/testing`, `@cngx/*/testing`) are fenced
//     by `testing-entry-import-fence.test.mjs`.

import { posix } from 'node:path';

import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import { lineOf, parse } from '../dev-diagnostics.mjs';
import { readSources } from '../error-codes-manifest.mjs';

const TEST_HELPERS = /(^|\/)__test-helpers\//;

/** Why `target` (repo-relative, posix) is outside the guarded source set, or null. */
export function excludedReason(target) {
  if (/\.spec(\.ts)?$/.test(target)) {
    return 'a spec';
  }
  if (/(^|\/)examples(\/|$)/.test(target)) {
    return 'an examples folder';
  }
  if (/^projects\/testing(\/|$)/.test(target)) {
    return 'projects/testing';
  }
  if (TEST_HELPERS.test(`${target}/`)) {
    return 'a __test-helpers folder';
  }
  return null;
}

/**
 * Every relative import, re-export or dynamic import in `files`
 * ([{ path, text }]) that lands outside the guarded source set.
 *
 * @returns {string[]} one `path:line specifier (reason)` per violation
 */
export function boundaryViolations(files) {
  const out = [];
  for (const { path, text } of files) {
    if (TEST_HELPERS.test(path)) {
      continue;
    }
    const sf = parse(path, text);
    const check = (node, specifier) => {
      if (!specifier || !ts.isStringLiteralLike(specifier) || !specifier.text.startsWith('.')) {
        return;
      }
      const reason = excludedReason(posix.join(posix.dirname(path), specifier.text));
      if (reason) {
        out.push(`${path}:${lineOf(sf, node)} ${specifier.text} (${reason})`);
      }
    };
    const visit = (node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        check(node, node.moduleSpecifier);
      } else if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference)
      ) {
        check(node, node.moduleReference.expression);
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        check(node, node.arguments[0]);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

describe('excluded-path import boundary - scanner', () => {
  const FILE = 'projects/forms/select/shared/panel.ts';

  it('fails a re-export of a spec, an example, projects/testing and a test helper', () => {
    const text = [
      "export * from './panel.spec';",
      "export { Demo } from '../examples/demo/demo.component';",
      "import { host } from '../../../testing/index';",
      "import { harness } from './__test-helpers/field-skin-host';",
      "const lazy = import('./select.spec.ts');",
      "import legacy = require('./legacy.spec');",
    ].join('\n');
    expect(boundaryViolations([{ path: FILE, text }])).toEqual([
      `${FILE}:1 ./panel.spec (a spec)`,
      `${FILE}:2 ../examples/demo/demo.component (an examples folder)`,
      `${FILE}:3 ../../../testing/index (projects/testing)`,
      `${FILE}:4 ./__test-helpers/field-skin-host (a __test-helpers folder)`,
      `${FILE}:5 ./select.spec.ts (a spec)`,
      `${FILE}:6 ./legacy.spec (a spec)`,
    ]);
  });

  it('passes library imports, package imports and a helper importing a sibling helper', () => {
    expect(
      boundaryViolations([
        {
          path: FILE,
          text: "import { x } from './panel-host';\nimport { y } from '@cngx/core/utils';",
        },
        {
          path: 'projects/forms/select/shared/__test-helpers/field-skin-host.ts',
          text: "import { z } from './other-helper';\nimport { w } from '../panel.spec';",
        },
      ]),
    ).toEqual([]);
  });
});

describe('excluded-path import boundary - projects/**', () => {
  let files;
  beforeAll(() => {
    files = readSources();
  });

  it('reads the exempted spec-only harness, so the boundary covers it', () => {
    expect(files.map((f) => f.path)).toContain(
      'projects/forms/select/shared/__test-helpers/field-skin-host.ts',
    );
  });

  it('has no library source that reaches a spec, an example or a test helper', () => {
    expect(boundaryViolations(files)).toEqual([]);
  });
});
