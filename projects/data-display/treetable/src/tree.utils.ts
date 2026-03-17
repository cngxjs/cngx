import type { FlatNode, Node, TreetableOptions } from './models';

/**
 * Flattens a tree (or forest) into a depth-first ordered array of {@link FlatNode}s.
 *
 * @param input - A single root node or an array of root nodes.
 * @param nodeId - Optional function to derive a stable ID from the node value and
 *   its path in the tree. When omitted, IDs are the path indices joined by `"-"`
 *   (e.g. `"0"`, `"0-1"`, `"0-1-2"`).
 * @returns A flat array where every node contains its depth, parent ID chain, and
 *   a flag indicating whether it has children.
 */
export function flattenTree<T>(
  input: Node<T> | Node<T>[],
  nodeId?: (node: T, path: readonly number[]) => string,
): FlatNode<T>[] {
  const roots = Array.isArray(input) ? input : [input];
  const result: FlatNode<T>[] = [];
  const resolveId = nodeId ?? ((_node: T, path: readonly number[]) => path.join('-'));

  function process(node: Node<T>, depth: number, parentIds: readonly string[], path: readonly number[]): void {
    const id = resolveId(node.value, path);
    result.push({
      id,
      value: node.value,
      depth,
      hasChildren: (node.children?.length ?? 0) > 0,
      parentIds,
    });
    node.children?.forEach((child, i) => process(child, depth + 1, [...parentIds, id], [...path, i]));
  }

  roots.forEach((root, i) => process(root, 0, [], [i]));
  return result;
}

/**
 * Extracts the list of column keys to display from a tree's first node.
 * Only keys with primitive (non-object, or `null`) values are included by default.
 *
 * @param input - The tree or forest to inspect.
 * @param options - If `customColumnOrder` is set it is returned as-is.
 * @returns An ordered array of column key strings.
 */
export function extractColumns<T>(
  input: Node<T> | Node<T>[],
  options?: Pick<TreetableOptions<T>, 'customColumnOrder'>,
): ReadonlyArray<string> {
  if (options?.customColumnOrder) return [...options.customColumnOrder] as string[];
  const firstNode = Array.isArray(input) ? input[0] : input;
  if (!firstNode) return [];
  return Object.entries(firstNode.value as Record<string, unknown>)
    .filter(([, v]) => typeof v !== 'object' || v === null)
    .map(([k]) => k);
}

/**
 * Returns `true` when all of `node`'s ancestors are in the `expandedIds` set,
 * meaning the node should currently be visible in the table.
 */
export function isNodeVisible(node: FlatNode<unknown>, expandedIds: ReadonlySet<string>): boolean {
  return node.parentIds.every(id => expandedIds.has(id));
}

/**
 * Builds the initial set of expanded IDs by collecting every node that has
 * children — i.e. the tree starts fully expanded.
 */
export function getInitialExpandedIds<T>(nodes: FlatNode<T>[]): ReadonlySet<string> {
  return new Set(nodes.filter(n => n.hasChildren).map(n => n.id));
}

/**
 * Uppercases the first character of a string.
 * Used to format auto-generated column header labels.
 */
export function capitalise(str: string): string {
  return str.length === 0 ? '' : str.charAt(0).toUpperCase() + str.slice(1);
}
