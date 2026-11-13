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
 */
export type CngxTreeSelectChipDisplay = 'parents' | 'leaves' | 'all';

/**
 * Resolved selection entry surfaced to the chip strip and the chip /
 * trigger-label slots. Carries a display label alongside the raw value
 * so custom markup never has to call `labelFn`.
 */
export interface CngxTreeSelectedItem<T = unknown> {
  readonly value: T;
  readonly label: string;
}

/**
 * Values the `*cngxTreeSelectChip` template receives for each selected item
 * in the trigger strip of `CngxTreeSelect`.
 *
 * The shape mirrors `CngxMultiSelectChipContext`, so one chip template works
 * on both hosts. Which items arrive depends on `chipDisplay`: with
 * `'parents'` one item can stand for a whole selected subtree. The strip, and
 * with it this template, renders only while the touch floor is off; under the
 * touch floor (coarse pointer or `data-touch="on"`) the trigger shows the
 * touch summary instead. `remove` runs the same commit-aware path
 * as the built-in chip and returns focus to the trigger, so a custom remove
 * button needs only its own accessible name.
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
 * Values the `*cngxTreeSelectTriggerLabel` template receives while at least
 * one value is selected.
 *
 * The template replaces the whole chip strip and the touch summary of
 * `CngxTreeSelect`, so it renders with and without the touch floor. The shape mirrors the
 * trigger-label context of the flat composites, so a `"3 selected"` template
 * can be shared. `count` counts every selected value, independent of
 * `chipDisplay`, and `selected` carries the resolved labels so the template
 * never calls `labelFn`.
 */
export interface CngxTreeSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxTreeSelectedItem<T>[];
  readonly selected: readonly CngxTreeSelectedItem<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Values the `*cngxTreeSelectNode` template receives for each visible row of
 * the `CngxTreeSelect` panel.
 *
 * The template replaces the whole treeitem, so it owns the row ARIA the
 * built-in row sets: `role="treeitem"`, `id` from `node.id` (the
 * active-descendant target), `aria-level` from `depth + 1`, `aria-posinset` and
 * `aria-setsize` from `node`, `aria-expanded` on parents and `aria-checked`
 * (`'mixed'` while `indeterminate`). The context carries the flat-projected
 * node plus the reactive derivations the panel uses, so custom markup mirrors
 * the built-in row without re-querying.
 *
 * `toggleExpand` / `handleSelect` are closed callbacks bound to the
 * surrounding component - wire into `(click)` on a custom twisty
 * button or row body.
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

/**
 * Context for `*cngxTreeSelectFooter`, the footer below the tree in the
 * panel: the selected count and the clear-all action. In the mobile sheet the
 * footer is the bottom bar. `clear` runs the same commit-aware clear path as
 * the trigger clear button (announcement, `cleared`, `selectionChange`
 * included) and is a no-op while nothing is selected.
 */
export interface CngxTreeSelectFooterContext {
  /** Number of selected values. */
  readonly $implicit: number;
  readonly count: number;
  /** The `selectedCount` copy for `count` (default `'{count} selected'`). */
  readonly countText: string;
  /** Clear the whole selection. */
  readonly clear: () => void;
  /** Visible label of the clear action (the clear-button copy cascade). */
  readonly clearLabel: string;
  /** `true` while nothing is selected. */
  readonly empty: boolean;
}

export { type CngxTreeNode } from '@cngx/utils';
