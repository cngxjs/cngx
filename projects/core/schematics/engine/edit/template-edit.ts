import { parseTemplate, type TmplAstNode } from '@angular/compiler';

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
