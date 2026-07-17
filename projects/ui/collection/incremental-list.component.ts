import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { CngxLiveRegion } from '@cngx/common/a11y';
import { type AsyncView, CngxPaginate, resolveAsyncView } from '@cngx/common/data';
import { CngxProgress } from '@cngx/ui/feedback';

import { CNGX_PAGINATOR_HOST } from './incremental-list-host.token';

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
  imports: [CngxProgress, CngxLiveRegion],
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
  },
})
export class CngxIncrementalList<T = unknown> {
  /** Emits the effective page index on every change - navigation or `total`-shrink clamp. */
  readonly pageIndexChange = output<number>();
  /** Emits the effective page size on every change. */
  readonly pageSizeChange = output<number>();

  protected readonly paginate = inject(CngxPaginate);
  private readonly destroyRef = inject(DestroyRef);

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

  /**
   * Polite live-region message - communicated on every settle. English
   * built-in defaults; the config cascade routes these through
   * consumer-supplied labels in a later phase.
   */
  protected readonly statusMessage = computed(() => {
    if (this.paginate.isBusy()) {
      return 'Loading';
    }
    const view = this.view();
    if (view === 'empty') {
      return 'Nothing here yet';
    }
    if (view === 'error' || view === 'content+error') {
      return 'Failed to load';
    }
    return this.exhausted() ? `All ${this.paginate.total()} loaded` : '';
  });

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
