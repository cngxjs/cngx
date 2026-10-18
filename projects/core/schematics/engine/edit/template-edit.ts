import { parseTemplate, TmplAstElement, type TmplAstNode } from '@angular/compiler';

import { newlineOf } from '../plan/text';

// Node fields that hold nested template nodes: element and template
// children plus the branches of control-flow and defer blocks. `@switch`
// nests as `groups[] -> { cases, children }` since Angular 21.
const NESTED_KEYS = ['children', 'branches', 'groups', 'cases', 'empty', 'placeholder', 'loading', 'error'] as const;

/** Parses an Angular template; parse errors throw instead of yielding a partial tree. */
export function parseTemplateContent(content: string, url = 'template.html'): readonly TmplAstNode[] {
  const parsed = parseTemplate(content, url, { preserveWhitespaces: true });
  if (parsed.errors && parsed.errors.length > 0) {
    throw new Error(`Cannot parse ${url}: ${parsed.errors.map((error) => error.msg).join('; ')}`);
  }
  return parsed.nodes;
}

function nestedNodes(node: unknown): readonly unknown[] {
  if (typeof node !== 'object' || node === null) {
    return [];
  }
  const record = node as Readonly<Record<string, unknown>>;
  return NESTED_KEYS.flatMap((key) => {
    const value: unknown = record[key];
    if (Array.isArray(value)) {
      return value as readonly unknown[];
    }
    return value ? [value] : [];
  });
}

/** Every node in document order, at any depth: elements, templates, blocks and text. */
export function walkNodes(nodes: readonly unknown[]): readonly unknown[] {
  return nodes.flatMap((node) => [node, ...walkNodes(nestedNodes(node))]);
}

// The first `<selector>` element at any depth, control-flow blocks included.
function firstElement(content: string, selector: string): TmplAstElement | undefined {
  return walkNodes(parseTemplateContent(content)).find(
    (node): node is TmplAstElement => node instanceof TmplAstElement && node.name === selector,
  );
}

/** Whether the template holds a `<selector>` element at any depth. Throws when it does not parse. */
export function hasElement(content: string, selector: string): boolean {
  return firstElement(content, selector) !== undefined;
}

// The comments `ng new` puts around the placeholder content it tells the
// user to delete: one opens the block, the last one closes it.
const PLACEHOLDER_START = 'The content below';
const PLACEHOLDER_END = 'End of Placeholder';

// Where the CLI placeholder block runs, read from the template's comment
// nodes: from its opening comment (else the start) to the end of its closing
// comment. `undefined` without a closing comment.
function placeholderBlock(content: string): { readonly start: number; readonly end: number } | undefined {
  const comments = parseTemplate(content, 'template.html', { preserveWhitespaces: true, collectCommentNodes: true }).commentNodes ?? [];
  const close = [...comments].reverse().find((comment) => comment.value.includes(PLACEHOLDER_END));
  if (close === undefined) {
    return undefined;
  }
  const open = comments.find(
    (comment) => comment.value.includes(PLACEHOLDER_START) && comment.sourceSpan.end.offset <= close.sourceSpan.start.offset,
  );
  return { start: open?.sourceSpan.start.offset ?? 0, end: close.sourceSpan.end.offset };
}

// The first `<selector>` element outside the CLI placeholder block.
function firstElementOutsidePlaceholder(content: string, selector: string): TmplAstElement | undefined {
  const block = placeholderBlock(content);
  return walkNodes(parseTemplateContent(content)).find(
    (node): node is TmplAstElement =>
      node instanceof TmplAstElement &&
      node.name === selector &&
      (block === undefined || node.sourceSpan.start.offset < block.start || node.sourceSpan.start.offset >= block.end),
  );
}

/**
 * Whether the template holds a `<selector>` element outside the placeholder
 * block of an `ng new` template, which the user is told to delete: the
 * elements `insertBeforeElement` places markup in front of. Throws when the
 * template does not parse.
 */
export function hasElementOutsidePlaceholder(content: string, selector: string): boolean {
  return firstElementOutsidePlaceholder(content, selector) !== undefined;
}

/**
 * Inserts `markup` in front of the first `<selector>` element outside the
 * CLI placeholder block (`hasElementOutsidePlaceholder`): on a line of its
 * own with the element's indent when the element starts its line, else
 * right before it. Returns the content unchanged without such an element;
 * throws when the template does not parse. `newline` defaults to the one the
 * content uses; an inline template passes the one of its host file.
 */
export function insertBeforeElement(
  content: string,
  selector: string,
  markup: string,
  newline = newlineOf(content),
): string {
  const element = firstElementOutsidePlaceholder(content, selector);
  if (element === undefined) {
    return content;
  }
  const start = element.sourceSpan.start.offset;
  const lineStart = content.lastIndexOf('\n', start - 1) + 1;
  const indent = content.slice(lineStart, start);
  if (indent.trim() !== '') {
    return `${content.slice(0, start)}${markup} ${content.slice(start)}`;
  }
  return `${content.slice(0, lineStart)}${indent}${markup}${newline}${content.slice(lineStart)}`;
}

/**
 * Appends each of `markup` on a line of its own at the end of the template,
 * after whatever ends it (a trailing comment included), so deleting a block
 * above never deletes them. Each line takes the indent of the template's
 * first line, and a whitespace-only last line (the indent before the closing
 * backtick of an inline template) stays last, so no whitespace-only line is
 * left above the new ones. The existing content stays byte for byte; only a
 * missing final newline is added. `newline` defaults to the one the content
 * uses; an inline template passes the one of its host file.
 */
export function appendElements(content: string, markup: readonly string[], newline = newlineOf(content)): string {
  const tail = content.slice(content.lastIndexOf('\n') + 1);
  const closing = tail.trim() === '' ? tail : '';
  const body = content.slice(0, content.length - closing.length);
  const head = body === '' || body.endsWith('\n') ? body : `${body}${newline}`;
  const firstLine = content.split('\n').find((line) => line.trim() !== '') ?? '';
  const indent = /^[ \t]*/.exec(firstLine)?.[0] ?? '';
  return `${head}${markup.map((line) => `${indent}${line}${newline}`).join('')}${closing}`;
}
