import { Directive, effect, inject, input, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginator, type PageEvent } from '@angular/material/paginator';
import { CngxPaginate } from '@cngx/common/data';

/**
 * The in-place adoption half of the Material paginator instrumentation: add
 * `cngxMatPaginator` to an existing `<mat-paginator>` and the signal-native
 * {@link CngxPaginate} brain takes over its state with no DOM rewrite.
 *
 * Peer of the {@link CngxMatPaginatorWrapper} component. The wrapper renders fresh
 * `<mat-paginator>` markup bound to a brain handed in via `[cngxPaginateRef]`;
 * this bridge adopts markup the consumer already owns. Both ship side by side,
 * mirroring `[cngxMatStepper]` / `[cngxMatTabs]`.
 *
 * The bridge composes the untouched brain via `hostDirectives`, injects the
 * consumer's own `MatPaginator` with `{ self: true }`, and syncs the four
 * Material properties (`length` / `pageIndex` / `pageSize` / `disabled`) plus
 * `pageSizeOptions` against the brain's `computed()` graph, forwarding `(page)`
 * back into the brain.
 *
 * ```html
 * <mat-paginator
 *   cngxMatPaginator
 *   #pg="cngxMatPaginator"
 *   [total]="items.length"
 *   [pageSizeOptions]="[5, 10, 25]"
 * />
 * <ul>
 *   @for (item of items.slice(pg.paginate.range()[0], pg.paginate.range()[1]); track item.id) {
 *     <li>{{ item.label }}</li>
 *   }
 * </ul>
 * ```
 *
 * @category ui/mat-paginator
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-paginator/mat-paginator-bridge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMatPaginatorWrapper, CngxPaginate, CngxMatStepper
 */
@Directive({
  selector: '[cngxMatPaginator]',
  exportAs: 'cngxMatPaginator',
  standalone: true,
  host: {
    // MatPaginator disables its nav buttons on busy but says nothing about why;
    // aria-busy on the host communicates the updating state to AT, reactively.
    '[attr.aria-busy]': 'paginate.isBusy()',
  },
  hostDirectives: [
    {
      directive: CngxPaginate,
      inputs: ['cngxPageIndex', 'cngxPageSize', 'total', 'state'],
      outputs: ['pageChange', 'pageSizeChange'],
    },
  ],
})
export class CngxMatPaginator {
  private readonly matPaginator = inject(MatPaginator, { self: true });
  /**
   * The composed {@link CngxPaginate} brain. Public so a sibling list or table
   * outside the `<mat-paginator>` reads `range()` via `#ref="cngxMatPaginator"`.
   */
  readonly paginate = inject(CngxPaginate);

  /** Options for the page-size selector. A Material-render concern, owned here. */
  readonly pageSizeOptions = input<number[]>([5, 10, 25]);

  constructor() {
    effect(() => {
      const length = this.paginate.total();
      const pageIndex = this.paginate.pageIndex();
      const pageSize = this.paginate.pageSize();
      const busy = this.paginate.isBusy();
      const options = this.pageSizeOptions();
      untracked(() => {
        // `length` and `pageIndex` setters self-call markForCheck on
        // MatPaginator's OnPush view; writing them every run dirties the view
        // so the non-self-dirtying writes below flush in the same re-render -
        // including the disabled-only case where busy flips while page and
        // total hold. `pageSize` is written before `pageSizeOptions` so the
        // displayed-options merge keeps the active size selectable.
        this.matPaginator.length = length;
        this.matPaginator.pageSize = pageSize;
        this.matPaginator.pageSizeOptions = options;
        this.matPaginator.pageIndex = pageIndex;
        this.matPaginator.disabled = busy;
      });
    });

    this.matPaginator.page.pipe(takeUntilDestroyed()).subscribe((event: PageEvent) => {
      // setPageSize(..., false) suppresses the implicit page reset so the
      // explicit setPage below lands the index mat-paginator already computed -
      // same order as the CngxMatPaginatorWrapper component. No property setter emits
      // `page`, so these brain writes never re-enter through this subscription;
      // the path is loop-free without an echo guard.
      this.paginate.setPageSize(event.pageSize, false);
      this.paginate.setPage(event.pageIndex);
    });
  }
}
