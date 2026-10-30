// `--from <file>`: the names a source file imports from `@cngx/*`, so
// `cngx api --from app.component.ts` answers for everything that file uses. A
// regex over the import statements is enough here: the names feed a lookup, a
// wrong guess answers "not found", and no TypeScript parser ships with the CLI.

import { readFileSync } from 'node:fs';

// `import [type] [Default,] { a, b as c, type d } from '@cngx/<entry>'`, across lines.
const NAMED_IMPORT = /\bimport\s+(?:type\s+)?(?:[A-Za-z_$][\w$]*\s*,\s*)?\{([^}]*)\}\s*from\s*['"]@cngx\/[^'"]+['"]/g;

/**
 * `source` with every comment replaced by a space, string and template literals
 * kept: a comment inside an import list would otherwise swallow the name after it,
 * and a commented-out import would count.
 */
function stripComments(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        i++;
      }
      out += ' ';
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      out += ' ';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      let j = i + 1;
      while (j < source.length && source[j] !== char) {
        j += source[j] === '\\' ? 2 : 1;
      }
      out += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    out += char;
    i++;
  }
  return out;
}

/** The imported names, in source order, deduplicated; an `as` alias resolves to the imported name. */
export function extractCngxNames(source: string): string[] {
  const names = new Set<string>();
  for (const match of stripComments(source).matchAll(NAMED_IMPORT)) {
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
