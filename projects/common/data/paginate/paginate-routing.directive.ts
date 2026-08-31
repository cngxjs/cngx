import {
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  type OnInit,
  signal,
  untracked,
} from '@angular/core';
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
 * `[cngxPaginatePageParam]` / `[cngxPaginateSizeParam]` to avoid a collision. \
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
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/url-synced-paging</example-url>
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

  // Set synchronously around brain writes driven by the URL, so the
  // pageChange subscription below can tell a URL-driven change from a user
  // navigation (setPage/setPageSize emit synchronously).
  private applyingFromUrl = false;

  // A deep-linked page index the brain could not represent yet: setPage
  // clamps against totalPages (1 while the default total=0 is still in
  // effect) and no-ops entirely while the bound async state is busy. The raw
  // index is parked here and re-applied once total/busy settle; while it is
  // parked, the brain -> URL effect leaves the URL alone so the deep link
  // survives until the data lands. `size` is null once the size half has
  // been applied.
  private readonly pendingUrl = signal<{ index: number; size: number | null } | null>(null, {
    equal: (a, b) => a?.index === b?.index && a?.size === b?.size,
  });

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

    // A user navigation supersedes a still-parked deep link. The brain is
    // resolved through the element injector and may live on an ancestor, so
    // the subscription is torn down explicitly instead of relying on shared
    // lifecycles.
    const pageChangeSub = this.paginate.pageChange.subscribe(() => {
      if (!this.applyingFromUrl) {
        this.pendingUrl.set(null);
      }
    });
    this.destroyRef.onDestroy(() => pageChangeSub.unsubscribe());

    // brain -> URL. Tracks the effective page / size; merges into the existing
    // query string and replaces history so paging does not stack back entries.
    // The param-name inputs are read lazily inside untracked, so a late-bound
    // alias is already set by the time the first navigation fires. Skipped
    // while a deep link is parked and when the URL already carries the values
    // (the echo after a URL -> brain apply must not renavigate).
    effect(() => {
      const page = this.paginate.pageIndex() + 1;
      const size = this.paginate.pageSize();
      if (this.pendingUrl() !== null) {
        return;
      }
      untracked(() => {
        // Snapshot read while router.navigate is async: a still-pending
        // navigation can slip past this check and renavigate - benign under
        // replaceUrl + merge (same params, no history entry).
        const params = route.snapshot.queryParamMap;
        const samePage = Number(params.get(this.pageParam())) === page;
        const sameSize = Number(params.get(this.sizeParam())) === size;
        if (samePage && sameSize) {
          return;
        }
        void router.navigate([], {
          relativeTo: route,
          queryParams: { [this.pageParam()]: page, [this.sizeParam()]: size },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    });

    // Re-apply a parked deep link whenever the clamp inputs move (total
    // landed, busy released). Only those two triggers are tracked; the parked
    // value is read untracked, so the re-park write inside applyFromUrl can
    // never feed back into this effect's own dependency graph.
    effect(() => {
      this.paginate.totalPages();
      this.paginate.isBusy();
      untracked(() => {
        const pending = this.pendingUrl();
        if (pending !== null) {
          this.applyFromUrl(pending.index, pending.size);
        }
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
      const rawSize = Number(params.get(this.sizeParam()));
      const rawPage = Number(params.get(this.pageParam()));
      const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : null;
      const index = (Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1) - 1;
      this.applyFromUrl(index, size);
    });
  }

  private applyFromUrl(index: number, size: number | null): void {
    const paginate = this.paginate;
    if (paginate.isBusy()) {
      // Both setters no-op while busy - park the whole request and retry.
      this.pendingUrl.set({ index, size });
      return;
    }
    this.applyingFromUrl = true;
    try {
      if (size !== null && size !== paginate.pageSize()) {
        paginate.setPageSize(size, false);
      }
      if (index !== paginate.pageIndex()) {
        paginate.setPage(index);
      }
    } finally {
      this.applyingFromUrl = false;
    }
    if (paginate.pageIndex() === index || paginate.total() > 0) {
      // Landed, or clamped against a real total - the deep link is resolved.
      this.pendingUrl.set(null);
    } else {
      // Clamped against the default total=0: the real total has not arrived
      // yet, so keep the raw index parked (size, if any, is applied already).
      this.pendingUrl.set({ index, size: null });
    }
  }
}
