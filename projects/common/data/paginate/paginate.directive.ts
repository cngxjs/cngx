import { computed, Directive, input, output, signal } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

/**
 * Atom directive that tracks pagination state (current page index and page size).
 *
 * Supports both **uncontrolled** (internal state) and **controlled** modes.
 * In controlled mode the `cngxPageIndex` / `cngxPageSize` inputs take precedence
 * over internal state — pair with `pageChange` / `pageSizeChange` to keep them
 * in sync.
 *
 * Consumer connects this to a list or table via `range()` — nothing is injected
 * automatically.
 *
 * @example
 * // Headless: read range() from a template ref
 * <div cngxPaginate #pg="cngxPaginate" [total]="items.length">
 *   @for (item of items.slice(pg.range()[0], pg.range()[1]); track item.id) { ... }
 * </div>
 *
 * // With CngxMatPaginator:
 * <cngx-mat-paginator [cngxPaginateRef]="pg" />
 */
@Directive({
  selector: '[cngxPaginate]',
  exportAs: 'cngxPaginate',
  standalone: true,
})
export class CngxPaginate {
  /** Controlled page index. When bound, takes precedence over internal state. */
  readonly pageIndexInput = input<number | undefined>(undefined, { alias: 'cngxPageIndex' });
  /** Controlled page size. When bound, takes precedence over internal state. */
  readonly pageSizeInput = input<number | undefined>(undefined, { alias: 'cngxPageSize' });
  /**
   * Total number of items (before pagination). Consumer binds this from the
   * filtered/sorted count so that `totalPages` stays accurate.
   */
  readonly total = input<number>(0);

  /**
   * Bind an async state — disables navigation while the data source is busy.
   * When set, `isBusy` derives from `state.isBusy()`. Navigation methods
   * (`setPage`, `next`, `previous`, etc.) are no-ops while busy.
   */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** `true` when the bound async state is busy (loading/refreshing). */
  readonly isBusy = computed(() => this.state()?.isBusy() ?? false);

  private readonly pageIndexState = signal(0);
  private readonly pageSizeState = signal(10);

  /** Current page index (0-based). Controlled input takes precedence. Auto-clamped to totalPages. */
  readonly pageIndex = computed(() => {
    const raw = this.pageIndexInput() ?? this.pageIndexState();
    const max = this.totalPages() - 1;
    return Math.min(raw, max);
  });
  /** Current page size. Controlled input takes precedence. */
  readonly pageSize = computed(() => this.pageSizeInput() ?? this.pageSizeState());

  /** Total number of pages (minimum 1). */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  /** `true` when on the first page. */
  readonly isFirst = computed(() => this.pageIndex() === 0);
  /** `true` when on the last page. */
  readonly isLast = computed(() => this.pageIndex() >= this.totalPages() - 1);

  /**
   * `[start, end]` indices for `Array.slice()` — always in-bounds.
   * Consumer: `items.slice(range()[0], range()[1])`.
   */
  readonly range = computed<[number, number]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return [start, start + this.pageSize()];
  });

  /** Emitted when the page index changes. */
  readonly pageChange = output<number>();
  /** Emitted when the page size changes. */
  readonly pageSizeChange = output<number>();

  /**
   * Navigate to `index`, clamping to `[0, totalPages - 1]`.
   * Emits `pageChange`.
   */
  setPage(index: number): void {
    if (this.isBusy()) {
      return;
    }
    const clamped = Math.max(0, Math.min(index, this.totalPages() - 1));
    this.pageIndexState.set(clamped);
    this.pageChange.emit(clamped);
  }

  /**
   * Change page size and optionally reset to page 0.
   * Emits `pageSizeChange` and, when `resetPage` is `true`, `pageChange`.
   */
  setPageSize(size: number, resetPage = true): void {
    if (this.isBusy()) {
      return;
    }
    this.pageSizeState.set(size);
    this.pageSizeChange.emit(size);
    if (resetPage) {
      this.pageIndexState.set(0);
      this.pageChange.emit(0);
    }
  }

  /** Navigate to the next page (no-op on the last page). */
  next(): void {
    this.setPage(this.pageIndex() + 1);
  }

  /** Navigate to the previous page (no-op on the first page). */
  previous(): void {
    this.setPage(this.pageIndex() - 1);
  }

  /** Navigate to the first page. */
  first(): void {
    this.setPage(0);
  }

  /** Navigate to the last page. */
  last(): void {
    this.setPage(this.totalPages() - 1);
  }
}
