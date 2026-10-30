// `--from <file>`: the names a source file imports from `@cngx/*`, so
// `cngx api --from app.component.ts` answers for everything that file uses. A
// regex over the import statements is enough here: the names feed a lookup, a
// wrong guess answers "not found", and no TypeScript parser ships with the CLI.

import { readFileSync } from 'node:fs';

// `import [type] { a, b as c, type d } from '@cngx/<entry>'`, across lines.
const NAMED_IMPORT = /\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@cngx\/[^'"]+['"]/g;

/** The imported names, in source order, deduplicated; an `as` alias resolves to the imported name. */
export function extractCngxNames(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(NAMED_IMPORT)) {
    for (const specifier of match[1].split(',')) {
      const name = specifier
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0]
        .trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) {
        names.add(name);
      }
    }
  }
  return [...names];
}

/** Read `path` and extract its `@cngx/*` names; throws when the file cannot be read. */
export function readCngxNames(path: string, readFile: (path: string) => string = (file) => readFileSync(file, 'utf8')): string[] {
  return extractCngxNames(readFile(path));
}
