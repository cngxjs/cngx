import { isRecord } from '../plan/text';

const PREAMBLE_AT_RULE = /^@(use|forward|import|charset)\b/;
const IMPORT_RULE = /^@import\b/;
const IMPORT_URL = /^@(?:use|forward|import)\s+(['"])(.+?)\1/;

// End offset of the statement starting at `start`: the `;` that is not inside
// quotes or parentheses (`@use 'x' with ($a: 1);`), or the end of input.
function statementEnd(content: string, start: number): number {
  let quote: string | undefined;
  let depth = 0;
  for (let index = start; index < content.length; index++) {
    const char = content[index];
    if (quote) {
      quote = char === quote ? undefined : quote;
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    } else if (char === ';' && depth === 0) {
      return index + 1;
    }
  }
  return content.length;
}

function lineEnd(content: string, from: number): number {
  const newline = content.indexOf('\n', from);
  return newline === -1 ? content.length : newline + 1;
}

// Offset right after the last leading @use/@forward/@import/@charset
// statement, skipping blank lines and comments between them. 0 when the
// file starts with anything else. With `stopBefore`, the offset of the first
// leading statement that matches it instead, when there is one.
function preambleEnd(content: string, stopBefore?: RegExp): number {
  let position = 0;
  let insertAt = 0;
  while (position < content.length) {
    const rest = content.slice(position);
    const leading = /^\s+/.exec(rest)?.[0].length ?? 0;
    const at = position + leading;
    const head = content.slice(at);
    if (head.startsWith('//')) {
      position = lineEnd(content, at);
    } else if (head.startsWith('/*')) {
      const close = content.indexOf('*/', at + 2);
      position = close === -1 ? content.length : close + 2;
    } else if (stopBefore?.test(head) === true) {
      return at;
    } else if (PREAMBLE_AT_RULE.test(head)) {
      position = lineEnd(content, statementEnd(content, at));
      insertAt = position;
    } else {
      return insertAt;
    }
  }
  return insertAt;
}

/** The url of an `@use` / `@forward` / `@import` statement. */
function importUrl(statement: string): string {
  const url = IMPORT_URL.exec(statement.trim())?.[2];
  if (url === undefined) {
    throw new Error(`Not a style import statement: ${statement}`);
  }
  return url;
}

/** Whether the stylesheet already loads the url `statement` loads, through any of the three at-rules. */
export function hasStyleImport(content: string, statement: string): boolean {
  const url = importUrl(statement);
  return content
    .split('\n')
    .some((line) => IMPORT_URL.exec(line.trim())?.[2] === url);
}

/**
 * Places `statement` after the existing `@use` / `@forward` / `@import`
 * lines and before the first rule. Sass rejects or silently drops a module
 * load that follows a rule, so appending is never safe.
 */
export function insertStyleImport(content: string, statement: string): string {
  if (hasStyleImport(content, statement)) {
    return content;
  }
  const at = preambleEnd(content);
  const needsNewline = at > 0 && !content.slice(0, at).endsWith('\n');
  return `${content.slice(0, at)}${needsNewline ? '\n' : ''}${statement.trim()}\n${content.slice(at)}`;
}

/**
 * Places `statement` before the first `@import`, so the file it loads comes
 * ahead of every other imported file in the bundle. `@charset`, `@use` and
 * `@forward` stay in front: Sass rejects a `@use` that follows an `@import`,
 * and hoists plain CSS imports above the module output anyway. Without an
 * `@import` it lands where {@link insertStyleImport} puts it.
 */
export function insertLeadingStyleImport(content: string, statement: string): string {
  if (hasStyleImport(content, statement)) {
    return content;
  }
  const at = preambleEnd(content, IMPORT_RULE);
  const needsNewline = at > 0 && !content.slice(0, at).endsWith('\n');
  return `${content.slice(0, at)}${needsNewline ? '\n' : ''}${statement.trim()}\n${content.slice(at)}`;
}

/**
 * The path a build `styles` entry loads: the entry itself, or the `input` of
 * an object entry (`{ input, bundleName, inject }`). Anything else has none.
 */
export function styleEntryPath(entry: unknown): string | undefined {
  if (typeof entry === 'string') {
    return entry;
  }
  return isRecord(entry) && typeof entry['input'] === 'string' ? entry['input'] : undefined;
}
