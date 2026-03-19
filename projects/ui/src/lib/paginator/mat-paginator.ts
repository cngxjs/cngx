import { Component, input } from '@angular/core';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { type CngxPaginate } from '@cngx/common';

/**
 * Material paginator wrapper that connects to a {@link CngxPaginate} directive
 * via an explicit `[cngxPaginateRef]` input — no ancestor injection.
 *
 * @example
 * ```html
 * <div cngxPaginate #pg="cngxPaginate" [total]="items.length">
 *   <!-- table / list -->
 * </div>
 * <cngx-mat-paginator [cngxPaginateRef]="pg" />
 * ```
 *
 * For SmartDataSource integration, expose `filteredCount` from the data source
 * and bind it to `[total]` on the element that carries `cngxPaginate`:
 * ```html
 * <div cngxPaginate #pg="cngxPaginate" [total]="ds.filteredCount()">
 *   <mat-table [dataSource]="ds" />
 * </div>
 * <cngx-mat-paginator [cngxPaginateRef]="pg" />
 * ```
 */
@Component({
  selector: 'cngx-mat-paginator',
  standalone: true,
  imports: [MatPaginatorModule],
  template: `
    <mat-paginator
      [length]="ref().total()"
      [pageIndex]="ref().pageIndex()"
      [pageSize]="ref().pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      (page)="handlePage($event)"
    />
  `,
})
export class CngxMatPaginator {
  /** The `CngxPaginate` directive instance to connect to. */
  readonly cngxPaginateRef = input.required<CngxPaginate>({ alias: 'cngxPaginateRef' });
  /** Options for the page-size selector. */
  readonly pageSizeOptions = input<number[]>([5, 10, 25]);

  protected readonly ref = this.cngxPaginateRef;

  protected handlePage(event: PageEvent): void {
    // Update page size first (without resetting page) then navigate to the
    // page index mat-paginator already computed for us.
    this.ref().setPageSize(event.pageSize, false);
    this.ref().setPage(event.pageIndex);
  }
}
