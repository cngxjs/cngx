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
  const resolveId = nodeId ?? ((_node: T, path: readonly number[]) => path.join('-'));

  const process = (
    node: Node<T>,
    depth: number,
    parentIds: readonly string[],
    path: readonly number[],
  ): FlatNode<T>[] => {
    const id = resolveId(node.value, path);
    const self: FlatNode<T> = {
      id,
      value: node.value,
      depth,
      hasChildren: (node.children?.length ?? 0) > 0,
      parentIds,
    };
    const children =
      node.children?.flatMap((child, i) =>
        process(child, depth + 1, [...parentIds, id], [...path, i]),
      ) ?? [];
    return [self, ...children];
  };

  return roots.flatMap((root, i) => process(root, 0, [], [i]));
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
): readonly string[] {
  if (options?.customColumnOrder) {
    return [...options.customColumnOrder] as string[];
  }
  const firstNode = Array.isArray(input) ? input[0] : input;
  if (!firstNode) {
    return [];
  }
  return Object.entries(firstNode.value as Record<string, unknown>)
    .filter(([, v]) => typeof v !== 'object' || v === null)
    .map(([k]) => k);
}

/**
 * Returns `true` when all of `node`'s ancestors are in the `expandedIds` set,
 * meaning the node should currently be visible in the table.
 */
export function isNodeVisible(node: FlatNode<unknown>, expandedIds: ReadonlySet<string>): boolean {
  return node.parentIds.every((id) => expandedIds.has(id));
}

/**
 * Builds the initial set of expanded IDs by collecting every node that has
 * children — i.e. the tree starts fully expanded.
 */
export function getInitialExpandedIds<T>(nodes: FlatNode<T>[]): ReadonlySet<string> {
  return new Set(nodes.filter((n) => n.hasChildren).map((n) => n.id));
}

/**
 * Uppercases the first character of a string.
 * Used to format auto-generated column header labels.
 */
export function capitalise(str: string): string {
  return str.length === 0 ? '' : str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Filters a tree recursively. A parent node is kept if it matches the predicate
 * OR if at least one of its descendants matches.
 */
export function filterTree<T>(nodes: Node<T>[], predicate: (value: T) => boolean): Node<T>[] {
  return nodes.reduce<Node<T>[]>((acc, node) => {
    const filteredChildren = node.children ? filterTree(node.children, predicate) : undefined;
    const selfMatches = predicate(node.value);
    if (selfMatches || (filteredChildren?.length ?? 0) > 0) {
      acc.push({ ...node, children: filteredChildren });
    }
    return acc;
  }, []);
}

/**
 * Sorts each level of the tree independently by a field key.
 * Children remain grouped under their parent; only sibling order changes.
 */
export function sortTree<T>(nodes: Node<T>[], field: string, direction: 'asc' | 'desc'): Node<T>[] {
  const toPrimitive = (v: unknown): string => {
    if (v === null || v === undefined || typeof v === 'object') {
      return '';
    }
    return String(v as string | number | boolean | bigint);
  };
  const sorted = [...nodes].sort((a, b) => {
    const av = toPrimitive((a.value as Record<string, unknown>)[field]);
    const bv = toPrimitive((b.value as Record<string, unknown>)[field]);
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted.map((node) => ({
    ...node,
    children: node.children ? sortTree(node.children, field, direction) : undefined,
  }));
}

/**
 * Simple full-text search across all primitive fields of a node value.
 * Used as the default search implementation in CngxSmartDataSource.
 */
export function nodeMatchesSearch<T>(value: T, term: string): boolean {
  const lower = term.toLowerCase();
  return Object.values(value as Record<string, unknown>).some((v) => {
    if (v === null || v === undefined || typeof v === 'object') {
      return false;
    }
    return String(v as string | number | boolean | bigint)
      .toLowerCase()
      .includes(lower);
  });
}
