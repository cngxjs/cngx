import { DataSource } from '@angular/cdk/collections';
import { computed, inject, Injector, type Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { CngxPaginate } from './paginate.directive';
import { CngxFilter } from './filter.directive';
import { CngxSort } from './sort.directive';
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

/**
 * A CDK `DataSource` that optionally integrates with `CngxSort`,
 * `CngxFilter`, `CngxSearch`, and `CngxPaginate` present in the injection
 * tree. Each directive is injected optionally — if absent, that processing
 * step is skipped.
 *
 * Use this for simple flat lists where you want automatic wiring. For trees
 * or complex pipelines, prefer {@link CngxDataSource} with a manual
 * `computed()`.
 *
 * ```typescript
 * readonly dataSource = injectSmartDataSource(this.items);
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

  constructor(
    private readonly data: Signal<T[]>,
    private readonly options?: CngxSmartDataSourceOptions<T>,
  ) {
    super();

    this.filtered = computed(() => {
      let items = this.data();

      // Filter via CngxFilter (predicate function)
      const predicate = this.filter?.predicate();
      if (predicate) {
        items = items.filter((v) => (predicate as (v: T) => boolean)(v));
      }

      // Search via CngxSearch (full-text, default or custom)
      const term = this.search?.term();
      if (term) {
        const searchFn =
          this.options?.searchFn ??
          ((item: T, t: string) => {
            const lower = t.toLowerCase();
            return Object.values(item as Record<string, unknown>).some((v) => {
              if (v === null || v === undefined || typeof v === 'object') {
                return false;
              }
              return String(v as string | number | boolean | bigint)
                .toLowerCase()
                .includes(lower);
            });
          });
        items = items.filter((item) => searchFn(item, term));
      }

      return items;
    });

    this.filteredCount = computed(() => this.filtered().length);

    this.processed = computed(() => {
      let items = this.filtered();

      // Sort via CngxSort — respects the full multi-sort stack in priority order
      const sorts = this.sort?.sorts() ?? [];
      if (sorts.length > 0) {
        const sortFn =
          this.options?.sortFn ??
          ((a: T, b: T, field: string, dir: 'asc' | 'desc') => {
            const av = (a as Record<string, unknown>)[field];
            const bv = (b as Record<string, unknown>)[field];
            const toStr = (v: unknown): string =>
              v === null || v === undefined || typeof v === 'object'
                ? ''
                : String(v as string | number | boolean | bigint);
            const cmp = toStr(av).localeCompare(toStr(bv), undefined, {
              numeric: true,
              sensitivity: 'base',
            });
            return dir === 'asc' ? cmp : -cmp;
          });
        items = [...items].sort((a, b) => {
          for (const { active, direction } of sorts) {
            const cmp = sortFn(a, b, active, direction);
            if (cmp !== 0) {
              return cmp;
            }
          }
          return 0;
        });
      }

      // Paginate via CngxPaginate — slice after sort
      if (this.paginate) {
        const [start, end] = this.paginate.range();
        items = items.slice(start, end);
      }

      return items;
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
 * @example
 * // Field initializer — injection context
 * readonly dataSource = injectSmartDataSource(this.items);
 */
export function injectSmartDataSource<T>(
  data: Signal<T[]>,
  options?: CngxSmartDataSourceOptions<T>,
): CngxSmartDataSource<T> {
  return new CngxSmartDataSource(data, options);
}
