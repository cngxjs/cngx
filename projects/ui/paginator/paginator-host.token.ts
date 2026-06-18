import { InjectionToken, type Signal } from '@angular/core';

/**
 * Read-mostly state-and-navigation contract every paginator segment part
 * injects instead of the concrete `CngxPaginator` shell. \
 * A structural subset of the `CngxPaginate` brain
 * (`@cngx/common/data`) - the brain provides it via `useExisting`, so a
 * decomposed skin keeps talking to the same token without depending on the
 * organism class (Atomic Decompose, DI abstraction).
 *
 * The signals are the single derivation source for every segment's disabled
 * state, label, and `aria-current`; the methods are the only write paths,
 * each routing through the brain so the clamp-`computed()` and busy-gate
 * invariants hold.
 *
 * @category ui/paginator
 */
export interface CngxPaginatorHost {
  /** Current page index (0-based), auto-clamped to `totalPages`. */
  readonly pageIndex: Signal<number>;
  /** Current page size. */
  readonly pageSize: Signal<number>;
  /** Total item count (before pagination). */
  readonly total: Signal<number>;
  /** Total number of pages (minimum 1). */
  readonly totalPages: Signal<number>;
  /** `[start, end]` slice indices for the current page - always in-bounds. */
  readonly range: Signal<readonly [number, number]>;
  /**
   * `[0, end]` cumulative slice indices for append-don't-replace (load-more)
   * consumers - every page revealed so far, sliced from the top.
   */
  readonly cumulativeRange: Signal<readonly [number, number]>;
  /** `true` when on the first page. */
  readonly isFirst: Signal<boolean>;
  /** `true` when on the last page. */
  readonly isLast: Signal<boolean>;
  /** `true` while the bound async state is busy - navigation is gated. */
  readonly isBusy: Signal<boolean>;

  /** Navigate to `index`, clamped to `[0, totalPages - 1]`. No-op while busy. */
  setPage(index: number): void;
  /** Change page size; resets to page 0 unless `resetPage` is `false`. No-op while busy. */
  setPageSize(size: number, resetPage?: boolean): void;
  /** Navigate to the next page (no-op on the last page). */
  next(): void;
  /** Navigate to the previous page (no-op on the first page). */
  previous(): void;
  /** Navigate to the first page. */
  first(): void;
  /** Navigate to the last page. */
  last(): void;
}

/**
 * DI token the `CngxPaginator` shell provides via `useExisting`. Segment
 * parts (`cngx-pgn-prev`, `cngx-pgn-pages`, ...) inject this rather than the
 * concrete component class, keeping the organism decompose-ready.
 *
 * @category ui/paginator
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-host.token.ts
 * @since 0.1.0
 */
export const CNGX_PAGINATOR_HOST = new InjectionToken<CngxPaginatorHost>('CngxPaginatorHost');
