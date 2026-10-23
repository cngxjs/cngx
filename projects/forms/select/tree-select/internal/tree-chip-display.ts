import { computed, type Signal } from '@angular/core';
import type { CngxTreeController } from '@cngx/common/interactive';
import type { FlatTreeNode } from '@cngx/utils';

import type { CngxTreeSelectChipDisplay, CngxTreeSelectedItem } from '../tree-select.model';

/** @internal */
export interface TreeChipDisplayOptions<T> {
  /** The full selection, in selection order. */
  readonly selected: Signal<readonly CngxTreeSelectedItem<T>[]>;
  readonly mode: Signal<CngxTreeSelectChipDisplay>;
  readonly treeController: Pick<
    CngxTreeController<T>,
    'findByValue' | 'findById' | 'descendantsOfValue'
  >;
}

/** @internal */
export interface TreeChipDisplay<T> {
  /** The chips the trigger renders, a subset of `selected` in its order. */
  readonly displayed: Signal<readonly CngxTreeSelectedItem<T>[]>;
  /** Whether the chip of `value` stands for a fully selected subtree. */
  summarizes(value: T): boolean;
}

/**
 * Chip list of the tree-select trigger for a `chipDisplay` mode. A parent
 * is fully selected when it and every non-disabled descendant are
 * selected (the rule a cascade toggle writes). A value outside the tree
 * (stale) always shows. One derivation feeds the chips and the touch
 * summary.
 *
 * @internal
 */
export function createTreeChipDisplay<T>(opts: TreeChipDisplayOptions<T>): TreeChipDisplay<T> {
  const tc = opts.treeController;

  /** Ids of the selected values that are in the tree. */
  const selectedIds = computed<ReadonlySet<string>>(() => {
    const ids = new Set<string>();
    for (const item of opts.selected()) {
      const node = tc.findByValue(item.value);
      if (node) {
        ids.add(node.id);
      }
    }
    return ids;
  });

  const isFull = (node: FlatTreeNode<T>, ids: ReadonlySet<string>): boolean => {
    if (!node.hasChildren || !ids.has(node.id)) {
      return false;
    }
    return tc.descendantsOfValue(node.value).every((value) => {
      const d = tc.findByValue(value);
      return !d || d.disabled || ids.has(d.id);
    });
  };

  const displayed = computed<readonly CngxTreeSelectedItem<T>[]>(
    () => {
      const items = opts.selected();
      const mode = opts.mode();
      if (mode === 'all') {
        return items;
      }
      const ids = selectedIds();
      const full = new Map<string, boolean>();
      const fullById = (id: string): boolean => {
        let hit = full.get(id);
        if (hit === undefined) {
          const node = tc.findById(id);
          hit = node ? isFull(node, ids) : false;
          full.set(id, hit);
        }
        return hit;
      };
      return items.filter((item) => {
        const node = tc.findByValue(item.value);
        if (!node) {
          return true;
        }
        if (mode === 'leaves') {
          return !fullById(node.id);
        }
        return !node.parentIds.some(fullById);
      });
    },
    {
      equal: (a, b) =>
        a.length === b.length &&
        a.every((item, i) => item.value === b[i].value && item.label === b[i].label),
    },
  );

  const summarizes = (value: T): boolean => {
    if (opts.mode() !== 'parents') {
      return false;
    }
    const node = tc.findByValue(value);
    return node ? isFull(node, selectedIds()) : false;
  };

  return { displayed, summarizes };
}
