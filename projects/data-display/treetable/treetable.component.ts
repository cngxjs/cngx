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
  model,
  output,
  signal,
  type ModelSignal,
  type TrackByFunction,
  untracked,
  viewChildren,
} from '@angular/core';
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
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import { injectDirection, resolveInlineArrowKey } from '@cngx/core';
import { arrayEqual } from '@cngx/utils';
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
 * - Expand/collapse state via the `expandedIds` model. Bound consumers
 *   own the value; unbound consumers see a default fully-expanded set
 *   seeded from the first non-empty `flatNodes`. The seed fires once
 *   per component - later tree swaps never re-expand a collapsed grid.
 * - Selection state via the `selectedIds` model, reconciled against
 *   `selectionMode` changes (`'none'` clears; `'single'` truncates).
 * - Id hygiene across tree swaps: expansion and selection ids absent
 *   from the new `flatNodes` are pruned (the positional default ids
 *   would otherwise silently re-attach to different nodes). An empty
 *   forest is transitional and never pruned against.
 * - The roving focus model: `focusedNodeId` tracks the last-focused row,
 *   `effectiveFocusedId` reconciles it against the visible rows to keep
 *   exactly one row tab stop, and keyboard navigation moves real DOM
 *   focus (`document.activeElement` follows).
 * - Resolved column list including the synthetic `_expand` column and
 *   the optional `_select` checkbox column.
 *
 * **Async-state binding.** When the optional `state` input is bound to
 * a {@link CngxAsyncState}, the `isLoading` / `isRefreshing` / `isBusy`
 * / `isEmpty` / `error` computeds delegate to it. When unbound, those
 * computeds fall back to local-only defaults (`isEmpty` becomes
 * "no visible rows", everything else is `false`/`null`).
 *
 * The body switches through the shared `resolveAsyncView` lookup table:
 * skeleton on first load, error surface with the grid gone, empty
 * surface after a load that produced nothing, a refresh indicator over
 * content that stays on screen, and `content+error` when a refresh
 * fails over loaded rows. Two corrections, mirrored from the timeline:
 * a first load over seed rows paints the rows (a skeleton would hide
 * them; `aria-busy` still marks the grid), and a non-first-load
 * `loading`/`pending` over an empty grid is treated as a load instead
 * of a blank region. A bound state that is still `idle` renders
 * nothing - start the load, or bind `[state]` only once it has started.
 * `aria-busy` on the host mirrors `isBusy`; view transitions reach AT
 * through a dedicated polite live region (loading / refreshing /
 * failure), separate from the bulk-selection announcer.
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
 * @slot cngxHeader Replaces a column's header cell; gets the column definition.
 * @slot cngxCell Replaces a body cell; gets the row and the column definition.
 * @slot cngxEmpty Rendered when the tree resolves to no rows.
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
  host: {
    class: 'cngx-treetable',
    '[attr.aria-busy]': 'isBusy() || null',
  },
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
   * Expanded-id set. Two-way bindable via `[(expandedIds)]` or read-only via
   * `[expandedIds]`; the model's implicit `expandedIdsChange` output fires
   * after every toggle. When left unbound the component seeds itself with
   * the default fully-expanded set once - on the first non-empty tree - and
   * continues to manage its own state. Later tree swaps never re-seed, and
   * ids that vanish from the tree are pruned (with a change emit).
   *
   * ```html
   * <cngx-treetable [(expandedIds)]="myIds" />
   * ```
   */
  readonly expandedIds = model<ReadonlySet<string>>(new Set());

  /**
   * Row selection behaviour.
   * - `'none'` - selection is disabled (default).
   * - `'single'` - at most one row can be selected at a time.
   * - `'multi'` - multiple rows can be selected simultaneously.
   *
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
   * Selected-id set. Two-way bindable via `[(selectedIds)]` or read-only via
   * `[selectedIds]`; the model's implicit `selectedIdsChange` output fires
   * after every selection toggle. Switching `selectionMode` to `'none'` or
   * `'single'` reconciles the set down to a legal shape, and ids that
   * vanish from the tree after a swap are pruned (with a change emit).
   *
   * ```html
   * <cngx-treetable [(selectedIds)]="myIds" />
   * ```
   */
  readonly selectedIds = model<ReadonlySet<string>>(new Set());

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
   * How many placeholder rows the first-load skeleton renders. Tune it
   * to roughly the row count the loaded grid will show so the swap to
   * content does not jump.
   *
   * @defaultValue `3`
   */
  readonly skeletonRowCount = input<number>(3);

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

  private readonly config = inject(CNGX_TREETABLE_CONFIG);

  /** Document writing direction - swaps the physical expand/collapse arrows under `rtl` (APG treegrid). */
  private readonly direction = injectDirection();

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
   * rows". The projected `*cngxEmpty` slot itself renders off the body
   * view switch, which resolves emptiness from the visible rows - this
   * computed is the consumer-facing signal, not the template driver.
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
   * @internal Which body the template renders. Delegates to the shared
   * `resolveAsyncView` lookup table so the grid cannot drift from every
   * other async surface. Without a bound `[state]` the grid is a plain
   * synchronous table: rows when there are rows, the empty surface
   * otherwise. Emptiness is resolved from the visible rows (the
   * renderable truth), not from `state.isEmpty()` - seed rows in
   * `[tree]` count as content even while the state is still loading.
   */
  protected readonly activeView = computed<AsyncView>(() => {
    const rowsEmpty = this.visibleNodes().length === 0;
    const bound = this.state();
    if (!bound) {
      return rowsEmpty ? 'empty' : 'content';
    }
    const view = resolveAsyncView(bound.status(), bound.isFirstLoad(), rowsEmpty);
    // A first load over seed rows paints the rows - `[tree]` can carry data
    // before the state settles, and a skeleton would hide it. The busy
    // window still reaches AT through the host's `aria-busy`.
    if (view === 'skeleton' && !rowsEmpty) {
      return 'content';
    }
    // `loading` and `pending` that are not a first load resolve to `content`
    // in the lookup table; with no rows that renders a blank region. Work in
    // flight with nothing on screen is a load. `refreshing` is excluded - it
    // renders its own indicator and announcement (same correction the
    // timeline and stat-card apply).
    const silentlyBusy = rowsEmpty && bound.isBusy() && !bound.isRefreshing();
    return view === 'content' && silentlyBusy ? 'skeleton' : view;
  });

  /** @internal `true` while the body renders the grid (`content` or `content+error`). */
  protected readonly showsContent = computed(() => {
    const view = this.activeView();
    return view === 'content' || view === 'content+error';
  });

  /**
   * @internal A refresh over rows the user can still read. The skeleton
   * branch already communicates its own busy phase, so the indicator only
   * renders while the grid is on screen.
   */
  protected readonly showsRefreshIndicator = computed(
    () => this.showsContent() && this.isRefreshing(),
  );

  /** @internal Index list for the skeleton branch's `@for`. */
  protected readonly skeletonRows = computed(
    () => Array.from({ length: this.skeletonRowCount() }, (_, i) => i),
    { equal: arrayEqual },
  );

  /**
   * @internal Live-region text for view transitions. Only busy phases and
   * failures have anything to say; the string is empty otherwise so the
   * region stays in the DOM while staying silent. Single announcer for
   * the failure - the error surface itself carries no `role="alert"`
   * (that would double-fire on top of this region).
   */
  protected readonly stateAnnouncement = computed(() => {
    const view = this.activeView();
    if (view === 'skeleton') {
      return 'Loading';
    }
    if (view === 'error' || view === 'content+error') {
      return 'Data failed to load';
    }
    return this.showsRefreshIndicator() ? 'Refreshing' : '';
  });

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
  protected readonly capitalise = capitalise;

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
   * Logical focus tracker - the id of the row the user last focused.
   * Updated by `handleRowClick` (on click activation), `handleKeyDown`
   * (on arrow navigation, Home/End, ArrowLeft jump-to-parent), and the
   * row-level `focused` output (when DOM focus lands in a row via Tab
   * or click). `null` while no row has ever been focused.
   *
   * The template never reads this raw signal - it binds against
   * {@link effectiveFocusedId}, which reconciles the value against the
   * currently visible rows.
   */
  readonly focusedNodeId = signal<string | null>(null);

  private readonly selectionAnnouncementState = signal('');

  /**
   * SR live-region content for bulk selection changes. `toggleAll`
   * (header checkbox or Ctrl/Cmd+A) writes a polite announcement here;
   * the region itself stays in the DOM permanently, only its content
   * is reactive. Per-row toggles stay silent - the row's
   * `aria-selected` flip is the announcement.
   */
  protected readonly selectionAnnouncement = this.selectionAnnouncementState.asReadonly();

  /**
   * The single roving tab-stop anchor: `focusedNodeId` while that row is
   * still among `visibleNodes`, otherwise the first visible row's id,
   * otherwise `null` (empty grid). Self-reconciles when the focused row
   * is collapsed or filtered away, so exactly one row keeps
   * `tabindex="0"` at all times.
   */
  readonly effectiveFocusedId = computed<string | null>(() => {
    const nodes = this.visibleNodes();
    if (nodes.length === 0) {
      return null;
    }
    const focused = this.focusedNodeId();
    if (focused !== null && nodes.some((n) => n.id === focused)) {
      return focused;
    }
    return nodes[0].id;
  });

  private readonly rowRefs = viewChildren(CngxTreetableRow);

  /** Moves DOM focus to the rendered row whose node id matches `id`. */
  private moveFocusTo(id: string): void {
    this.rowRefs()
      .find((row) => row.node().id === id)
      ?.focus();
  }

  constructor() {
    // Reconcile expansion/selection against the current tree. Two concerns,
    // ordered inside one effect so a seed never immediately prunes itself:
    //
    // 1. Seed ONCE per component: the first non-empty flatNodes seeds the
    //    default fully-expanded set, but only when the consumer has not
    //    pre-bound a non-empty value. Later tree swaps never re-seed, so a
    //    consumer-cleared (or user-collapsed) empty set survives data
    //    refreshes instead of springing back to fully expanded.
    // 2. Prune ids absent from the new tree: positional default ids would
    //    otherwise silently re-attach to different nodes after a swap.
    //    An empty forest is skipped as a transitional state (first load,
    //    cleared data) - pruning against it would wipe expansion and
    //    selection on every empty flash between refreshes.
    let seeded = false;
    effect(() => {
      const nodes = this.flatNodes();
      if (nodes.length === 0) {
        return;
      }
      untracked(() => {
        const valid = new Set(nodes.map((n) => n.id));
        if (!seeded) {
          seeded = true;
          if (this.expandedIds().size === 0) {
            this.expandedIds.set(getInitialExpandedIds(nodes));
            // Freshly seeded from these nodes - the expansion set cannot
            // hold stale ids, but a pre-bound selection still can.
            this.pruneAbsentIds(this.selectedIds, valid);
            return;
          }
        }
        this.pruneAbsentIds(this.expandedIds, valid);
        this.pruneAbsentIds(this.selectedIds, valid);
      });
    });

    // Reconcile selectedIds against selectionMode changes: 'none' clears the
    // set; 'single' truncates to the first id when more than one is held.
    effect(() => {
      const mode = this.selectionMode();
      untracked(() => {
        const current = this.selectedIds();
        if (mode === 'none' && current.size > 0) {
          this.selectedIds.set(new Set());
        } else if (mode === 'single' && current.size > 1) {
          const first = current.values().next().value;
          this.selectedIds.set(first !== undefined ? new Set([first]) : new Set());
        }
      });
    });
  }

  /**
   * Drops every id from `target` that is not in `valid`. Writes (and
   * thereby emits the model's change output) only when something was
   * actually removed, so an untouched set keeps its reference and a
   * plain data refresh stays silent.
   */
  private pruneAbsentIds(
    target: ModelSignal<ReadonlySet<string>>,
    valid: ReadonlySet<string>,
  ): void {
    const current = target();
    if (current.size === 0) {
      return;
    }
    const next = new Set<string>();
    for (const id of current) {
      if (valid.has(id)) {
        next.add(id);
      }
    }
    if (next.size !== current.size) {
      target.set(next);
    }
  }

  /**
   * Casts a node value to `Record<string, unknown>` for template property access.
   * @internal
   */
  protected asRecord(value: T): Record<string, unknown> {
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
   * Flip the expand/collapse state of `node`. Writes the next id set into
   * `expandedIds` (the model's implicit `expandedIdsChange` output fires
   * automatically) and emits exactly one of `nodeExpanded` / `nodeCollapsed`.
   */
  toggle(node: FlatNode<T>): void {
    let opened = false;
    this.expandedIds.update((current) => {
      const next = new Set(current);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
        opened = true;
      }
      return next;
    });
    if (opened) {
      this.nodeExpanded.emit(node);
    } else {
      this.nodeCollapsed.emit(node);
    }
  }

  /**
   * Flip the selection state of `node` against the current `selectionMode`.
   * In `'single'` mode the prior selection clears before the new id is added;
   * in `'multi'` mode the toggle is per-id. No-op in `'none'` mode.
   */
  toggleSelection(node: FlatNode<T>): void {
    const mode = this.selectionMode();
    if (mode === 'none') {
      return;
    }
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        if (mode === 'single') {
          next.clear();
        }
        next.add(node.id);
      }
      return next;
    });
  }

  /**
   * Visibility-bounded select-all toggle, in both directions. If every
   * currently *visible* row is selected, deselects exactly those visible
   * rows. Otherwise selects every currently visible row. Either way,
   * rows hidden inside a collapsed parent stay untouched. Only acts in
   * `'multi'` mode; no-op in `'single'` or `'none'`. Drives the header
   * checkbox's click handler.
   */
  toggleAll(): void {
    if (this.selectionMode() !== 'multi') {
      return;
    }
    if (this.isAllSelected()) {
      const visible = new Set(this.visibleNodes().map((n) => n.id));
      this.selectedIds.update((current) => {
        const next = new Set<string>();
        for (const id of current) {
          if (!visible.has(id)) {
            next.add(id);
          }
        }
        return next;
      });
      this.selectionAnnouncementState.set('Selection cleared');
      return;
    }
    const visibleIds = this.visibleNodes().map((n) => n.id);
    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const id of visibleIds) {
        next.add(id);
      }
      return next;
    });
    const count = visibleIds.length;
    this.selectionAnnouncementState.set(count === 1 ? '1 row selected' : `${count} rows selected`);
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
   * Syncs the logical focus row when DOM focus lands inside a row (Tab
   * into the grid, click, or programmatic focus). Bound to each row's
   * `focused` output.
   * @internal
   */
  protected handleRowFocusIn(node: FlatNode<T>): void {
    this.focusedNodeId.set(node.id);
  }

  /**
   * Keyboard navigation handler. Bind to the table's `(keydown)` event.
   * Modified keys (Ctrl / Alt / Meta) are left to the browser so user
   * shortcuts keep working - except `Ctrl+A` / `Cmd+A`, which toggles
   * select-all in `'multi'` mode.
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
   * | `Ctrl+A` / `Cmd+A` | Toggle select-all over the visible rows (`'multi'` mode only) |
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      const isSelectAllCombo =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        (event.key === 'a' || event.key === 'A');
      if (isSelectAllCombo && this.selectionMode() === 'multi') {
        event.preventDefault();
        this.toggleAll();
      }
      // Every other modified combo stays with the browser.
      return;
    }

    const nodes = this.visibleNodes();
    const currentId = this.effectiveFocusedId();
    const currentIndex = currentId ? nodes.findIndex((n) => n.id === currentId) : -1;

    // Resolve the physical arrow to its logical inline intent: under rtl the
    // physical ArrowLeft/ArrowRight swap, so expand/collapse follow reading
    // order. Vertical keys, Home, End are returned verbatim by the kernel.
    const key = resolveInlineArrowKey(event.key, this.direction());

    switch (key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = nodes[currentIndex + 1];
        if (next) {
          this.focusedNodeId.set(next.id);
          this.moveFocusTo(next.id);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = nodes[currentIndex - 1];
        if (prev) {
          this.focusedNodeId.set(prev.id);
          this.moveFocusTo(prev.id);
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
            this.moveFocusTo(parentId);
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
        const first = nodes[0];
        if (first) {
          this.focusedNodeId.set(first.id);
          this.moveFocusTo(first.id);
        }
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = nodes.at(-1);
        if (last) {
          this.focusedNodeId.set(last.id);
          this.moveFocusTo(last.id);
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
