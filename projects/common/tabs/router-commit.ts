import { Observable } from 'rxjs';
import { type Router } from '@angular/router';

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
 * resolves on this navigation's own `navigate()` promise:
 *
 * - resolved `true` (`NavigationEnd`) → `true` (commit the switch)
 * - resolved `false` (`NavigationCancel` - a `CanDeactivate` guard
 *   blocked, or a newer navigation superseded this one) → `false`
 * - rejected (`NavigationError` - guard/resolver threw) → `false`
 *
 * Routed tabs reuse the presenter's commit lifecycle verbatim - the
 * router navigation is simply the async op. \
 * In pessimistic mode the active tab follows the *resolved* route, so a cancelled guard keeps
 * the old tab with zero extra gate machinery. Correlating on the
 * promise (not `router.events`) means a concurrent unrelated
 * navigation's outcome can never resolve this commit; the commit
 * controller's `cancel()` closes the subscriber on supersede, and a
 * late promise resolution lands on the closed subscriber and is
 * dropped by RxJS itself.
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
      // Resolve from THIS call's promise - correlated by construction.
      // A take(1) on router.events would grab the first terminal event
      // of ANY navigation, so a concurrent unrelated navigation could
      // resolve this commit with a foreign outcome.
      opts.router.navigate(routeFor(target)).then(
        (result) => {
          // `false` is a cancelled or superseded navigation. A skipped
          // same-URL navigation resolves `null` - the tab's route is
          // already active, which commits.
          subscriber.next(result !== false);
          subscriber.complete();
        },
        () => {
          subscriber.next(false);
          subscriber.complete();
        },
      );
    });
}
