import { DataSource } from '@angular/cdk/collections';
import { inject, Injector, type Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';

/**
 * A minimal CDK `DataSource` that bridges a Signal to the CDK table's
 * Observable-based data contract.
 *
 * No sort, filter, or search logic is included — the consumer builds a
 * `computed()` with any transformations and passes the result here.
 *
 * ```typescript
 * readonly processed = computed(() => {
 *   let items = this.raw();
 *   if (this.sort().sort()) items = sortTree(items, ...);
 *   return items;
 * });
 * readonly dataSource = injectDataSource(this.processed);
 * ```
 *
 * @typeParam T - The row item type.
 */
export class CngxDataSource<T> extends DataSource<T> {
  private readonly injector = inject(Injector);

  constructor(private readonly _data: Signal<T[]>) {
    super();
  }

  override connect(): Observable<T[]> {
    return toObservable(this._data, { injector: this.injector });
  }

  override disconnect(): void {
    // Signal cleanup is handled by Angular's DestroyRef — no manual teardown needed.
  }
}

/**
 * Factory function for {@link CngxDataSource}.
 * Must be called within an injection context (constructor or field initializer).
 *
 * @example
 * // Field initializer — injection context
 * readonly dataSource = injectDataSource(this.items);
 */
export function injectDataSource<T>(data: Signal<T[]>): CngxDataSource<T> {
  return new CngxDataSource(data);
}
