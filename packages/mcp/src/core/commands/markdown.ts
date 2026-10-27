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
