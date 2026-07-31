import { InjectionToken } from '@angular/core';
import type { ActivatedRoute, Router, UrlSegmentGroup, UrlTree } from '@angular/router';

import type { CngxTabHandle } from './tab-group-host.token';

/**
 * How a tab's route is compared against the current URL.
 *
 * - `'suffix'` - the tab owns the trailing segment(s), the leaf semantics
 *   a `role="tablist"` implies.
 * - `'prefix'` - the tab owns a subtree, the section semantics a
 *   `role="navigation"` of links implies.
 *
 * @category common/tabs
 */
export type CngxTabMatchMode = 'suffix' | 'prefix';

/**
 * Everything {@link CngxTabUrlMatch} needs to resolve the active tab.
 * Passed in rather than injected, so the strategy stays a pure function
 * of its inputs and needs no injection context.
 *
 * @category common/tabs
 */
export interface CngxTabUrlMatchContext {
  readonly router: Router;

  /** The sync directive's mount point. `null` outside a routed tree. */
  readonly activatedRoute: ActivatedRoute | null;

  /** Registered tabs, in registration order. */
  readonly tabs: readonly CngxTabHandle[];

  /** The directive's `routeFor`, already resolved. */
  readonly routeFor: (handle: CngxTabHandle) => unknown[];

  /** Effective mode after the input / config / host-flavour cascade. */
  readonly mode: CngxTabMatchMode;
}

/**
 * Resolves which registered tab the current URL belongs to.
 *
 * @category common/tabs
 */
export interface CngxTabUrlMatch {
  /** Active tab id, or `null` when the URL is outside this tab set. */
  resolve(ctx: CngxTabUrlMatchContext): string | null;
}

/** Factory shape overrides must match. @category common/tabs */
export type CngxTabUrlMatchFactory = () => CngxTabUrlMatch;

/**
 * Path-segment count of a resolved `UrlTree`, used to rank prefix
 * matches: `/rounds/explorer` outranks `/rounds` on a URL both match.
 */
function urlTreeSegmentCount(tree: UrlTree): number {
  let count = 0;
  const walk = (group: UrlSegmentGroup): void => {
    count += group.segments.length;
    for (const key of Object.keys(group.children)) {
      walk(group.children[key]);
    }
  };
  walk(tree.root);
  return count;
}

/**
 * Find the tab whose route is the trailing segment(s) of the current URL
 * path. Anchors on position, not a loose "appears anywhere" scan - a tab
 * id that happens to equal an unrelated parent segment cannot win. The
 * path is taken before any query/fragment. If two tabs produce the same
 * trailing segment(s) (only possible with a colliding custom `routeFor`),
 * the first registered tab wins; the default id-based mapping never
 * collides.
 */
function resolveBySuffix(ctx: CngxTabUrlMatchContext): string | null {
  const path = ctx.router.url.split(/[?#]/)[0];
  const segments = path.split('/').filter(Boolean);
  for (const tab of ctx.tabs) {
    const route = ctx.routeFor(tab).map((command) => String(command));
    if (route.length === 0 || route.length > segments.length) {
      continue;
    }
    const tail = segments.slice(-route.length);
    if (tail.every((segment, i) => segment === route[i])) {
      return tab.id;
    }
  }
  return null;
}

/**
 * Find the tab that owns the current URL's subtree: the one whose
 * resolved `UrlTree` is a subset of the active tree, ignoring query
 * params, fragment, and matrix params.
 *
 * Routes resolve `{ relativeTo: ActivatedRoute }` rather than against the
 * URL root. A root-anchored segment compare breaks a nav mounted under a
 * base path - at `/app/rounds` a `['rounds']` route would compare
 * `'app' === 'rounds'`, resolve `null`, and hand the first link a wrong
 * `aria-current`, which is the exact defect prefix mode exists to fix.
 * Relative resolution is safe on the read side because the nav path is
 * commit-free: links navigate through their own `routerLink`, so nothing
 * here can diverge from a commit navigation.
 *
 * Longest route wins, so a `/rounds` tab cannot shadow `/rounds/explorer`
 * in the same set.
 */
function resolveByPrefix(ctx: CngxTabUrlMatchContext): string | null {
  let winner: string | null = null;
  let winnerDepth = -1;
  for (const tab of ctx.tabs) {
    const route = ctx.routeFor(tab);
    if (route.length === 0) {
      continue;
    }
    const tree = ctx.router.createUrlTree(route, { relativeTo: ctx.activatedRoute });
    const active = ctx.router.isActive(tree, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
    if (!active) {
      continue;
    }
    const depth = urlTreeSegmentCount(tree);
    if (depth > winnerDepth) {
      winner = tab.id;
      winnerDepth = depth;
    }
  }
  return winner;
}

/**
 * The two URL-matching policies `[cngxTabsRouteSync]` ships, dispatched
 * on {@link CngxTabUrlMatchContext.mode}. Same exact-versus-prefix
 * distinction `routerLinkActive` draws.
 *
 * Pure: no injection context, no signal reads. The directive resolves the
 * mode cascade and the tab registry, then hands both in.
 *
 * @category common/tabs
 */
export function createTabUrlMatch(): CngxTabUrlMatch {
  return {
    resolve(ctx: CngxTabUrlMatchContext): string | null {
      return ctx.mode === 'prefix' ? resolveByPrefix(ctx) : resolveBySuffix(ctx);
    },
  };
}

/**
 * Swap point for how a routed tab set decides which tab the URL belongs
 * to. Default {@link createTabUrlMatch}.
 *
 * Override when neither shipped policy fits: locale-segment-insensitive
 * comparison (`/de/rounds` and `/en/rounds` are the same tab), matching
 * on a route `data` key instead of the path, or a permission-aware read
 * that skips tabs the user cannot open. `routeFor` only changes what a
 * tab's route *is*; this changes how it is *compared*.
 *
 * Mirrors {@link CNGX_TABS_COMMIT_ACTION} on the write side: the
 * navigation a tab switch performs is already swappable, so the read that
 * mirrors navigation back onto `activeIndex` should be too.
 *
 * @category common/tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/url-match.ts
 * @since 0.1.0
 * @relatedTo CngxTabsRouteSync, createTabUrlMatch, createTabRouterCommit
 */
export const CNGX_TAB_URL_MATCH_STRATEGY = new InjectionToken<CngxTabUrlMatch>(
  'CngxTabUrlMatchStrategy',
  {
    providedIn: 'root',
    factory: () => createTabUrlMatch(),
  },
);
