import { DestroyRef, Directive, effect, inject, input, type OnInit, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { CngxPaginate } from './paginate.directive';

/**
 * Persists a `cngxPaginate` host's page / size in the URL query string, so a
 * paginated view is deep-linkable and survives reload / back / forward.
 *
 * Drop it on the same element as `cngxPaginate` (or a `CngxPaginator` /
 * `CngxMatPaginator`, which provide the brain). The page is written 1-based
 * (`?page=2`) for human-readable URLs; the brain stays 0-based.
 *
 * ```html
 * <cngx-paginator cngxPaginateRouting [total]="items().length"></cngx-paginator>
 * ```
 *
 * Two paginators on one route must take distinct param names via
 * `[cngxPaginatePageParam]` / `[cngxPaginateSizeParam]` to avoid a collision.
 * Requires `@angular/router` (`provideRouter`); without it the directive is an
 * inert no-op (a dev-mode warning is logged). Framework-agnostic of any UI - it
 * needs only the brain and the router.
 *
 * @category common/data/paginate
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/paginate/paginate-routing.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPaginate, CngxPaginator, CngxMatPaginator
 */
@Directive({
  selector: '[cngxPaginateRouting]',
  exportAs: 'cngxPaginateRouting',
  standalone: true,
})
export class CngxPaginateRouting implements OnInit {
  private readonly paginate = inject(CngxPaginate);
  private readonly router = inject(Router, { optional: true });
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Query-param name for the 1-based page. */
  readonly pageParam = input('page', { alias: 'cngxPaginatePageParam' });
  /** Query-param name for the page size. */
  readonly sizeParam = input('pageSize', { alias: 'cngxPaginateSizeParam' });

  // Set while applying a URL change to the brain, so the brain -> URL effect
  // does not bounce the same value straight back as a redundant navigation.
  private applyingFromUrl = false;

  constructor() {
    const router = this.router;
    const route = this.route;
    if (!router || !route) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn(
          '[cngxPaginateRouting]: no Router available - directive is a no-op. ' +
            'Provide @angular/router via provideRouter(...) to enable URL-synced pagination.',
        );
      }
      return;
    }

    // brain -> URL. Tracks the effective page / size; merges into the existing
    // query string and replaces history so paging does not stack back entries.
    // The param-name inputs are read lazily inside untracked, so a late-bound
    // alias is already set by the time the first navigation fires.
    effect(() => {
      const page = this.paginate.pageIndex() + 1;
      const size = this.paginate.pageSize();
      if (this.applyingFromUrl) {
        return;
      }
      untracked(() => {
        void router.navigate([], {
          relativeTo: route,
          queryParams: { [this.pageParam()]: page, [this.sizeParam()]: size },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    });
  }

  ngOnInit(): void {
    const route = this.route;
    if (!route) {
      return;
    }
    // URL -> brain, wired in ngOnInit so the param-name inputs are resolved
    // before queryParamMap replays the current params on subscribe (a
    // deep-linked page / size therefore lands before first paint). The
    // subscription stays live for back / forward navigation.
    route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const size = Number(params.get(this.sizeParam()));
      const page = Number(params.get(this.pageParam()));
      this.applyingFromUrl = true;
      try {
        if (Number.isFinite(size) && size > 0 && size !== this.paginate.pageSize()) {
          this.paginate.setPageSize(size, false);
        }
        const index = (Number.isFinite(page) && page > 0 ? page : 1) - 1;
        if (index !== this.paginate.pageIndex()) {
          this.paginate.setPage(index);
        }
      } finally {
        this.applyingFromUrl = false;
      }
    });
  }
}
