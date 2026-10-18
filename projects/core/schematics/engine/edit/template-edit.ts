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

/**
 * Inserts `markup` in front of the first `<selector>` element: on a line of
 * its own with the element's indent when the element starts its line, else
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
  const element = firstElement(content, selector);
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
 * above never deletes them. The existing content stays byte for byte; only a
 * missing final newline is added. `newline` defaults to the one the content
 * uses; an inline template passes the one of its host file.
 */
export function appendElements(content: string, markup: readonly string[], newline = newlineOf(content)): string {
  const head = content === '' || content.endsWith('\n') ? content : `${content}${newline}`;
  return `${head}${markup.map((line) => `${line}${newline}`).join('')}`;
}
