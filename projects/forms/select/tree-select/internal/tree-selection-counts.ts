import { computed, type Signal } from '@angular/core';
import type { FlatTreeNode } from '@cngx/utils';

/** Selected and total descendants of one parent node. @internal */
export interface TreeSelectionCount {
  readonly selected: number;
  readonly total: number;
}

/** @internal */
export interface TreeSelectionCountsOptions<T> {
  /** Every node of the tree in DFS order (expansion does not matter). */
  readonly flatNodes: Signal<readonly FlatTreeNode<T>[]>;
  readonly values: Signal<readonly T[]>;
  /** Node of a value, `keyFn`-aware (`treeController.findByValue`). */
  readonly findByValue: (value: T) => FlatTreeNode<T> | undefined;
}

/**
 * Per-parent "selected of total" over all descendant levels, in one
 * post-order pass per selection or tree change (never one walk per row).
 * Leaves have no entry.
 *
 * @internal
 */
export function createTreeSelectionCounts<T>(
  opts: TreeSelectionCountsOptions<T>,
): Signal<ReadonlyMap<string, TreeSelectionCount>> {
  return computed(
    () => {
      const nodes = opts.flatNodes();
      const selectedIds = new Set<string>();
      for (const value of opts.values()) {
        const node = opts.findByValue(value);
        if (node) {
          selectedIds.add(node.id);
        }
      }
      const totals = new Map<string, { selected: number; total: number }>();
      // Reverse DFS order visits every child before its parent: each node
      // adds itself plus its own subtree to its direct parent.
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const own = totals.get(node.id);
        const parentId = node.parentIds[node.parentIds.length - 1];
        if (parentId === undefined) {
          continue;
        }
        let parent = totals.get(parentId);
        if (!parent) {
          parent = { selected: 0, total: 0 };
          totals.set(parentId, parent);
        }
        parent.total += 1 + (own?.total ?? 0);
        parent.selected += (selectedIds.has(node.id) ? 1 : 0) + (own?.selected ?? 0);
      }
      return totals as ReadonlyMap<string, TreeSelectionCount>;
    },
    { equal: sameCounts },
  );
}

function sameCounts(
  a: ReadonlyMap<string, TreeSelectionCount>,
  b: ReadonlyMap<string, TreeSelectionCount>,
): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const [id, count] of a) {
    const other = b.get(id);
    if (other?.selected !== count.selected || other.total !== count.total) {
      return false;
    }
  }
  return true;
}
