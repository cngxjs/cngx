import type { FlatTreeNode } from '@cngx/utils';

/**
 * A node in the input tree structure.
 *
 * @typeParam T - The shape of the data value carried by each node.
 *
 * @category data-display/treetable
 */
export interface Node<T> {
  /** The data value associated with this node. */
  value: T;
  /** Optional child nodes. Absence or an empty array means a leaf node. */
  children?: Node<T>[];
}

/**
 * A flattened representation of a single tree node, produced by {@link flattenTree}.
 * All properties are readonly to prevent accidental mutation.
 *
 * Alias of the `@cngx/utils` {@link FlatTreeNode} kernel type, so every flat
 * node carries the ARIA metadata (`posinset`, `setsize`, plus `label`,
 * `disabled`, and the `node` back-reference) alongside the original
 * `id` / `value` / `depth` / `hasChildren` / `parentIds` fields.
 *
 * **Migration note.** The alias widened the type: code that only *reads*
 * `FlatNode` values (templates, `nodeClicked` handlers, `trackBy`) is
 * unaffected, but code that *constructs* `FlatNode` literals (tests,
 * custom data sources) must now supply the kernel fields
 * (`label`, `disabled`, `posinset`, `setsize`, `node`) as well.
 * Nodes produced by {@link flattenTree} always carry the full shape,
 * with `label` fixed to `''`.
 *
 * @typeParam T - The shape of the data value carried by the node.
 *
 * @category data-display/treetable
 */
export type FlatNode<T> = FlatTreeNode<T>;

/**
 * Per-instance display options for `CngxTreetable`.
 * These override the application-wide defaults provided via {@link provideTreetable}.
 *
 * @typeParam T - The shape of the data value; used to constrain `customColumnOrder`.
 *
 * @category data-display/treetable
 */
export interface TreetableOptions<T> {
  /**
   * When `true`, rows are visually highlighted on mouse-hover.
   * @defaultValue `false`
   */
  highlightRowOnHover?: boolean;
  /**
   * Explicit column order. Only keys whose values are primitive (non-object) are
   * rendered by default; use this to override that set or reorder columns.
   */
  customColumnOrder?: readonly (keyof T & string)[];
  /**
   * When `true` (the default), column header labels have their first letter
   * uppercased. Set to `false` to display raw key names.
   * @defaultValue `true`
   */
  capitaliseHeader?: boolean;
}

/**
 * Template context type for {@link CngxCellTpl}.
 *
 * ```html
 * <ng-template [cngxCell]="'name'" let-node let-value="value">
 *   {{ node.value.name }} (depth {{ node.depth }})
 * </ng-template>
 * ```
 *
 * @typeParam T - The shape of the data value carried by the node.
 *
 * @category data-display/treetable
 */
export interface CngxCellTplContext<T> {
  /** The full {@link FlatNode} for the current row - available as `let-node`. */
  $implicit: FlatNode<T>;
  /** The raw cell value for the column (`node.value[column]`) - available as `let-value="value"`. */
  value: unknown;
}

/**
 * Template context type for {@link CngxErrorTpl}.
 *
 * ```html
 * <ng-template cngxError let-error>
 *   <p>Load failed: {{ describeError(error) }}</p>
 * </ng-template>
 * ```
 *
 * @category data-display/treetable
 */
export interface CngxErrorTplContext {
  /** The raw error from the bound async state - available as `let-error`. */
  $implicit: unknown;
}
