import { type FlatTreeNode } from '@cngx/utils';

/**
 * Re-export of `@cngx/utils`'s `CngxTreeNode<T>` so `CngxTreeSelect`
 * consumers import everything from a single secondary-entry. Shape
 * unchanged: `value` / `label?` / `disabled?` / `children?`.
 */
export type { FlatTreeNode };

/**
 * Action reported on `CngxTreeSelectChange.action`. Split out for
 * `switch`-style narrowing without importing the change interface.
 *
 *   - `'toggle'` - single node flipped.
 *   - `'cascade-toggle'` - parent toggle propagated to all descendants
 *     atomically (requires `[cascadeChildren]="true"`).
 *   - `'clear'` - full selection cleared.
 *
 * @category forms/select/tree-select
 */
export type CngxTreeSelectAction = 'toggle' | 'cascade-toggle' | 'clear';

/**
 * Which selected values the trigger shows as chips.
 *
 *   - `'parents'` - a fully selected subtree (the node and every
 *     non-disabled descendant selected) shows as one chip for its topmost
 *     node; removing that chip deselects the subtree.
 *   - `'leaves'` - a fully selected parent is hidden; its descendants show.
 *   - `'all'` - one chip per selected value.
 *
 * Default: `'parents'` with `[cascadeChildren]="true"`, else `'all'`.
 *
 * @category forms/select/tree-select
 */
export type CngxTreeSelectChipDisplay = 'parents' | 'leaves' | 'all';

/**
 * Resolved selection entry surfaced to the chip strip and the chip /
 * trigger-label slots. Carries a display label alongside the raw value
 * so custom markup never has to call `labelFn`.
 *
 * @category forms/select/tree-select
 */
export interface CngxTreeSelectedItem<T = unknown> {
  readonly value: T;
  readonly label: string;
}

/**
 * Context for `*cngxTreeSelectChip`. Mirrors `CngxMultiSelectChipContext`
 * shape so consumer snippets share across variants.
 *
 * @category forms/select/tree-select
 */
export interface CngxTreeSelectChipContext<T = unknown> {
  readonly $implicit: CngxTreeSelectedItem<T>;
  readonly option: CngxTreeSelectedItem<T>;
  /**
   * Commit-aware removal. A chip that summarizes a fully selected subtree
   * (`chipDisplay` `'parents'`) deselects that subtree; any other chip
   * deselects its one value.
   */
  readonly remove: () => void;
}

/**
 * Context for `*cngxTreeSelectTriggerLabel`. Mirrors the flat-family
 * trigger-label context so `"3 selected"` summaries share templates.
 *
 * @category forms/select/tree-select
 */
export interface CngxTreeSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxTreeSelectedItem<T>[];
  readonly selected: readonly CngxTreeSelectedItem<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Context for `*cngxTreeSelectNode`. Carries the flat-projected node
 * plus the reactive derivations the panel uses (selected,
 * indeterminate, expanded), so custom markup mirrors the built-in row
 * without re-querying.
 *
 * `toggleExpand` / `handleSelect` are closed callbacks bound to the
 * surrounding component - wire into `(click)` on a custom twisty
 * button or row body.
 *
 * @category forms/select/tree-select
 */
export interface CngxTreeSelectNodeContext<T = unknown> {
  readonly $implicit: FlatTreeNode<T>;
  readonly node: FlatTreeNode<T>;
  readonly depth: number;
  readonly expanded: boolean;
  readonly hasChildren: boolean;
  readonly selected: boolean;
  readonly indeterminate: boolean;
  readonly disabled: boolean;
  /** Selected descendants of this node, all levels. `0` on a leaf. */
  readonly selectedCount: number;
  /** All descendants of this node, all levels. `0` on a leaf. */
  readonly descendantCount: number;
  /** Flip the expansion state of this node. No-op on leaves. */
  readonly toggleExpand: () => void;
  /** Run the select-path for this node (respects cascade / commit). */
  readonly handleSelect: () => void;
}

/**
 * Context for `*cngxTreeSelectNodeCount`, the selected-of-total count at the
 * inline end of a parent row in the default row markup. The count renders
 * inside an `aria-hidden` wrapper the host owns: `aria-checked` (true /
 * mixed / false) already carries the state it summarizes.
 *
 * @category forms/select/tree-select
 */
export interface CngxTreeSelectNodeCountContext<T = unknown> {
  /** The built-in count text (`treeNodeCount` copy, default `'{selected}/{total}'`). */
  readonly $implicit: string;
  readonly text: string;
  /** Selected descendants, all levels. */
  readonly selected: number;
  /** All descendants, all levels. */
  readonly total: number;
  readonly node: FlatTreeNode<T>;
}

export { type CngxTreeNode } from '@cngx/utils';
