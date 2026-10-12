const STAMP = /^(?:\/\* cngx:generated [0-9a-f]{8} \*\/|<!-- cngx:generated [0-9a-f]{8} -->)\r?\n/;
const MARKER_ID = /^[a-z0-9][a-z0-9:@/._-]*$/i;

// FNV-1a, 32 bit. Identifies source and version in eight hex digits; not a
// security boundary, so no crypto dependency in the pure plan folder.
function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** How a stamp line is commented: a block comment for code and CSS, an HTML comment for markdown. */
export type StampComment = 'block' | 'html';

function comment(text: string, style: StampComment): string {
  return style === 'html' ? `<!-- ${text} -->` : `/* ${text} */`;
}

/**
 * Header lines for a file cngx generates. A later run that finds them knows
 * the file is its own and leaves it alone instead of overwriting it.
 */
export function createProvenanceStamp(source: string, version: string, style: StampComment = 'block'): string {
  const generated = comment(`cngx:generated ${shortHash(`${source}@${version}`)}`, style);
  return `${generated}\n${comment(`${source}, @cngx ${version}`, style)}\n`;
}

/**
 * Eight hex digits that change with the content; tells a stale generated
 * file from a current one. Line endings are left out, so a checkout that
 * turns the file into CRLF (`core.autocrlf`) still reads as current.
 */
export function contentFingerprint(content: string): string {
  return shortHash(content.replace(/\r\n/g, '\n'));
}

export function hasProvenanceStamp(content: string): boolean {
  return STAMP.test(content);
}

function marker(id: string): string {
  if (!MARKER_ID.test(id)) {
    throw new Error(`Invalid provenance marker id "${id}".`);
  }
  return `/* cngx:${id} */`;
}

/**
 * Tags a snippet cngx inserts into a consumer file (an import line, a
 * provider) so a later run recognises its own edit. The marker goes at the
 * end of the snippet, before a trailing newline.
 */
export function withProvenanceMarker(content: string, id: string): string {
  const tag = marker(id);
  const newline = /\r?\n$/.exec(content)?.[0] ?? '';
  return `${content.slice(0, content.length - newline.length)} ${tag}${newline}`;
}

export function hasProvenanceMarker(content: string, id: string): boolean {
  return content.includes(marker(id));
}
