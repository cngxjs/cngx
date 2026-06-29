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
   * Commit-aware removal. Always single-deselect, even with
   * `[cascadeChildren]="true"` - chip × represents one explicit value.
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
  /** Flip the expansion state of this node. No-op on leaves. */
  readonly toggleExpand: () => void;
  /** Run the select-path for this node (respects cascade / commit). */
  readonly handleSelect: () => void;
}

export { type CngxTreeNode } from '@cngx/utils';
