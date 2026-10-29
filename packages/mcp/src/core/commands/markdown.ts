// Markdown building blocks the command renderers share. Plain GitHub-flavoured
// markdown, no ANSI: the output goes to agents and CI logs as often as to a
// terminal. Every helper is pure.

/** One line of cell text: newlines collapsed, pipes escaped, `-` for an empty value. */
export function cell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value).replace(/\s*\r?\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
}

/** Inline code for a non-empty value, `-` otherwise. */
export function code(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return `\`${cell(value).replace(/`/g, "'")}\``;
}

/** A table with the minimal `|-|` separator; `rows` are already cell-formatted. */
export function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]) => `|${cells.join('|')}|`;
  return [line(headers), line(headers.map(() => '-')), ...rows.map(line)].join('\n');
}

/** A `## title` section with `body`, or with `empty` when the body would be empty. */
export function section(title: string, body: string, empty: string): string {
  return `## ${title}\n\n${body === '' ? empty : body}`;
}

/** Join non-empty blocks with one blank line and end with a newline. */
export function blocks(...parts: readonly (string | null | undefined | false)[]): string {
  return `${parts.filter((part): part is string => typeof part === 'string' && part !== '').join('\n\n')}\n`;
}

/** A bullet list, or `''` for no items. */
export function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, body: string) => {
    if (!body.startsWith('#')) {
      return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
    }
    const hex = body[1] === 'x' || body[1] === 'X';
    const codePoint = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
    // Past U+10FFFF `fromCodePoint` throws, and a lone surrogate is not a character;
    // both stay as the text the docs carried.
    const isSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff;
    return codePoint > 0x10ffff || isSurrogate ? entity : String.fromCodePoint(codePoint);
  });
}

/**
 * compodoc HTML as plain text: `<example-url>` anchors removed (they carry the
 * build-time base, the structured `exampleUrls` field has the public one),
 * `<code>` as backticks, list items as `- ` lines, other tags stripped, entities
 * decoded. Whitespace collapses inside a paragraph; `</p><p>` and `<br>` stay
 * paragraph breaks.
 */
export function toPlainText(html: string): string {
  const text = html
    .replace(/<example-url>[\s\S]*?<\/example-url>/gi, '')
    .replace(/<br\s*\/?>|<\/p>|<\/?(?:ul|ol|div|table|h\d)[^>]*>/gi, '\n\n')
    .replace(/<li(?:\s[^>]*)?>/gi, '\n\n- ')
    .replace(/<\/?code>/gi, '`')
    .replace(/<\/?[a-z][^>]*>/gi, '');
  return decodeEntities(text)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph !== '')
    .join('\n\n');
}

/**
 * The display text of a description field. compodoc renders JSDoc to HTML
 * wrapped in `<p>` (entry, member and DI-token descriptions); theme overviews,
 * theme-token and slot descriptions are markdown source and pass through, since
 * a literal `<color>` in them is text, not a tag.
 */
export function docText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return /^\s*<p>/i.test(value) ? toPlainText(value) : value.trim();
}

const CELL_MAX = 200;

/** A description as one table cell, capped at 200 characters on a word boundary. */
export function textCell(value: string | null | undefined): string {
  const text = cell(docText(value));
  if (text.length <= CELL_MAX) {
    return text;
  }
  const cut = text.slice(0, CELL_MAX);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.\\-]+$/, '')}...`;
}
