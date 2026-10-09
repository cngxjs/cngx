const STAMP = /^\/\* cngx:generated [0-9a-f]{8} \*\/\r?\n/;
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

/**
 * Header lines for a file cngx generates. A later run that finds them knows
 * the file is its own and leaves it alone instead of overwriting it.
 */
export function createProvenanceStamp(source: string, version: string): string {
  return `/* cngx:generated ${shortHash(`${source}@${version}`)} */\n/* ${source}, @cngx ${version} */\n`;
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
