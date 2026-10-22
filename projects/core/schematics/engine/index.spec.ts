import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import * as engine from './index';

const PROJECTS = join(__dirname, '..', '..', '..');
const ENGINE = __dirname;
const BARREL_PATHS = new Set([ENGINE, join(ENGINE, 'index'), join(ENGINE, 'index.ts')]);

function tsFiles(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || path === ENGINE ? [] : tsFiles(path);
    }
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

function parse(path: string): ts.SourceFile {
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
}

// The names an `import { ... }` or `export { ... } from` clause takes from the
// barrel, by their exported name (`delegateNgAdd as ngAdd` reads `delegateNgAdd`).
function barrelNamesReadBy(path: string): readonly string[] {
  return parse(path).statements.flatMap((statement) => {
    const isImport = ts.isImportDeclaration(statement);
    if (!isImport && !ts.isExportDeclaration(statement)) {
      return [];
    }
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier) || !BARREL_PATHS.has(resolve(dirname(path), specifier.text))) {
      return [];
    }
    const named = isImport ? statement.importClause?.namedBindings : statement.exportClause;
    if (!named || !(ts.isNamedImports(named) || ts.isNamedExports(named))) {
      return [];
    }
    return named.elements.map((element) => (element.propertyName ?? element.name).text);
  });
}

const OUTSIDE_FILES = readdirSync(PROJECTS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    try {
      return tsFiles(join(PROJECTS, entry.name, 'schematics'));
    } catch {
      return [];
    }
  });

const READ_OUTSIDE = new Set(OUTSIDE_FILES.flatMap(barrelNamesReadBy));

// Type-only exports leave no runtime key, so the barrel's names come from its source.
const BARREL_EXPORTS = parse(join(ENGINE, 'index.ts')).statements.flatMap((statement) =>
  ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)
    ? statement.exportClause.elements.map((element) => element.name.text)
    : [],
);

describe('engine barrel', () => {
  it('reads every runtime export from its source', () => {
    expect(BARREL_EXPORTS).toEqual(expect.arrayContaining(Object.keys(engine)));
  });

  it.each(BARREL_EXPORTS)('exports %s because code outside the engine imports it', (name) => {
    expect(READ_OUTSIDE.has(name)).toBe(true);
  });
});
