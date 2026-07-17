import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { CngxLiveRegion } from '@cngx/common/a11y';
import { type AsyncView, CngxPaginate, resolveAsyncView } from '@cngx/common/data';
import { CngxEmptyState } from '@cngx/ui/empty-state';
import { CngxProgress } from '@cngx/ui/feedback';

import { injectIncrementalListConfig } from './incremental-list-config';
import { CNGX_PAGINATOR_HOST } from './incremental-list-host.token';
import {
  CngxIncrementalEmpty,
  CngxIncrementalEnd,
  CngxIncrementalError,
  type CngxIncrementalErrorContext,
  CngxIncrementalItem,
  CngxIncrementalLoading,
} from './incremental-list-slots';

/**
 * Visual skin. Paint-only - structure, ARIA, and keyboard behaviour are
 * identical across values; each is reflected onto `[data-skin]`.
 * - `plain` (default): browser-native list, no chrome.
 * - `divided`: hairline separators between rows.
 * - `card`: the list sits on an elevated, rounded surface.
 */
export type CngxIncrementalListSkin = 'plain' | 'divided' | 'card';

/**
 * Append-style collection organism. \
 * Accumulates rows across pages (append, don't replace) and switches its view
 * by async status - loading / content / empty / error / end-reached - from a
 * single `[state]` source. A thin shell over the `CngxPaginate` brain (applied
 * as a `hostDirective`): the accumulated slice is read from the brain's
 * `cumulativeRange()`, the end-reached branch from `isLast()`, and the loading
 * gate from the bound state's `isBusy()`. It owns no `[mode]` flag and no
 * accumulation state of its own.
 *
 * The brain is provided as `CNGX_PAGINATOR_HOST` via `useExisting`, so an
 * existing trigger atom (`cngx-pgn-load-more`, `cngx-pgn-infinite`) injects the
 * same contract when projected - the trigger stays a swappable terminal unit,
 * the rich async experience lives here.
 *
 * Two-way `[(pageIndex)]` / `[(pageSize)]` mirror the paginator shell: the
 * brain's controlled inputs are aliased through `hostDirectives` and this
 * component is the single emitter of the matching outputs.
 *
 * All ARIA is signal-driven: `aria-busy` reflects the brain busy signal and a
 * polite live region communicates every settle (empty / error / end-reached).
 *
 * @category ui/collection
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list.component.ts
 * @since 0.1.0
 * @relatedTo CngxPaginate, CngxPaginator, CngxAsyncState
 */
@Component({
  selector: 'cngx-incremental-list',
  exportAs: 'cngxIncrementalList',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxProgress, CngxEmptyState, CngxLiveRegion, NgTemplateOutlet],
  templateUrl: './incremental-list.component.html',
  styleUrl: './incremental-list.component.css',
  hostDirectives: [
    {
      directive: CngxPaginate,
      inputs: ['cngxPageIndex: pageIndex', 'cngxPageSize: pageSize', 'total', 'state'],
    },
  ],
  providers: [{ provide: CNGX_PAGINATOR_HOST, useExisting: CngxPaginate }],
  host: {
    class: 'cngx-incremental-list',
    '[attr.aria-busy]': 'paginate.isBusy()',
    '[attr.data-skin]': 'skin()',
  },
})
export class CngxIncrementalList<T = unknown> {
  /** Visual skin; reflected onto `[data-skin]`. Paint-only. */
  readonly skin = input<CngxIncrementalListSkin>('plain');

  /** Emits the effective page index on every change - navigation or `total`-shrink clamp. */
  readonly pageIndexChange = output<number>();
  /** Emits the effective page size on every change. */
  readonly pageSizeChange = output<number>();
  /**
   * Emits when the error view's retry affordance is activated (the built-in
   * button or a projected error slot's `retry()` context). The consumer re-runs
   * its data source; the organism owns no fetch of its own.
   */
  readonly retry = output<void>();

  /**
   * Item identity for the accumulated `@for`. Defaults to the row index
   * (append-safe: appended rows keep their position). Supply a key fn when the
   * bound `[state]` data can be replaced or reordered, so a projected item
   * template keeps its per-row state instead of being reused by position.
   */
  readonly trackBy = input<(index: number, item: T) => unknown>((index) => index);

  protected readonly paginate = inject(CngxPaginate);
  private readonly destroyRef = inject(DestroyRef);
  private readonly config = injectIncrementalListConfig();

  // View slot resolvers. Direct contentChild field initialisers (AOT NG8110
  // rejects them from a helper); read as TemplateRef so the cascade computeds
  // return a renderable reference or null.
  private readonly itemSlot = contentChild(CngxIncrementalItem, { read: TemplateRef });
  private readonly emptySlot = contentChild(CngxIncrementalEmpty, { read: TemplateRef });
  private readonly errorSlot = contentChild(CngxIncrementalError, { read: TemplateRef });
  private readonly endSlot = contentChild(CngxIncrementalEnd, { read: TemplateRef });
  private readonly loadingSlot = contentChild(CngxIncrementalLoading, { read: TemplateRef });

  // Three-stage slot cascade: instance slot -> config.templates.<key> ->
  // built-in default. Returns existing TemplateRef refs or null -
  // reference-stable, so no explicit equal fn is needed.
  protected readonly itemTemplate = computed(
    () => this.itemSlot() ?? this.config.templates?.item ?? null,
  );
  protected readonly emptyTemplate = computed(
    () => this.emptySlot() ?? this.config.templates?.empty ?? null,
  );
  protected readonly errorTemplate = computed(
    () => this.errorSlot() ?? this.config.templates?.error ?? null,
  );
  protected readonly endTemplate = computed(
    () => this.endSlot() ?? this.config.templates?.end ?? null,
  );
  protected readonly loadingTemplate = computed(
    () => this.loadingSlot() ?? this.config.templates?.loading ?? null,
  );

  /**
   * Which region renders, resolved from the single `[state]` source through the
   * shared `resolveAsyncView` switch - no local state machine. With no bound
   * state the organism is a plain content list.
   */
  protected readonly view = computed<AsyncView>(() => {
    const state = this.paginate.state();
    if (!state) {
      return 'content';
    }
    return resolveAsyncView(state.status(), state.isFirstLoad(), state.isEmpty());
  });

  /** `true` on the last page - every accumulated item has been revealed. */
  protected readonly exhausted = computed(() => this.paginate.isLast());

  /**
   * The accumulated slice: every page revealed so far, sliced from the top of
   * the bound data. Pure derivation of the brain `cumulativeRange()` and the
   * state's `data()`; the explicit `equal` stops a fresh-array identity from
   * cascading downstream.
   */
  protected readonly items = computed<readonly T[]>(
    () => {
      const data = this.paginate.state()?.data();
      if (!Array.isArray(data)) {
        return [];
      }
      const [start, end] = this.paginate.cumulativeRange();
      return (data as readonly T[]).slice(start, end);
    },
    { equal: (a, b) => a.length === b.length && a.every((item, i) => Object.is(item, b[i])) },
  );

  // Built-in view labels, resolved through the config cascade (EN library
  // defaults). Consumers re-phrase or localise via provideIncrementalListConfig.
  protected readonly loadingLabel = computed(() => this.config.ariaLabels.loading);
  protected readonly emptyLabel = computed(() => this.config.ariaLabels.empty);
  protected readonly errorLabel = computed(() => this.config.ariaLabels.error);
  protected readonly pageErrorLabel = computed(() => this.config.ariaLabels.pageError);
  protected readonly retryLabel = computed(() => this.config.ariaLabels.retry);
  protected readonly endLabel = computed(() => this.config.ariaLabels.endReached(this.paginate.total()));

  /**
   * Error text for the active error view - the distinct `pageError` phrasing
   * when a subsequent page failed with the list still visible (`content+error`),
   * the first-load `error` phrasing otherwise. Drives both the built-in visible
   * text and the live-region announcement so the two never diverge.
   */
  protected readonly errorViewLabel = computed(() =>
    this.view() === 'content+error' ? this.pageErrorLabel() : this.errorLabel(),
  );

  /**
   * Polite live-region message - communicated on every settle through the same
   * labels the visible views use, so a config or slot override stays in sync.
   */
  protected readonly statusMessage = computed(() => {
    if (this.paginate.isBusy()) {
      return this.loadingLabel();
    }
    const view = this.view();
    if (view === 'empty') {
      return this.emptyLabel();
    }
    if (view === 'error' || view === 'content+error') {
      return this.errorViewLabel();
    }
    return this.exhausted() ? this.endLabel() : '';
  });

  /** Stable retry callback - emits the `retry` output; shared by the built-in button and the error slot context. */
  protected readonly retryFn = (): void => this.retry.emit();

  /** Context handed to a projected error slot: the retry callback and the raw error. */
  protected readonly errorContext = computed<CngxIncrementalErrorContext>(
    () => ({ retry: this.retryFn, error: this.paginate.state()?.error() }),
    { equal: (a, b) => a.retry === b.retry && a.error === b.error },
  );

  /** `@for` track expression - delegates to the `trackBy` input (index by default). */
  protected readonly trackItem = (index: number, item: T): unknown => this.trackBy()(index, item);

  // Two-way [(pageIndex)] / [(pageSize)] plumbing, mirroring CngxPaginator: the
  // brain's controlled inputs are aliased through hostDirectives and this
  // component is their single emitter. The nav subscription captures a
  // controlled-mode setPage (where the effective pageIndex() stays pinned to the
  // input); the clamp effect covers a total-shrink move the nav-only output
  // misses. The shared lastEmitted guard keeps each change to exactly one emit.
  private lastEmittedIndex = this.paginate.pageIndex();
  private lastEmittedSize = this.paginate.pageSize();

  constructor() {
    const indexSub = this.paginate.pageChange.subscribe((index) => {
      if (index !== this.lastEmittedIndex) {
        this.lastEmittedIndex = index;
        this.pageIndexChange.emit(index);
      }
    });
    const sizeSub = this.paginate.pageSizeChange.subscribe((size) => {
      if (size !== this.lastEmittedSize) {
        this.lastEmittedSize = size;
        this.pageSizeChange.emit(size);
      }
    });
    this.destroyRef.onDestroy(() => {
      indexSub.unsubscribe();
      sizeSub.unsubscribe();
    });

    effect(() => {
      const index = this.paginate.pageIndex();
      if (index !== this.lastEmittedIndex) {
        this.lastEmittedIndex = index;
        this.pageIndexChange.emit(index);
      }
    });
    effect(() => {
      const size = this.paginate.pageSize();
      if (size !== this.lastEmittedSize) {
        this.lastEmittedSize = size;
        this.pageSizeChange.emit(size);
      }
    });
  }
}
