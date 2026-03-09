import {
  computed,
  Directive,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  Signal,
  signal,
  TrackByFunction,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import type { FlatNode, Node, TreetableOptions } from './models';
import {
  capitalise,
  extractColumns,
  flattenTree,
  getInitialExpandedIds,
  isNodeVisible,
} from './tree.utils';
import { CNGX_TREETABLE_CONFIG } from './treetable.token';

/**
 * Shared presentation logic for `CngxTreetable` (CDK) and `CngxMaterialTreetable`
 * (Angular Material). Applied as a `hostDirective` on both components so that all
 * inputs and outputs are bound directly on the host element.
 *
 * The presenter owns:
 * - tree flattening and visible-node filtering
 * - expand/collapse state (uncontrolled **and** controlled via `expandedIds`)
 * - row selection via CDK `SelectionModel`
 * - keyboard navigation state (`focusedNodeId`)
 *
 * @typeParam T - The shape of the data value carried by each tree node.
 */
@Directive({
  selector: '[cngxTreetablePresenter]',
  standalone: true,
})
export class CngxTreetablePresenter<T = unknown> {
  /**
   * The tree data to display. Accepts either a single root {@link Node} or an
   * array of root nodes for a forest.
   */
  tree = input.required<Node<T> | Node<T>[]>();

  /**
   * Per-instance display options that override the application-wide
   * {@link TreetableConfig} provided via {@link provideTreetable}.
   */
  options = input<TreetableOptions<T>>();

  /**
   * Optional function to derive a stable, domain-meaningful ID from a node's
   * value and its path in the tree.
   *
   * When omitted, IDs are generated from the node's path indices joined by `-`
   * (e.g. `"0"`, `"0-1"`, `"0-1-2"`), which are stable across re-renders as
   * long as the tree structure does not change.
   *
   * @param node - The raw data value of the node.
   * @param path - Zero-based index array from root to the current node.
   * @returns A string that is unique within the current tree.
   */
  nodeId = input<(node: T, path: readonly number[]) => string>();

  /**
   * Controlled expand state. When bound, the component operates in
   * **controlled mode** and the external value takes precedence over the
   * internal state. Pair with `expandedIdsChange` for full two-way binding:
   *
   * ```html
   * <cngx-treetable
   *   [expandedIds]="myIds"
   *   (expandedIdsChange)="myIds = $event" />
   * ```
   *
   * When not bound (the default), the component manages its own expand state
   * and starts fully expanded.
   */
  readonly expandedIdsInput = input<ReadonlySet<string> | undefined>(undefined, { alias: 'expandedIds' });

  /**
   * Row selection behaviour.
   * - `'none'` — selection is disabled (default).
   * - `'single'` — at most one row can be selected at a time.
   * - `'multi'` — multiple rows can be selected simultaneously.
   *
   * Uses Angular CDK's `SelectionModel` internally.
   * @defaultValue `'none'`
   */
  selectionMode = input<'none' | 'single' | 'multi'>('none');

  /**
   * Custom identity function for CDK / Material table's `trackBy`.
   * Return any value that uniquely identifies a row across change-detection
   * cycles to avoid full row re-creation on data changes.
   *
   * @defaultValue `node => node.id`
   */
  trackBy = input<(node: FlatNode<T>) => unknown>(node => node.id);

  /** Emitted when the user clicks a row or activates it via keyboard. */
  nodeClicked = output<FlatNode<T>>();

  /** Emitted when a node transitions from collapsed to expanded. */
  nodeExpanded = output<FlatNode<T>>();

  /** Emitted when a node transitions from expanded to collapsed. */
  nodeCollapsed = output<FlatNode<T>>();

  /**
   * Emitted after every expand/collapse toggle with the new full set of
   * expanded IDs. Use this to synchronise an external `expandedIds` binding.
   */
  expandedIdsChange = output<ReadonlySet<string>>();

  /**
   * Emitted whenever the selection changes. The value is an array of the
   * currently selected node IDs.
   */
  selectionChanged = output<readonly string[]>();

  private readonly config = inject(CNGX_TREETABLE_CONFIG);

  /** All nodes in the tree flattened to a single array, depth-first. */
  readonly flatNodes = computed(() => flattenTree(this.tree(), this.nodeId()));

  private readonly _expandedIds = linkedSignal<FlatNode<T>[], ReadonlySet<string>>({
    source: this.flatNodes,
    computation: nodes => getInitialExpandedIds(nodes),
  });

  /**
   * The current set of expanded node IDs.
   * In uncontrolled mode this reflects the internal state; in controlled mode
   * it mirrors the `expandedIds` input.
   */
  readonly expandedIds: Signal<ReadonlySet<string>> = computed(
    () => this.expandedIdsInput() ?? this._expandedIds(),
  );

  /** The subset of `flatNodes` that should be rendered (all ancestors expanded). */
  readonly visibleNodes = computed(() =>
    this.flatNodes().filter(n => isNodeVisible(n, this.expandedIds())),
  );

  /** Column keys derived from the first node's primitive-valued properties, or from `options.customColumnOrder`. */
  readonly columns = computed(() => extractColumns(this.tree(), this.options()));

  /** All column keys including the leading `_expand` column. */
  readonly allColumns = computed(() => ['_expand', ...this.columns()]);

  /** Merged options: application-wide config overridden by instance `options`. */
  readonly resolvedOptions = computed<TreetableOptions<T>>(() => ({
    ...this.config,
    ...this.options(),
  }));

  /** @internal Exposed so templates can call it without importing the utility. */
  readonly capitalise = capitalise;

  // ── Selection ──────────────────────────────────────────────────────────────

  private _selectionModel = new SelectionModel<string>(false, []);
  private readonly _selectedIds = signal<ReadonlySet<string>>(new Set());

  /**
   * Readonly signal containing the set of currently selected node IDs.
   * Updates synchronously after each selection change.
   */
  readonly selectedIds: Signal<ReadonlySet<string>> = this._selectedIds.asReadonly();

  // ── Track-by ───────────────────────────────────────────────────────────────

  /**
   * `TrackByFunction` wired to the `trackBy` input.
   * Pass directly to the CDK/Material table's `[trackBy]` binding.
   */
  readonly trackByFn: TrackByFunction<FlatNode<T>> = (_, node) => this.trackBy()(node);

  // ── Keyboard focus ─────────────────────────────────────────────────────────

  /**
   * The ID of the currently keyboard-focused row, or `null` when no row has
   * been focused yet. Updated by `handleRowClick` and `handleKeyDown`.
   */
  readonly focusedNodeId = signal<string | null>(null);

  constructor() {
    // Recreate SelectionModel and re-subscribe whenever selectionMode changes.
    effect((onCleanup) => {
      const isMulti = this.selectionMode() === 'multi';
      this._selectionModel = new SelectionModel<string>(isMulti, []);
      this._selectedIds.set(new Set());

      const sub = this._selectionModel.changed.subscribe(() => {
        this._selectedIds.set(new Set(this._selectionModel.selected));
        this.selectionChanged.emit([...this._selectionModel.selected]);
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Casts a node value to `Record<string, unknown>` for template property access.
   * @internal
   */
  asRecord(value: T): Record<string, unknown> {
    return value as Record<string, unknown>;
  }

  /**
   * Returns `true` when the node with the given `id` is currently selected.
   * Reactive: reads from the `selectedIds` signal so templates update automatically.
   */
  isSelected(id: string): boolean {
    return this._selectedIds().has(id);
  }

  /**
   * Toggles the expand/collapse state of `node`.
   * Emits `nodeExpanded` or `nodeCollapsed` and `expandedIdsChange` accordingly.
   */
  toggle(node: FlatNode<T>): void {
    const current = this.expandedIds();
    const next = new Set(current);
    if (next.has(node.id)) {
      next.delete(node.id);
      this._expandedIds.set(next);
      this.nodeCollapsed.emit(node);
    } else {
      next.add(node.id);
      this._expandedIds.set(next);
      this.nodeExpanded.emit(node);
    }
    this.expandedIdsChange.emit(next);
  }

  /**
   * Toggles the selection state of `node` according to the current `selectionMode`.
   * No-op when `selectionMode` is `'none'`.
   */
  toggleSelection(node: FlatNode<T>): void {
    if (this.selectionMode() === 'none') return;
    this._selectionModel.toggle(node.id);
  }

  /**
   * Handles a row activation (click or keyboard Enter/Space).
   * Sets `focusedNodeId`, emits `nodeClicked`, and calls `toggleSelection`.
   */
  handleRowClick(node: FlatNode<T>): void {
    this.focusedNodeId.set(node.id);
    this.nodeClicked.emit(node);
    this.toggleSelection(node);
  }

  /**
   * Keyboard navigation handler. Bind to the table's `(keydown)` event.
   *
   * | Key | Action |
   * |---|---|
   * | `ArrowDown` | Focus next visible row |
   * | `ArrowUp` | Focus previous visible row |
   * | `ArrowRight` | Expand focused node (if collapsed) |
   * | `ArrowLeft` | Collapse focused node (if expanded), or jump to parent |
   * | `Enter` / `Space` | Activate focused row (`handleRowClick`) |
   * | `Home` | Focus first visible row |
   * | `End` | Focus last visible row |
   */
  handleKeyDown(event: KeyboardEvent): void {
    const nodes = this.visibleNodes();
    const currentId = this.focusedNodeId();
    const currentIndex = currentId ? nodes.findIndex(n => n.id === currentId) : -1;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = nodes[currentIndex + 1];
        if (next) this.focusedNodeId.set(next.id);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = nodes[currentIndex - 1];
        if (prev) this.focusedNodeId.set(prev.id);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        const node = nodes[currentIndex];
        if (node?.hasChildren && !this.expandedIds().has(node.id)) {
          this.toggle(node);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const node = nodes[currentIndex];
        if (!node) break;
        if (node.hasChildren && this.expandedIds().has(node.id)) {
          this.toggle(node);
        } else {
          const parentId = node.parentIds.at(-1);
          if (parentId) this.focusedNodeId.set(parentId);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const node = nodes[currentIndex];
        if (node) this.handleRowClick(node);
        break;
      }
      case 'Home': {
        event.preventDefault();
        if (nodes[0]) this.focusedNodeId.set(nodes[0].id);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = nodes.at(-1);
        if (last) this.focusedNodeId.set(last.id);
        break;
      }
    }
  }
}
