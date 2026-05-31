import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  type TrackByFunction,
  untracked,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkRow,
  CdkRowDef,
  CdkTable,
} from '@angular/cdk/table';
import { NgTemplateOutlet } from '@angular/common';
import type { CngxAsyncState } from '@cngx/core/utils';
import { arrayEqual, setEqual } from '@cngx/utils';
import { CngxTreetableRow } from './treetable-row.directive';
import { CngxCellTpl, CngxEmptyTpl, CngxHeaderTpl } from './column-template.directive';
import { resolveCellTpl, resolveHeaderTpl } from './column-template.utils';
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
 * Headless tree table built on Angular CDK Table.
 *
 * Renders a fully unstyled, accessible tree table using CDK primitives.
 * All visual styling lives in `treetable.component.css` and resolves
 * through CSS custom properties so consumers can theme it freely.
 *
 * **What the component owns.**
 * - Tree flattening via {@link flattenTree} and visible-node filtering
 *   via {@link isNodeVisible}. Both run as memoised computeds against
 *   the `tree` input plus the live `expandedIds` set.
 * - Expand/collapse state, with controlled-vs-uncontrolled dual mode:
 *   when `expandedIds` is bound it wins; otherwise an internal
 *   `linkedSignal` seeded by {@link getInitialExpandedIds} drives it.
 * - Row selection routed through CDK's `SelectionModel`, kept in sync
 *   with an optional controlled `selectedIds` input through two
 *   `effect`s that break the self-trigger cycle with `untracked`.
 * - Keyboard navigation state via the `focusedNodeId` signal (the
 *   *logical* focus row, distinct from `document.activeElement`).
 * - Resolved column list including the synthetic `_expand` column and
 *   the optional `_select` checkbox column.
 *
 * **Async-state binding.** When the optional `state` input is bound to
 * a {@link CngxAsyncState}, the `isLoading` / `isRefreshing` / `isBusy`
 * / `isEmpty` / `error` computeds delegate to it. When unbound, those
 * computeds fall back to local-only defaults (`isEmpty` becomes
 * "no visible rows", everything else is `false`/`null`).
 *
 * **Basic usage**
 * ```html
 * <cngx-treetable [tree]="orgTree" (nodeClicked)="onNodeClick($event)" />
 * ```
 *
 * **Custom cell template**
 * ```html
 * <cngx-treetable [tree]="orgTree">
 *   <ng-template [cngxCell]="'name'" let-node>
 *     <strong>{{ node.value.name }}</strong>
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @playground Showcase ./examples/app/app.component.ts
 * @typeParam T - The shape of the data value carried by each tree node.
 *
 * @category data-display/treetable
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/treetable.component.ts
 * @since 0.1.0
 * @relatedTo CngxTreetableRow, CngxCellTpl, CngxHeaderTpl, CngxEmptyTpl
 */
@Component({
  selector: 'cngx-treetable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkTable,
    CdkColumnDef,
    CdkHeaderCellDef,
    CdkCellDef,
    CdkHeaderCell,
    CdkCell,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CngxTreetableRow,
    NgTemplateOutlet,
  ],
  templateUrl: './treetable.component.html',
  styleUrls: ['./treetable.component.css'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'cngx-treetable' },
})
export class CngxTreetable<T = unknown> {
  /**
   * The tree data to display. Accepts either a single root {@link Node} or an
   * array of root nodes for a forest.
   */
  readonly tree = input.required<Node<T> | Node<T>[]>();

  /**
   * Per-instance display options that override the application-wide
   * {@link TreetableConfig} provided via {@link provideTreetable}.
   */
  readonly options = input<TreetableOptions<T>>();

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
  readonly nodeId = input<(node: T, path: readonly number[]) => string>();

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
  readonly expandedIdsInput = input<ReadonlySet<string> | undefined>(undefined, {
    alias: 'expandedIds',
  });

  /**
   * Row selection behaviour.
   * - `'none'` - selection is disabled (default).
   * - `'single'` - at most one row can be selected at a time.
   * - `'multi'` - multiple rows can be selected simultaneously.
   *
   * Uses Angular CDK's `SelectionModel` internally.
   * @defaultValue `'none'`
   */
  readonly selectionMode = input<'none' | 'single' | 'multi'>('none');

  /**
   * When `true`, renders a checkbox column (`_select`) to the left of the data
   * columns. Only meaningful when `selectionMode` is `'single'` or `'multi'`.
   * In `'multi'` mode a "select all" checkbox is shown in the column header.
   * @defaultValue `false`
   */
  readonly showCheckboxes = input<boolean>(false);

  /**
   * Controlled selection state. When bound, the component operates in
   * **controlled mode** and the external value takes precedence.
   * Pair with `selectedIdsChange` for full two-way binding:
   *
   * ```html
   * <cngx-treetable
   *   [selectedIds]="myIds"
   *   (selectedIdsChange)="myIds = $event" />
   * ```
   *
   * When not bound, the component manages its own selection state internally.
   */
  readonly selectedIdsInput = input<ReadonlySet<string> | undefined>(undefined, {
    alias: 'selectedIds',
  });

  /**
   * Custom identity function for CDK / Material table's `trackBy`.
   * Return any value that uniquely identifies a row across change-detection
   * cycles to avoid full row re-creation on data changes.
   *
   * @defaultValue `node => node.id`
   */
  readonly trackBy = input<(node: FlatNode<T>) => unknown>((node) => node.id);

  /**
   * Bind an async state so the treetable's loading / refreshing / empty /
   * error computeds delegate to one source of truth. The cascade:
   *
   * - `isLoading` mirrors `state.isFirstLoad()`
   * - `isRefreshing` mirrors `state.isRefreshing()`
   * - `isBusy` mirrors `state.isBusy()`
   * - `isEmpty` mirrors `state.isEmpty()`, falling back to "no visible
   *   rows" when the state reports unknown
   * - `error` mirrors `state.error()`
   *
   * When unbound, those computeds fall back to local defaults: `isEmpty`
   * still works against the visible-nodes count, the loading flags read
   * `false`, `error` reads `null`. Bind this when the data flow already
   * carries an `injectAsyncState` or `createManualState` source - skip
   * it when the consumer is fine with the local-only fallback.
   *
   * ```html
   * <cngx-treetable [tree]="data()" [state]="loadState" />
   * ```
   */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /**
   * Fires once per row activation, whether by mouse click or by keyboard
   * (`Enter`/`Space` while the row holds logical focus). Carries the full
   * {@link FlatNode} so listeners can read depth, parent chain, raw value,
   * or hasChildren without re-resolving the id against the tree.
   */
  readonly nodeClicked = output<FlatNode<T>>();

  /**
   * Fires when a node transitions from collapsed to expanded. Pairs with
   * `expandedIdsChange`, which carries the post-transition full id set;
   * `nodeExpanded` carries the specific node that flipped, useful when
   * the consumer wants to react to that one row rather than diff the set.
   */
  readonly nodeExpanded = output<FlatNode<T>>();

  /**
   * Fires when a node transitions from expanded to collapsed. Sibling
   * of `nodeExpanded`; same fire-once-per-transition contract.
   */
  readonly nodeCollapsed = output<FlatNode<T>>();

  /**
   * Fires after every expand/collapse toggle with the full post-toggle
   * id set. Use this for two-way `[(expandedIds)]` binding; use
   * `nodeExpanded`/`nodeCollapsed` when you only need the one node that
   * changed.
   */
  readonly expandedIdsChange = output<ReadonlySet<string>>();

  /**
   * Fires after every selection change with the array snapshot of the
   * currently selected ids. This output is the array-shaped peer of
   * `selectedIdsChange` (Set-shaped). Pick whichever shape your handler
   * needs - both carry the same post-change selection.
   */
  readonly selectionChanged = output<readonly string[]>();

  /**
   * Fires after every selection change with the full post-change id set.
   * Use this for two-way `[(selectedIds)]` binding.
   *
   * ```html
   * <cngx-treetable
   *   [selectedIds]="myIds"
   *   (selectedIdsChange)="myIds = $event" />
   * ```
   */
  readonly selectedIdsChange = output<ReadonlySet<string>>();

  private readonly config = inject(CNGX_TREETABLE_CONFIG);

  /** @internal */
  protected readonly cellTpls = contentChildren(CngxCellTpl);
  /** @internal */
  protected readonly headerTpls = contentChildren(CngxHeaderTpl);
  /** @internal */
  protected readonly emptyTpl = contentChild(CngxEmptyTpl);

  /**
   * Every node in the `tree` input flattened to a single depth-first
   * array. Each entry carries the resolved id, depth, hasChildren flag,
   * and parent chain. Memoised against `tree` + `nodeId` so consumers
   * can read it as often as templates need without re-walking the tree.
   */
  readonly flatNodes = computed(() => flattenTree(this.tree(), this.nodeId()), {
    equal: arrayEqual,
  });

  private readonly expandedIdsState = linkedSignal<FlatNode<T>[], ReadonlySet<string>>({
    source: this.flatNodes,
    computation: (nodes) => getInitialExpandedIds(nodes),
    equal: setEqual,
  });

  /**
   * The current set of expanded node IDs.
   * In uncontrolled mode this reflects the internal state; in controlled mode
   * it mirrors the `expandedIds` input.
   */
  readonly expandedIds = computed(() => this.expandedIdsInput() ?? this.expandedIdsState(), {
    equal: setEqual,
  });

  /**
   * The subset of `flatNodes` whose ancestor chain is fully expanded
   * (and is therefore renderable). Recomputes on every `expandedIds`
   * change; the resulting array is what the template iterates over with
   * the CDK table's `[trackBy]` hook.
   */
  readonly visibleNodes = computed(
    () => this.flatNodes().filter((n) => isNodeVisible(n, this.expandedIds())),
    { equal: arrayEqual },
  );

  /**
   * `true` when the table has nothing to render. Mirrors `state.isEmpty()`
   * when an async state is bound; otherwise falls back to "no visible
   * rows". Drives the projected `*cngxEmpty` slot.
   */
  readonly isEmpty = computed(() => this.state()?.isEmpty() ?? this.visibleNodes().length === 0);

  /** `true` during the first load of a bound async state. `false` when no state is bound. */
  readonly isLoading = computed(() => this.state()?.isFirstLoad() ?? false);

  /** `true` while a bound async state is refreshing (i.e. loading but not first-load). */
  readonly isRefreshing = computed(() => this.state()?.isRefreshing() ?? false);

  /** `true` while a bound async state is loading or refreshing. Drives the host's `aria-busy` binding. */
  readonly isBusy = computed(() => this.state()?.isBusy() ?? false);

  /** The current error from a bound async state, or `null` (also `null` when no state is bound). */
  readonly error = computed(() => this.state()?.error() ?? null);

  /**
   * Data-column keys for the current tree. Resolves to
   * `options.customColumnOrder` when set, otherwise extracts the
   * primitive-valued keys of the first node's value via
   * {@link extractColumns}. Object-valued or function-valued keys are
   * dropped so the table never tries to render `[object Object]`.
   */
  readonly columns = computed(() => extractColumns(this.tree(), this.options()));

  /**
   * Full column id list passed to the CDK table's `cdkHeaderRowDef` /
   * `cdkRowDef`. Layout:
   *
   * `[ '_select'?, '_expand', ...data-columns ]`
   *
   * - `_select` only appears when `selectionMode !== 'none'` AND
   *   `showCheckboxes` is `true`.
   * - `_expand` always appears as the first non-utility column - it
   *   carries the indent guide and the expand toggle.
   */
  readonly allColumns = computed(
    () => [
      ...(this.showCheckboxes() && this.selectionMode() !== 'none' ? ['_select'] : []),
      '_expand',
      ...this.columns(),
    ],
    { equal: arrayEqual },
  );

  /**
   * Effective per-instance options: application-wide {@link TreetableConfig}
   * (from `provideTreetable(...)`) overlaid by the per-instance `options`
   * input. Use this when a consumer needs to read the resolved option
   * (instance wins over app default) instead of re-implementing the
   * cascade.
   */
  readonly resolvedOptions = computed<TreetableOptions<T>>(
    () => ({
      ...this.config,
      ...this.options(),
    }),
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.highlightRowOnHover !== b.highlightRowOnHover) {
          return false;
        }
        if (a.capitaliseHeader !== b.capitaliseHeader) {
          return false;
        }
        const ac = a.customColumnOrder;
        const bc = b.customColumnOrder;
        if (ac === bc) {
          return true;
        }
        if (!ac || !bc) {
          return false;
        }
        return arrayEqual(ac, bc);
      },
    },
  );

  /** @internal Exposed so templates can call it without importing the utility. */
  readonly capitalise = capitalise;

  private readonly selectionModel = linkedSignal(
    () => new SelectionModel<string>(this.selectionMode() === 'multi', []),
  );
  private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set());

  /**
   * The current set of selected node IDs.
   * In uncontrolled mode this reflects internal state; in controlled mode
   * it mirrors the `selectedIds` input.
   */
  readonly selectedIds = computed(() => this.selectedIdsInput() ?? this.selectedIdsState(), {
    equal: setEqual,
  });

  /**
   * `true` when every visible node is selected.
   * Used to drive the "select all" header checkbox in `multi` mode.
   */
  readonly isAllSelected = computed(() => {
    const nodes = this.visibleNodes();
    if (nodes.length === 0) {
      return false;
    }
    const selected = this.selectedIds();
    return nodes.every((n) => selected.has(n.id));
  });

  /**
   * `true` when some - but not all - visible nodes are selected.
   * Used to put the "select all" header checkbox into indeterminate state.
   */
  readonly isIndeterminate = computed(() => {
    const nodes = this.visibleNodes();
    if (nodes.length === 0) {
      return false;
    }
    const selected = this.selectedIds();
    const count = nodes.filter((n) => selected.has(n.id)).length;
    return count > 0 && count < nodes.length;
  });

  /**
   * `TrackByFunction` wired to the `trackBy` input.
   * Pass directly to the CDK/Material table's `[trackBy]` binding.
   */
  readonly trackByFn: TrackByFunction<FlatNode<T>> = (_, node) => this.trackBy()(node);

  /**
   * Logical focus tracker - the id of the row that should be styled as
   * focused, decoupled from `document.activeElement`. Updated by
   * `handleRowClick` (on click activation) and `handleKeyDown` (on arrow
   * navigation, Home/End, ArrowLeft jump-to-parent).
   *
   * Templates apply `:focus-visible`-style chrome based on this signal,
   * so the focus ring renders the same way whether the user reached the
   * row by mouse or by keyboard. `null` while no row has ever been
   * focused.
   */
  readonly focusedNodeId = signal<string | null>(null);

  constructor() {
    // linkedSignal recreates the model on selectionMode change; re-subscribe each time.
    effect((onCleanup) => {
      const model = this.selectionModel();
      this.selectedIdsState.set(new Set());

      const sub = model.changed.subscribe(() => {
        const next = new Set(model.selected);
        this.selectedIdsState.set(next);
        this.selectionChanged.emit([...next]);
        this.selectedIdsChange.emit(next);
      });

      onCleanup(() => sub.unsubscribe());
    });

    // Controlled mode: SelectionModel.changed fires synchronously, so wrap the
    // deselect/select calls in untracked to break the self-trigger cycle.
    effect(() => {
      const input = this.selectedIdsInput();
      if (input === undefined) {
        return;
      }
      const model = this.selectionModel();
      const inputSet = new Set(input);
      const current = new Set(model.selected);
      const toDeselect = [...current].filter((id) => !inputSet.has(id));
      const toSelect = [...inputSet].filter((id) => !current.has(id));
      if (toDeselect.length === 0 && toSelect.length === 0) {
        return;
      }
      untracked(() => {
        if (toDeselect.length) {
          model.deselect(...toDeselect);
        }
        if (toSelect.length) {
          model.select(...toSelect);
        }
      });
    });
  }

  /**
   * Casts a node value to `Record<string, unknown>` for template property access.
   * @internal
   */
  asRecord(value: T): Record<string, unknown> {
    return value as Record<string, unknown>;
  }

  /**
   * Predicate for "is this id in the current selection?". Reads the
   * `selectedIds` signal so callers inside templates (e.g. `[checked]`
   * bindings on the per-row checkbox) re-evaluate automatically when
   * the selection changes.
   */
  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  /**
   * Flip the expand/collapse state of `node`. Writes the new id set into
   * the internal `expandedIdsState`, then emits exactly one of
   * `nodeExpanded`/`nodeCollapsed` plus `expandedIdsChange` (always).
   * Safe to call in controlled mode - the consumer sees the change via
   * `expandedIdsChange` and pushes it back through `[(expandedIds)]`.
   */
  toggle(node: FlatNode<T>): void {
    const current = this.expandedIds();
    const next = new Set(current);
    if (next.has(node.id)) {
      next.delete(node.id);
      this.expandedIdsState.set(next);
      this.nodeCollapsed.emit(node);
    } else {
      next.add(node.id);
      this.expandedIdsState.set(next);
      this.nodeExpanded.emit(node);
    }
    this.expandedIdsChange.emit(next);
  }

  /**
   * Flip the selection state of `node` against the current
   * `selectionMode`. CDK's `SelectionModel` enforces the cardinality:
   * `single` clears the prior selection before adding, `multi` adds or
   * removes without touching siblings. No-op in `'none'` mode. The
   * model's `changed` subscription fans the result out as
   * `selectionChanged` (array) and `selectedIdsChange` (Set).
   */
  toggleSelection(node: FlatNode<T>): void {
    if (this.selectionMode() === 'none') {
      return;
    }
    this.selectionModel().toggle(node.id);
  }

  /**
   * Visibility-bounded select-all toggle. If every currently *visible*
   * row is selected, clears the selection. Otherwise selects every
   * currently visible row - rows hidden inside a collapsed parent stay
   * untouched. Only acts in `'multi'` mode; no-op in `'single'` or
   * `'none'`. Drives the header checkbox's click handler.
   */
  toggleAll(): void {
    if (this.selectionMode() !== 'multi') {
      return;
    }
    if (this.isAllSelected()) {
      this.selectionModel().clear();
    } else {
      this.selectionModel().select(...this.visibleNodes().map((n) => n.id));
    }
  }

  /**
   * Single entry point for row activation, from any modality (mouse
   * click, `Enter`, `Space`). Three-step sequence in this order:
   * 1. Promote `node.id` to `focusedNodeId` so the focus ring follows.
   * 2. Emit `nodeClicked` for consumer-level activation handlers.
   * 3. Delegate to `toggleSelection`, which is a no-op in `'none'` mode.
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
    const currentIndex = currentId ? nodes.findIndex((n) => n.id === currentId) : -1;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = nodes[currentIndex + 1];
        if (next) {
          this.focusedNodeId.set(next.id);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = nodes[currentIndex - 1];
        if (prev) {
          this.focusedNodeId.set(prev.id);
        }
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
        if (!node) {
          break;
        }
        if (node.hasChildren && this.expandedIds().has(node.id)) {
          this.toggle(node);
        } else {
          const parentId = node.parentIds.at(-1);
          if (parentId) {
            this.focusedNodeId.set(parentId);
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const node = nodes[currentIndex];
        if (node) {
          this.handleRowClick(node);
        }
        break;
      }
      case 'Home': {
        event.preventDefault();
        if (nodes[0]) {
          this.focusedNodeId.set(nodes[0].id);
        }
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = nodes.at(-1);
        if (last) {
          this.focusedNodeId.set(last.id);
        }
        break;
      }
    }
  }

  /** @internal */
  protected cellTplFor(col: string) {
    return resolveCellTpl<T>(col, this.cellTpls);
  }

  /** @internal */
  protected headerTplFor(col: string) {
    return resolveHeaderTpl(col, this.headerTpls);
  }
}
