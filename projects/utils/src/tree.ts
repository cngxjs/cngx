/**
 * Pure tree utilities for hierarchical data. Framework-agnostic (Level 0).
 *
 * Used by `@cngx/common/interactive` (CngxTreeController) and
 * `@cngx/forms/select` (CngxTreeSelect). Fresh implementation — deliberately
 * not shared with `@cngx/data-display/treetable`.
 */

/**
 * Input shape for a hierarchical tree. Consumers supply this; library never
 * mutates it. `children` may be omitted for leaves.
 */
export interface CngxTreeNode<T> {
  readonly value: T;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly children?: readonly CngxTreeNode<T>[];
}

/**
 * Flat-projected node carrying all ARIA-relevant metadata. Produced by
 * `flattenTree` in DFS order. IDs are stable across equivalent invocations so
 * long as `idFn` (or default path-based id) is deterministic.
 *
 * `parentIds` is the chain from root to the immediate parent (exclusive of
 * self). Empty for root-level nodes.
 */
export interface FlatTreeNode<T> {
  readonly id: string;
  readonly value: T;
  readonly label: string;
  readonly depth: number;
  readonly parentIds: readonly string[];
  readonly hasChildren: boolean;
  readonly disabled: boolean;
  readonly posinset: number;
  readonly setsize: number;
  /**
   * Back-reference to the source tree node. Lets consumers reach `children`
   * (e.g. cascade-select helpers) without a parallel DFS walk.
   */
  readonly node: CngxTreeNode<T>;
}

type IdFn<T> = (value: T, path: readonly number[]) => string;
type LabelFn<T> = (value: T) => string;

const defaultIdFn: IdFn<unknown> = (_value, path) => path.join('.');
const defaultLabelFn: LabelFn<unknown> = (value) => String(value);

/**
 * Flatten a tree in DFS order. Each emitted `FlatTreeNode` carries
 * `aria-level` (`depth + 1`), `aria-posinset`, and `aria-setsize` data so the
 * rendering layer can bind them directly.
 *
 * @param nodes Root-level tree nodes.
 * @param idFn Derives a stable id from `(value, path)`. Defaults to
 *   `path.join('.')` — adequate for static trees; supply a key-based `idFn`
 *   for data that may be re-ordered without changing identity.
 * @param labelFn Derives visible label. Defaults to `String(value)`.
 */
export function flattenTree<T>(
  nodes: readonly CngxTreeNode<T>[],
  idFn: IdFn<T> = defaultIdFn as IdFn<T>,
  labelFn: LabelFn<T> = defaultLabelFn as LabelFn<T>,
): FlatTreeNode<T>[] {
  const out: FlatTreeNode<T>[] = [];
  const visit = (
    siblings: readonly CngxTreeNode<T>[],
    depth: number,
    parentIds: readonly string[],
    basePath: readonly number[],
  ): void => {
    const setsize = siblings.length;
    for (let i = 0; i < siblings.length; i++) {
      const node = siblings[i];
      const path = [...basePath, i];
      const id = idFn(node.value, path);
      const label = node.label ?? labelFn(node.value);
      const children = node.children ?? [];
      const hasChildren = children.length > 0;
      out.push({
        id,
        value: node.value,
        label,
        depth,
        parentIds,
        hasChildren,
        disabled: node.disabled === true,
        posinset: i + 1,
        setsize,
        node,
      });
      if (hasChildren) {
        visit(children, depth + 1, [...parentIds, id], path);
      }
    }
  };
  visit(nodes, 0, [], []);
  return out;
}

/**
 * A flat node is visible iff every ancestor in its `parentIds` chain is
 * present in `expandedIds`. Root nodes (empty chain) are always visible.
 */
export function isNodeVisible<T>(
  node: FlatTreeNode<T>,
  expandedIds: ReadonlySet<string>,
): boolean {
  for (const pid of node.parentIds) {
    if (!expandedIds.has(pid)) {
      return false;
    }
  }
  return true;
}

/**
 * DFS visitor. `visit` is called once per node with the current depth.
 */
export function walkTree<T>(
  nodes: readonly CngxTreeNode<T>[],
  visit: (node: CngxTreeNode<T>, depth: number) => void,
): void {
  const go = (siblings: readonly CngxTreeNode<T>[], depth: number): void => {
    for (const node of siblings) {
      visit(node, depth);
      if (node.children && node.children.length > 0) {
        go(node.children, depth + 1);
      }
    }
  };
  go(nodes, 0);
}

/**
 * Collect all descendant values of a node (exclusive of the node itself),
 * in DFS order. For cascade-select: toggling a parent flips all entries in
 * this list atomically.
 */
export function collectDescendantValues<T>(node: CngxTreeNode<T>): T[] {
  const out: T[] = [];
  const children = node.children ?? [];
  for (const child of children) {
    out.push(child.value);
    if (child.children && child.children.length > 0) {
      const subtree = collectDescendantValues(child);
      for (const v of subtree) {
        out.push(v);
      }
    }
  }
  return out;
}

/**
 * Return a new tree containing only nodes whose `value` matches `predicate`
 * **or** have at least one matching descendant. Ancestors of any match are
 * preserved so the path is never broken; branches with zero matches are
 * dropped entirely.
 *
 * Fresh implementation — not ported from `@cngx/data-display/treetable`.
 */
export function filterTree<T>(
  nodes: readonly CngxTreeNode<T>[],
  predicate: (value: T) => boolean,
): CngxTreeNode<T>[] {
  const out: CngxTreeNode<T>[] = [];
  for (const node of nodes) {
    const filteredChildren = node.children
      ? filterTree(node.children, predicate)
      : [];
    const selfMatches = predicate(node.value);
    if (selfMatches || filteredChildren.length > 0) {
      out.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      });
    }
  }
  return out;
}

/**
 * Return a new tree where each level's siblings are sorted independently by
 * the `by` extractor. Child ordering is stable within its own level only —
 * the relative position of nodes across different parents is irrelevant.
 *
 * Fresh implementation — not ported from `@cngx/data-display/treetable`.
 */
export function sortTree<T>(
  nodes: readonly CngxTreeNode<T>[],
  by: (value: T) => string | number,
  direction: 'asc' | 'desc' = 'asc',
): CngxTreeNode<T>[] {
  const mult = direction === 'desc' ? -1 : 1;
  const cmp = (a: CngxTreeNode<T>, b: CngxTreeNode<T>): number => {
    const av = by(a.value);
    const bv = by(b.value);
    if (av < bv) {
      return -1 * mult;
    }
    if (av > bv) {
      return 1 * mult;
    }
    return 0;
  };
  const sorted = [...nodes].sort(cmp);
  return sorted.map((node) => ({
    ...node,
    children:
      node.children && node.children.length > 0
        ? sortTree(node.children, by, direction)
        : node.children,
  }));
}
