// Schema-2 projection. compodocx before 0.10 has no `alias` key on an input; it
// leaves the options object in `defaultValue` (`"false, { alias: 'disabled' }"`).
// This module lifts the alias into the `alias` field schema 6 emits, so the query
// core reads one shape and never branches on `schemaVersion`.

import type { DocEntry, DocInput, DocumentationJson } from './types.js';

const ALIAS_KEY = /(?:^\{|,)\s*alias:\s*['"]([^'"]+)['"]/;
const OPEN = '([{';
const CLOSE = ')]}';

// The top-level comma-separated arguments of `defaultValue`. Commas inside
// brackets or string literals (a `transform` arrow, an array default) do not split.
function topLevelArgs(text: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if (OPEN.includes(char)) {
      depth++;
    } else if (CLOSE.includes(char)) {
      depth--;
    } else if (char === ',' && depth === 0) {
      args.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = text.slice(start).trim();
  // A trailing comma after the options object leaves nothing behind it.
  if (last !== '' || args.length === 0) {
    args.push(last);
  }
  return args;
}

function withAlias(input: DocInput): DocInput {
  if (input.alias || input.defaultValue === undefined) {
    return input;
  }
  // The options object is the last argument, alone for `input.required({ alias: 'x' })`,
  // and may carry `transform` next to `alias`.
  const args = topLevelArgs(input.defaultValue);
  const options = args[args.length - 1];
  const match = options.startsWith('{') ? ALIAS_KEY.exec(options) : null;
  if (!match) {
    return input;
  }
  const bare = args.slice(0, -1).join(', ');
  return { ...input, alias: match[1], defaultValue: bare === '' ? undefined : bare };
}

function withAliases(entry: DocEntry): DocEntry {
  return entry.inputsClass ? { ...entry, inputsClass: entry.inputsClass.map(withAlias) } : entry;
}

/**
 * Project a schema-2 `documentation.json` onto the schema-6 input shape: every
 * component and directive input whose `defaultValue` ends in an options object
 * with `alias: '<x>'` gets `alias: '<x>'` and the bare default. Pure; the input document is not mutated.
 */
export function projectSchemaV2(doc: DocumentationJson): DocumentationJson {
  return {
    ...doc,
    components: doc.components?.map(withAliases),
    directives: doc.directives?.map(withAliases),
  };
}
