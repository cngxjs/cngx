import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { type CngxPaginate } from '@cngx/common/data';

/**
 * Material paginator wrapper that connects to a {@link CngxPaginate} directive
 * via an explicit `[cngxPaginateRef]` input - no ancestor injection.
 *
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
 *
 * @category ui/material
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/material/mat-paginator.ts
 * @since 0.1.0
 * @relatedTo CngxPaginate, CngxDataSource
 * <example-url>http://localhost:4200/#/common/data/data-source/datasource-cngxpaginate-manual-pipeline</example-url>
 * <example-url>http://localhost:4200/#/common/data/data-source/signal-observable-bridge</example-url>
 * <example-url>http://localhost:4200/#/common/data/paginate-list/paginated-list-cngxpaginate-cngxmatpaginator</example-url>
 * <example-url>http://localhost:4200/#/common/data/paginate-list/uncontrolled-mode-zero-class-boilerplate</example-url>
 */
@Component({
  selector: 'cngx-mat-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatPaginatorModule],
  template: `
    <mat-paginator
      [length]="ref().total()"
      [pageIndex]="ref().pageIndex()"
      [pageSize]="ref().pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      [disabled]="ref().isBusy()"
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
    // setPageSize(..., false) suppresses the implicit page reset so the
    // explicit setPage below lands the index mat-paginator already computed.
    this.ref().setPageSize(event.pageSize, false);
    this.ref().setPage(event.pageIndex);
  }
}
