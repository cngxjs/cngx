import { DataSource } from '@angular/cdk/collections';
import { computed, inject, Injector, type Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { CngxAsyncState } from '@cngx/core/utils';
import type { Observable } from 'rxjs';
import { CngxPaginate } from '../paginate/paginate.directive';
import { CngxFilter } from '../filter/filter.directive';
import { CngxSort } from '../sort/sort.directive';
import { CngxSearch } from '@cngx/common/interactive';

/** Optional customisation for {@link CngxSmartDataSource}. */
export interface CngxSmartDataSourceOptions<T> {
  /**
   * Custom full-text search function. Receives an item and the current search
   * term; return `true` to keep the item. Defaults to a case-insensitive match
   * across all primitive-valued properties.
   */
  searchFn?: (item: T, term: string) => boolean;
  /**
   * Custom sort comparator. Receives two items, the active field key, and
   * direction. Defaults to a locale-aware string comparison.
   */
  sortFn?: (a: T, b: T, field: string, direction: 'asc' | 'desc') => number;
}

function isAsyncState<T>(source: Signal<T[]> | CngxAsyncState<T[]>): source is CngxAsyncState<T[]> {
  return 'status' in source && 'data' in source && 'isFirstLoad' in source;
}

/**
 * A CDK `DataSource` that optionally integrates with `CngxSort`,
 * `CngxFilter`, `CngxSearch`, and `CngxPaginate` present in the injection
 * tree. Each directive is injected optionally — if absent, that processing
 * step is skipped.
 *
 * Accepts either a plain `Signal<T[]>` or a `CngxAsyncState<T[]>`.
 * When a `CngxAsyncState` is provided, the data source exposes the full
 * UX state (`isLoading`, `isRefreshing`, `error`, `isEmpty`) so the
 * table can show skeleton rows, error states, and loading indicators.
 *
 * ```typescript
 * // Plain signal
 * readonly dataSource = injectSmartDataSource(this.items);
 *
 * // With async state — full UX lifecycle
 * readonly residents = injectAsyncState(() => this.api.getAll(this.filter()));
 * readonly dataSource = injectSmartDataSource(this.residents);
 * // dataSource.isLoading(), dataSource.error(), dataSource.isRefreshing()
 * ```
 *
 * @typeParam T - The row item type.
 */
export class CngxSmartDataSource<T> extends DataSource<T> {
  private readonly injector = inject(Injector);
  private readonly sort = inject(CngxSort, { optional: true });
  private readonly filter = inject(CngxFilter, { optional: true });
  // CngxSearch typically lives on a child <input> below the component injector,
  // so this inject returns null in the common case. It resolves only when CngxSearch
  // is placed as a hostDirective on the same component. For child-input search,
  // use injectDataSource() + manual computed() instead.
  private readonly search = inject(CngxSearch, { optional: true });
  private readonly paginate = inject(CngxPaginate, { optional: true });

  /**
   * Items after filter and search are applied, before sort and pagination.
   * Use `filteredCount()` to get the pre-pagination count for paginator `total`.
   */
  private readonly filtered: Signal<T[]>;

  /** Number of items after filtering/searching, before pagination. */
  readonly filteredCount: Signal<number>;

  private readonly processed: Signal<T[]>;

  // ── Async state — only populated when source is CngxAsyncState ─────

  /** The async state source, or `undefined` if constructed from a plain signal. */
  readonly asyncState: CngxAsyncState<T[]> | undefined;

  /** `true` during initial data load (skeleton phase). */
  readonly isLoading: Signal<boolean>;

  /** `true` during refresh (data stays visible, loading bar). */
  readonly isRefreshing: Signal<boolean>;

  /** `true` when any operation is running. Maps to `aria-busy`. */
  readonly isBusy: Signal<boolean>;

  /** `true` if no successful load has completed yet. */
  readonly isFirstLoad: Signal<boolean>;

  /** Error from the async state, or `undefined`. */
  readonly error: Signal<unknown>;

  /** `true` when data is empty AND no operation is running. */
  readonly isEmpty: Signal<boolean>;

  constructor(
    source: Signal<T[]> | CngxAsyncState<T[]>,
    private readonly options?: CngxSmartDataSourceOptions<T>,
  ) {
    super();

    // Resolve data signal and async state from the source
    let data: Signal<T[]>;
    if (isAsyncState(source)) {
      this.asyncState = source;
      data = computed(() => source.data() ?? []);
    } else {
      this.asyncState = undefined;
      data = source;
    }

    const s = this.asyncState;
    this.isLoading = computed(() => s?.isLoading() ?? false);
    this.isRefreshing = computed(() => s?.isRefreshing() ?? false);
    this.isBusy = computed(() => s?.isBusy() ?? false);
    this.isFirstLoad = computed(() => s?.isFirstLoad() ?? false);
    this.error = computed(() => s?.error());

    this.filtered = computed(() => {
      const predicate = this.filter?.predicate();
      const term = this.search?.term();
      const searchFn =
        this.options?.searchFn ??
        ((item: T, t: string) => {
          const lower = t.toLowerCase();
          return Object.values(item as Record<string, unknown>).some((v) =>
            v === null || v === undefined || typeof v === 'object'
              ? false
              : String(v as string | number | boolean | bigint)
                  .toLowerCase()
                  .includes(lower),
          );
        });

      // Pipeline: raw → filter → search. Cast required: CngxFilter injected as unknown.
      return data()
        .filter((v) => !predicate || (predicate as (v: T) => boolean)(v))
        .filter((item) => !term || searchFn(item, term));
    });

    this.filteredCount = computed(() => this.filtered().length);

    this.isEmpty = computed(() => {
      // During loading, not "empty" yet — show skeleton instead
      if (this.isBusy()) {
        return false;
      }
      return this.filteredCount() === 0;
    });

    this.processed = computed(() => {
      const sorts = this.sort?.sorts() ?? [];
      const sortFn =
        this.options?.sortFn ??
        ((a: T, b: T, field: string, dir: 'asc' | 'desc') => {
          const toStr = (v: unknown): string =>
            v === null || v === undefined || typeof v === 'object'
              ? ''
              : String(v as string | number | boolean | bigint);
          const av = toStr((a as Record<string, unknown>)[field]);
          const bv = toStr((b as Record<string, unknown>)[field]);
          const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
          return dir === 'asc' ? cmp : -cmp;
        });

      // Pipeline: filtered → sort → paginate
      const sorted =
        sorts.length > 0
          ? [...this.filtered()].sort((a, b) =>
              sorts.reduce(
                (cmp, { active, direction }) => cmp || sortFn(a, b, active, direction),
                0,
              ),
            )
          : this.filtered();

      const range = this.paginate?.range();
      return range ? sorted.slice(range[0], range[1]) : sorted;
    });
  }

  override connect(): Observable<T[]> {
    return toObservable(this.processed, { injector: this.injector });
  }

  override disconnect(): void {
    // Signal cleanup is handled by Angular's DestroyRef — no manual teardown needed.
  }
}

/**
 * Factory function for {@link CngxSmartDataSource}.
 * Must be called within an injection context (constructor or field initializer).
 *
 * Accepts either a plain `Signal<T[]>` or a `CngxAsyncState<T[]>` for
 * full UX state integration (loading, error, refresh, empty).
 *
 * @example
 * ```typescript
 * // Plain signal
 * readonly dataSource = injectSmartDataSource(this.items);
 *
 * // With async state — table shows skeleton, error, loading bar
 * readonly residents = injectAsyncState(() => this.api.getAll());
 * readonly dataSource = injectSmartDataSource(this.residents);
 * ```
 */
export function injectSmartDataSource<T>(
  source: Signal<T[]> | CngxAsyncState<T[]>,
  options?: CngxSmartDataSourceOptions<T>,
): CngxSmartDataSource<T> {
  return new CngxSmartDataSource(source, options);
}
