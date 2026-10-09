import { parseTemplate, TmplAstElement, type TmplAstNode } from '@angular/compiler';

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

/** Every element in document order, at any depth, that matches `predicate`. */
export function findElements(
  nodes: readonly unknown[],
  predicate: (element: TmplAstElement) => boolean,
): readonly TmplAstElement[] {
  return nodes.flatMap((node) => {
    const self = node instanceof TmplAstElement && predicate(node) ? [node] : [];
    return [...self, ...findElements(nestedNodes(node), predicate)];
  });
}

/** Inserts `attribute` (e.g. `cngxRipple` or `[skin]="'outline'"`) right after the tag name. */
export function insertAttribute(content: string, element: TmplAstElement, attribute: string): string {
  const offset = element.startSourceSpan.start.offset + 1 + element.name.length;
  return `${content.slice(0, offset)} ${attribute}${content.slice(offset)}`;
}
