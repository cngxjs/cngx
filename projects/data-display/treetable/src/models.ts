/**
 * A node in the input tree structure.
 *
 * @typeParam T - The shape of the data value carried by each node.
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
 * @typeParam T - The shape of the data value carried by the node.
 */
export interface FlatNode<T> {
  /** Stable identifier for this node within the current tree. */
  readonly id: string;
  /** The original data value. */
  readonly value: T;
  /** Zero-based nesting depth; root nodes have depth `0`. */
  readonly depth: number;
  /** `true` when the node has at least one child. */
  readonly hasChildren: boolean;
  /**
   * Ordered list of ancestor IDs from root to direct parent.
   * A root node has an empty array.
   */
  readonly parentIds: readonly string[];
}

/**
 * Per-instance display options for `CngxTreetable` and `CngxMaterialTreetable`.
 * These override the application-wide defaults provided via {@link provideTreetable}.
 *
 * @typeParam T - The shape of the data value; used to constrain `customColumnOrder`.
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
  customColumnOrder?: ReadonlyArray<keyof T & string>;
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
 */
export interface CngxCellTplContext<T> {
  /** The full {@link FlatNode} for the current row — available as `let-node`. */
  $implicit: FlatNode<T>;
  /** The raw cell value for the column (`node.value[column]`) — available as `let-value="value"`. */
  value: unknown;
}
