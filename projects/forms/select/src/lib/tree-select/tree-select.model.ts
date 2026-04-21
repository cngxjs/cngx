import { type CngxTreeNode, type FlatTreeNode } from '@cngx/utils';

/**
 * Re-export of `@cngx/utils`'s `CngxTreeNode<T>` so consumers working
 * with `CngxTreeSelect` can import everything they need from a single
 * secondary-entry (`@cngx/forms/select`). The shape is unchanged —
 * `value` / `label?` / `disabled?` / `children?` — and there is only
 * one canonical definition of it across the monorepo.
 *
 * @category interactive
 */
export type { CngxTreeNode, FlatTreeNode };

/**
 * Action reported on `CngxTreeSelectChange.action`. Split out so
 * consumers can narrow inside `switch`-style handlers without
 * importing the whole change interface.
 *
 * - `'toggle'` — a single node's selection was flipped.
 * - `'cascade-toggle'` — a parent toggle propagated to all descendants
 *   atomically (only possible with `[cascadeChildren]="true"`).
 * - `'clear'` — the full selection was cleared.
 *
 * @category interactive
 */
export type CngxTreeSelectAction = 'toggle' | 'cascade-toggle' | 'clear';

/**
 * Resolved selection entry surfaced to the trigger's chip strip + to
 * consumer-authored chip / trigger-label slots. Carries a display
 * label alongside the raw domain value so custom markup never has to
 * call back into `labelFn`.
 *
 * @category interactive
 */
export interface CngxTreeSelectedItem<T = unknown> {
  readonly value: T;
  readonly label: string;
}

/**
 * Context for `*cngxTreeSelectChip` — per-chip override for the default
 * `<cngx-chip>` pill. Mirrors `CngxMultiSelectChipContext` shape-wise so
 * consumer snippets can share across the two variants.
 *
 * @category interactive
 */
export interface CngxTreeSelectChipContext<T = unknown> {
  readonly $implicit: CngxTreeSelectedItem<T>;
  readonly option: CngxTreeSelectedItem<T>;
  /**
   * Commit-aware removal callback. Routes through the component's
   * single-toggle flow (no cascade, even when `[cascadeChildren]` is
   * on — chip × represents exactly one explicit value).
   */
  readonly remove: () => void;
}

/**
 * Context for `*cngxTreeSelectTriggerLabel` — replaces the entire chip
 * strip with consumer markup. Mirrors the flat-family trigger-label
 * context so `"3 selected"` style summaries can share templates.
 *
 * @category interactive
 */
export interface CngxTreeSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxTreeSelectedItem<T>[];
  readonly selected: readonly CngxTreeSelectedItem<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Context surfaced to consumer-authored `*cngxTreeSelectNode`
 * templates. Receives the flat-projected node plus the reactive
 * derivations the panel uses internally (selected, indeterminate,
 * expanded), so consumer markup can mirror the built-in row without
 * re-querying the controller/selection APIs.
 *
 * `toggleExpand` and `handleSelect` are closed callbacks bound to the
 * surrounding `CngxTreeSelect` instance — safe to wire into (click)
 * handlers on a custom twisty button or a custom row body.
 *
 * @category interactive
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
