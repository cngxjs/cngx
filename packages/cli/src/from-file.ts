// `--from <file>`: the names a source file imports from `@cngx/*`, so
// `cngx api --from app.component.ts` answers for everything that file uses. A
// regex over the import statements is enough here: the names feed a lookup, a
// wrong guess answers "not found", and no TypeScript parser ships with the CLI.

import { readFileSync } from 'node:fs';

// `import [type] [Default,] { a, b as c, type d } from '@cngx/<entry>'`, across lines.
const NAMED_IMPORT = /\bimport\s+(type\s+)?(?:[A-Za-z_$][\w$]*\s*,\s*)?\{([^}]*)\}\s*from\s*['"]@cngx\/[^'"]+['"]/g;

// A `/` after one of these (or a keyword below) starts a regex literal, not a division.
const REGEX_AFTER_CHAR = new Set([...'(,=:[!&|?{};+-*%<>~^']);
const REGEX_AFTER_WORD = /\b(?:return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

/** The end (exclusive) of the regex literal starting at `start`, or -1 when it is not one. */
function regexLiteralEnd(source: string, start: number): number {
  let inClass = false;
  for (let j = start + 1; j < source.length; j++) {
    const char = source[j];
    if (char === '\n') {
      return -1;
    }
    if (char === '\\') {
      j++;
    } else if (char === '[') {
      inClass = true;
    } else if (char === ']') {
      inClass = false;
    } else if (char === '/' && !inClass) {
      return j + 1;
    }
  }
  return -1;
}

/**
 * `source` with every comment replaced by a space, string, template and regex
 * literals kept: a comment inside an import list would otherwise swallow the name
 * after it, a commented-out import would count, and a `/*` inside a regex literal
 * would read as a comment that swallows the rest of the file.
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
    if (char === '/') {
      const before = out.trimEnd();
      const startsRegex = before === '' || REGEX_AFTER_CHAR.has(before[before.length - 1]) || REGEX_AFTER_WORD.test(before);
      const end = startsRegex ? regexLiteralEnd(source, i) : -1;
      if (end !== -1) {
        out += source.slice(i, end);
        i = end;
        continue;
      }
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

/** The named `@cngx/*` imports of one source file. */
export interface CngxImports {
  /** In source order, deduplicated; an `as` alias resolves to the imported name. */
  readonly names: readonly string[];
  /** The names imported only as types (`import type { X }`, `{ type X }`): never an api entry. */
  readonly typeOnly: ReadonlySet<string>;
}

export function extractCngxImports(source: string): CngxImports {
  const names = new Set<string>();
  const valueImported = new Set<string>();
  for (const match of stripComments(source).matchAll(NAMED_IMPORT)) {
    const statementTypeOnly = match[1] !== undefined;
    for (const specifier of match[2].split(',')) {
      const trimmed = specifier.trim();
      const name = trimmed
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0]
        .trim();
      if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
        continue;
      }
      names.add(name);
      if (!statementTypeOnly && !/^type\s/.test(trimmed)) {
        valueImported.add(name);
      }
    }
  }
  return { names: [...names], typeOnly: new Set([...names].filter((name) => !valueImported.has(name))) };
}

/** The imported names only; see {@link extractCngxImports}. */
export function extractCngxNames(source: string): string[] {
  return [...extractCngxImports(source).names];
}

/** Read `path` and extract its `@cngx/*` imports; throws when the file cannot be read. */
export function readCngxImports(path: string, readFile: (path: string) => string = (file) => readFileSync(file, 'utf8')): CngxImports {
  return extractCngxImports(readFile(path));
}
