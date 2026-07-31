import { DataSource } from '@angular/cdk/collections';
import { computed, inject, Injector, type Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { CngxAsyncState } from '@cngx/core/utils';
import { arrayEqual } from '@cngx/utils';
import type { Observable } from 'rxjs';
import { CngxPaginate } from '../paginate/paginate.directive';
import { CngxFilter } from '../filter/filter.directive';
import { CngxSort } from '../sort/sort.directive';
import { CngxSearch } from '@cngx/common/interactive';

function defaultSearchFn<T>(item: T, term: string): boolean {
  const lower = term.toLowerCase();
  return Object.values(item as Record<string, unknown>).some((v) =>
    v === null || v === undefined || typeof v === 'object'
      ? false
      : String(v as string | number | boolean | bigint)
          .toLowerCase()
          .includes(lower),
  );
}

function defaultSortFn<T>(a: T, b: T, field: string, dir: 'asc' | 'desc'): number {
  const toStr = (v: unknown): string =>
    v === null || v === undefined || typeof v === 'object'
      ? ''
      : String(v as string | number | boolean | bigint);
  const av = toStr((a as Record<string, unknown>)[field]);
  const bv = toStr((b as Record<string, unknown>)[field]);
  const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

/**
 * Optional customization for {@link CngxSmartDataSource}.
 *
 * @category common/data/data-source
 */
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
  /**
   * Resolve the `CngxSort` atom explicitly instead of relying on injection.
   * A thunk, not an instance, so a `viewChild` that is `undefined` on the
   * first pass resolves on a later read. A thunk result takes precedence over
   * an injected instance whenever it yields one; on `undefined` / `null` the
   * source falls back to the injected atom - so with both present, the
   * injected atom drives the frames before the thunk's target mounts, and the
   * thunk cannot express "use none".
   * Use for atoms hosted below this source's injector, e.g.
   * `{ sort: () => this.grid()?.sort }` against a `CngxDataGridAccordion`.
   */
  sort?: () => CngxSort | null | undefined;
  /** Same as `sort`, for the `CngxFilter` atom. */
  filter?: () => CngxFilter<T> | null | undefined;
  /** Same as `sort`, for the `CngxSearch` atom. */
  search?: () => CngxSearch | null | undefined;
  /** Same as `sort`, for the `CngxPaginate` atom. */
  paginate?: () => CngxPaginate | null | undefined;
}

function isAsyncState<T>(source: Signal<T[]> | CngxAsyncState<T[]>): source is CngxAsyncState<T[]> {
  return 'status' in source && 'data' in source && 'isFirstLoad' in source;
}

/**
 * A CDK `DataSource` that optionally integrates with `CngxSort`,
 * `CngxFilter`, `CngxSearch`, and `CngxPaginate` present in the injection
 * tree. Each directive is injected optionally - if absent, that processing
 * step is skipped.
 *
 * Injection resolves UPWARD only. Any atom hosted by a descendant component
 * - a `hostDirective` on an element below the consumer's injector - is
 * invisible to these injects, and the matching step is silently skipped:
 * the atom's own state still toggles (headers flip their arrows) while the
 * rows never move. `CngxDataGridAccordion` is the case where this is always
 * true: it hosts `CngxSort` and `CngxFilter` on the group element. Hand
 * such atoms in through the options thunks instead:
 *
 * ```typescript
 * readonly grid = viewChild(CngxDataGridAccordion);
 * readonly dataSource = injectSmartDataSource(this.rows, {
 *   sort: () => this.grid()?.sort,
 *   filter: () => this.grid()?.filter,
 * });
 * ```
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
 * // With async state - full UX lifecycle
 * readonly residents = injectAsyncState(() => this.api.getAll(this.filter()));
 * readonly dataSource = injectSmartDataSource(this.residents);
 * // dataSource.isLoading(), dataSource.error(), dataSource.isRefreshing()
 * ```
 *
 * @typeParam T - The row item type.
 *
 * @category common/data/data-source
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/data-source/smart-data-source.ts
 * @since 0.1.0
 * @relatedTo CngxDataSource, CngxSort, CngxFilter, CngxPaginate
 */
export class CngxSmartDataSource<T> extends DataSource<T> {
  private readonly injector = inject(Injector);
  private readonly injectedSort = inject(CngxSort, { optional: true });
  private readonly injectedFilter = inject(CngxFilter, { optional: true });
  // Injection resolves upward only; an atom below this injector (child
  // <input> search, a hosting organism's sort/filter) arrives via the
  // matching options thunk instead.
  private readonly injectedSearch = inject(CngxSearch, { optional: true });
  private readonly injectedPaginate = inject(CngxPaginate, { optional: true });

  /**
   * Items after filter and search are applied, before sort and pagination.
   * Use `filteredCount()` to get the pre-pagination count for paginator `total`.
   */
  private readonly filtered: Signal<T[]>;

  /** Number of items after filtering/searching, before pagination. */
  readonly filteredCount: Signal<number>;

  private readonly processed: Signal<T[]>;

  /**
   * The async state source, or `undefined` if constructed from a plain
   * signal. Internal-only - consumers read the derived projections
   * (`isLoading`, `isRefreshing`, `isBusy`, `isFirstLoad`, `error`,
   * `isEmpty`, `filteredCount`) instead of the raw source identity.
   */
  private readonly asyncState: CngxAsyncState<T[]> | undefined;

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

    this.filtered = computed(
      () => {
        // Resolve at read time: an options thunk pointing at a not-yet-mounted
        // viewChild returns undefined now and the instance on a later pass.
        const filter = this.options?.filter?.() ?? this.injectedFilter;
        const search = this.options?.search?.() ?? this.injectedSearch;
        const predicate = filter?.predicate();
        const term = search?.term();
        const searchFn = this.options?.searchFn ?? defaultSearchFn<T>;

        // Pipeline: raw → filter → search. Cast required: CngxFilter injected as unknown.
        return data()
          .filter((v) => !predicate || (predicate as (v: T) => boolean)(v))
          .filter((item) => !term || searchFn(item, term));
      },
      { equal: arrayEqual },
    );

    this.filteredCount = computed(() => this.filtered().length);

    this.isEmpty = computed(() => {
      // During loading, not "empty" yet - show skeleton instead
      if (this.isBusy()) {
        return false;
      }
      return this.filteredCount() === 0;
    });

    this.processed = computed(
      () => {
        const sort = this.options?.sort?.() ?? this.injectedSort;
        const sorts = sort?.sorts() ?? [];
        const sortFn = this.options?.sortFn ?? defaultSortFn<T>;

        const sorted =
          sorts.length > 0
            ? [...this.filtered()].sort((a, b) =>
                sorts.reduce(
                  (cmp, { active, direction }) => cmp || sortFn(a, b, active, direction),
                  0,
                ),
              )
            : this.filtered();

        const paginate = this.options?.paginate?.() ?? this.injectedPaginate;
        const range = paginate?.range();
        return range ? sorted.slice(range[0], range[1]) : sorted;
      },
      { equal: arrayEqual },
    );
  }

  override connect(): Observable<T[]> {
    return toObservable(this.processed, { injector: this.injector });
  }

  override disconnect(): void {
    // Signal cleanup is handled by Angular's DestroyRef - no manual teardown needed.
  }
}

/**
 * Factory function for {@link CngxSmartDataSource}.
 *
 * Must be called within an injection context (constructor or field initializer).
 * Accepts either a plain `Signal<T[]>` or a `CngxAsyncState<T[]>` for
 * full UX state integration (loading, error, refresh, empty).
 *
 * ```typescript
 * // Plain signal
 * readonly dataSource = injectSmartDataSource(this.items);
 *
 * // With async state - table shows skeleton, error, loading bar
 * readonly residents = injectAsyncState(() => this.api.getAll());
 * readonly dataSource = injectSmartDataSource(this.residents);
 * ```
 *
 * @category common/data/data-source
 */
export function injectSmartDataSource<T>(
  source: Signal<T[]> | CngxAsyncState<T[]>,
  options?: CngxSmartDataSourceOptions<T>,
): CngxSmartDataSource<T> {
  return new CngxSmartDataSource(source, options);
}
