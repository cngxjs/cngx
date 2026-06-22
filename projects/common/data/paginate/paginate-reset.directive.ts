import { Directive, effect, inject, input, untracked } from '@angular/core';

import { CngxPaginate } from './paginate.directive';

/**
 * Wires the reset-on-change behaviour onto a {@link CngxPaginate} brain: when
 * `key()` changes (after the initial run) the paginator jumps to the first
 * page. The first run captures the mounting value without resetting, and an
 * already-first paginator emits nothing.
 *
 * Shared by `[cngxPaginateResetOn]`, the `CngxPaginator` shell's `resetOn`
 * input, and the `CngxMatPaginator` bridge's `resetOn` input, so the behaviour
 * is byte-identical across all three. Call inside an injection context
 * (constructor or field initialiser).
 *
 * @category common/data/paginate
 * @since 0.1.0
 */
export function connectPaginateResetOn(paginate: CngxPaginate, key: () => unknown): void {
  let seen = false;
  effect(() => {
    key();
    if (!seen) {
      seen = true;
      return;
    }
    untracked(() => {
      if (paginate.pageIndex() !== 0) {
        paginate.setPage(0);
      }
    });
  });
}

/**
 * Resets a `cngxPaginate` host to the first page whenever the bound key
 * changes - the composable form of {@link connectPaginateResetOn}. Drop it on
 * the same element as `cngxPaginate` (or a `CngxPaginator` / `CngxMatPaginator`,
 * which provide the brain), and bind the sort / filter / search value a result
 * set depends on, so a narrowed result never strands the user on a now-empty
 * page.
 *
 * Bind a primitive or a `computed` - an inline array / object literal recomputes
 * every change-detection pass and would reset on each.
 *
 * ```html
 * <table cngxPaginate [cngxPaginateResetOn]="filter()"><!-- ... --></table>
 * ```
 *
 * @category common/data/paginate
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/paginate/paginate-reset.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPaginate, CngxPaginator, CngxMatPaginator
 */
@Directive({
  selector: '[cngxPaginateResetOn]',
  exportAs: 'cngxPaginateResetOn',
  standalone: true,
})
export class CngxPaginateResetOn {
  private readonly paginate = inject(CngxPaginate);

  /** The reset key. A change (after mount) jumps the paginator to page 0. */
  readonly key = input<unknown>(undefined, { alias: 'cngxPaginateResetOn' });

  constructor() {
    connectPaginateResetOn(this.paginate, this.key);
  }
}
