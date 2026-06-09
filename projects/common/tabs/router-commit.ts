import { Observable } from 'rxjs';
import { NavigationCancel, NavigationEnd, NavigationError, type Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';

import type { CngxTabsCommitAction } from './presenter.directive';
import type { CngxTabHandle } from './tab-group-host.token';

/**
 * Options for {@link createTabRouterCommit}.
 *
 * `tabs` is the presenter's live handle list - the action receives the
 * target *index*, so it needs the registry to resolve the matching
 * {@link CngxTabHandle} before computing its route. `[cngxTabsRouteSync]`
 * passes the host's `tabs` signal straight through.
 *
 * @category common/tabs
 */
export interface CngxTabRouterCommitOptions {
  readonly router: Router;
  readonly tabs: () => readonly CngxTabHandle[];
  /**
   * Maps a tab handle to its router command array. Default
   * `(handle) => [handle.id]` - the tab id is the child segment.
   * Override for real route paths (`(h) => ['settings', h.id]`).
   */
  readonly routeFor?: (handle: CngxTabHandle) => unknown[];
}

/**
 * Default tab-to-route mapping: the tab id is the child segment.
 * Shared so the factory and `[cngxTabsRouteSync]` reference one
 * definition instead of inlining the closure twice.
 *
 * @internal
 */
export const cngxDefaultTabRoute = (handle: CngxTabHandle): unknown[] => [handle.id];

/**
 * Builds a {@link CngxTabsCommitAction} that gates a tab switch through
 * `@angular/router`. The action navigates to the target tab's route and
 * resolves on the router's own outcome:
 *
 * - `NavigationEnd` → `true` (commit the switch)
 * - `NavigationCancel` (a `CanDeactivate` guard blocked) → `false`
 * - `NavigationError` (guard/resolver threw) → `false`
 *
 * Routed tabs reuse the presenter's commit lifecycle verbatim - the
 * router navigation is simply the async op. In pessimistic mode the
 * active tab follows the *resolved* route, so a cancelled guard keeps
 * the old tab with zero extra gate machinery. The events subscription
 * is opened *before* `navigate(...)` so a synchronously-resolving
 * navigation cannot emit before the action is listening; the commit
 * controller's `cancel()` unsubscribes on supersede.
 *
 * @category common/tabs
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/router-commit.ts
 * @since 0.1.0
 */
export function createTabRouterCommit(opts: CngxTabRouterCommitOptions): CngxTabsCommitAction {
  const routeFor = opts.routeFor ?? cngxDefaultTabRoute;
  return (_fromIndex, toIndex) =>
    new Observable<boolean>((subscriber) => {
      const target = opts.tabs()[toIndex];
      if (!target) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }
      const sub = opts.router.events
        .pipe(
          filter(
            (e): e is NavigationEnd | NavigationCancel | NavigationError =>
              e instanceof NavigationEnd ||
              e instanceof NavigationCancel ||
              e instanceof NavigationError,
          ),
          take(1),
        )
        .subscribe((event) => {
          subscriber.next(event instanceof NavigationEnd);
          subscriber.complete();
        });
      // A rejected promise surfaces on the events stream as
      // NavigationError, so the subscription above is the single
      // resolution path; swallow the promise rejection to avoid an
      // unhandled-rejection warning.
      opts.router.navigate(routeFor(target)).catch(() => undefined);
      return () => sub.unsubscribe();
    });
}
