import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  type UrlSegmentGroup,
  type UrlTree,
} from '@angular/router';
import { filter } from 'rxjs/operators';

import { CNGX_TABS_COMMIT_ACTION, type CngxTabsCommitActionSource } from './commit-action.token';
import { cngxDefaultTabRoute, createTabRouterCommit } from './router-commit';
import { warnTabsRouterAbsent } from './router-absent-warning';
import { CNGX_TAB_GROUP_HOST, type CngxTabHandle } from './tab-group-host.token';
import { CNGX_TAB_NAV_HOST } from './tab-nav-host.token';
import type { CngxTabsCommitAction } from './presenter.directive';

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
 * Router-outlet integration for tab groups. \
 * Opt-in via `[cngxTabsRouteSync]` on the presenter element. Each tab is an
 * Angular child route whose component renders into a `<router-outlet>`;
 * switching tabs navigates, and a `CanDeactivate` guard can gate the
 * leave.
 *
 * Supplies the presenter's commit-action through the
 * {@link CNGX_TABS_COMMIT_ACTION} DI fallback (no consumer
 * `[commitAction]` hand-binding) and pins **pessimistic** mode so the
 * active tab follows the *resolved* route - a guard-cancelled switch
 * keeps the old tab. The routing gate reuses the presenter's commit
 * lifecycle verbatim; the router navigation is the async op.
 *
 * Seeds the active tab from the current URL on mount and reflects
 * external navigations (back/forward, direct URL) into `activeIndex`
 * *without* re-navigating - those writes bypass the commit-action,
 * since the router is already at the resolved route.
 *
 * **Two URL-matching modes, defaulted from the host flavour.** On a
 * `<cngx-tab-group>` tablist each tab is a *leaf* route, so the default
 * is `'suffix'`: a tab owns the trailing segment(s) of the URL and
 * nothing else. On a `<cngx-tab-nav>` (or `[cngxMatTabNav]`) each link is
 * an application *section* that owns a whole subtree, so the default
 * flips to `'prefix'` and the section stays current for every URL beneath
 * it - the non-exact flavour of `routerLinkActive`. The flavour is read
 * from the {@link CNGX_TAB_NAV_HOST} marker the nav organisms provide, so
 * neither default needs a consumer flag; `[match]` overrides both for the
 * mixed case.
 *
 * `Router` is optional - without it the directive logs a single dev
 * warning via `afterNextRender`, exposes a null action, and becomes a
 * no-op. Mirrors {@link CngxTabsFragmentSync}; every `activeIndex`
 * write inside an effect sits in `untracked()`.
 *
 * **The mental model.** It turns the tab group into the router's view
 * switcher: the tabs choose *which child route* renders in the
 * `<router-outlet>`, not which inline template shows. \
 * Concretely, a Settings page with Profile / Security / Billing tabs then gets, for
 * free: each tab its own URL (`/settings/profile`) so a refresh or a
 * shared link stays on the tab; browser back/forward between tabs;
 * `Billing` lazy-loading its chunk only when first opened; and `Profile`
 * blocking the switch via a `CanDeactivate` guard while its form is
 * dirty - all while keeping the `role="tab"` keyboard and ARIA model.
 *
 * **Use it when** each tab's content is a real Angular route - a lazy
 * chunk, a resolver, or a `CanActivate` / `CanDeactivate` guard -
 * rendered into a `<router-outlet>`, and you want browser back/forward
 * and deep links to move between tabs while the route's own guard gates
 * the switch (e.g. an unsaved-changes prompt on leave). \
 * If the tabs are purely visual, use a plain `<cngx-tab-group>` with no sync directive;
 * if you only want the active tab reflected in the URL while content
 * stays inline, use {@link CngxTabsFragmentSync}.
 *
 * **What this is not.** \
 * Not a per-tab `routerLink`: \
 * the tabs stay `role="tab"` buttons and the directive drives `router.navigate`
 * centrally through the commit lifecycle, so there are no anchors, no
 * `href`, and no native open-in-new-tab / middle-click / copy-link. \
 * For real link semantics (right-click, ctrl-click) reach for the CNGX
 * `<cngx-tab-nav>` and `<a cngx-tab-link routerLink>` variant
 * instead. \
 * Not URL deep-linking either - that is {@link CngxTabsFragmentSync} (a `#tab=` fragment or `?tab=`
 * query-param); this directive renders child route *components* into a
 * `<router-outlet>`. \
 * And not optimistic: the active tab moves only once
 * the route resolves, so a `CanDeactivate` guard can cancel the switch.
 *
 * ```ts
 * // Each tab is a child route; the editor guards its own exit.
 * const ROUTES: Routes = [
 *   { path: '', pathMatch: 'full', redirectTo: 'editor' },
 *   { path: 'editor', component: EditorPage, canDeactivate: [unsavedChangesGuard] },
 *   { path: 'preview', component: PreviewPage },
 *   { path: 'settings', component: SettingsPage },
 * ];
 * ```
 *
 * ```html
 * <!-- Tab ids match the child segments (default routeFor = (h) => [h.id]).
 *      Switching a tab navigates; the guard gates leaving the editor;
 *      back/forward and /account/settings deep links move the active tab. -->
 * <cngx-tab-group cngxTabsRouteSync aria-label="Account">
 *   <div cngxTab id="editor" label="Editor"></div>
 *   <div cngxTab id="preview" label="Preview"></div>
 *   <div cngxTab id="settings" label="Settings"></div>
 * </cngx-tab-group>
 *
 * <!-- The active tab's routed component renders here. -->
 * <router-outlet></router-outlet>
 * ```
 *
 * @category common/tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/route-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroupPresenter, CngxTabsFragmentSync, createTabRouterCommit, CngxTabNav, CngxTabLink
 */
@Directive({
  selector: '[cngxTabsRouteSync]',
  exportAs: 'cngxTabsRouteSync',
  standalone: true,
  providers: [{ provide: CNGX_TABS_COMMIT_ACTION, useExisting: CngxTabsRouteSync }],
})
export class CngxTabsRouteSync implements CngxTabsCommitActionSource {
  /**
   * Maps a tab handle to its router command array. Default
   * `(handle) => [handle.id]` - the tab id is the child segment.
   * Override for real route paths.
   */
  readonly routeFor = input<(handle: CngxTabHandle) => unknown[]>(cngxDefaultTabRoute);

  /**
   * How a tab's route is matched against the current URL.
   *
   * - `'suffix'` - the tab owns the trailing segment(s). A leaf tab in a
   *   tablist: `/settings/billing` activates the `billing` tab, and
   *   `/billing/invoices/42` activates nothing.
   * - `'prefix'` - the tab owns a subtree. A section link in a nav:
   *   `/rounds/explorer` activates the `rounds` link. Matching is a
   *   `UrlTree` subset test anchored at the host's own `ActivatedRoute`,
   *   so a nav mounted under a base path still resolves. When several
   *   tabs match, the one with the most path segments wins.
   *
   * Unset (the default) resolves from the host flavour: `'prefix'` when
   * {@link CNGX_TAB_NAV_HOST} is present, `'suffix'` otherwise.
   */
  readonly match = input<'suffix' | 'prefix' | undefined>(undefined);

  private readonly host = inject(CNGX_TAB_GROUP_HOST, { host: true });
  private readonly router = inject(Router, { optional: true });
  private readonly navHost = inject(CNGX_TAB_NAV_HOST, { optional: true, host: true });
  private readonly activatedRoute = inject(ActivatedRoute, { optional: true });

  /**
   * Pessimistic-only - not exposed as an input. The route-sync owns the
   * mode so optimistic (show-then-revert) can never flash the target
   * tab before a `CanDeactivate` guard decides.
   */
  readonly mode: Signal<'optimistic' | 'pessimistic'> = signal('pessimistic');

  /**
   * Router commit-action read by the presenter via the DI fallback.
   * `null` when no `Router` is available (graceful no-op). Rebuilt only
   * when `routeFor` changes; the navigation gate itself is the async
   * op inside the action.
   */
  readonly action: Signal<CngxTabsCommitAction | null> = computed(() => {
    const router = this.router;
    if (!router) {
      return null;
    }
    return createTabRouterCommit({
      router,
      tabs: this.host.tabs,
      routeFor: this.routeFor(),
    });
  });

  constructor() {
    if (!this.router) {
      afterNextRender(() => warnTabsRouterAbsent('CngxTabsRouteSync', 'routed tabs'));
      return;
    }
    const router = this.router;
    const destroyRef = inject(DestroyRef);

    // Seed from the current URL once the registry has populated.
    afterNextRender(() => {
      untracked(() => this.reflectFromUrl(router));
    });

    const navEnd = toSignal(
      router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      ),
      { initialValue: null },
    );
    effect(() => {
      const e = navEnd();
      if (!e) {
        return;
      }
      untracked(() => this.reflectFromUrl(router));
    });
  }

  /**
   * Mirror the URL's active tab onto `activeIndex` without navigating.
   * Writing the index directly (not via `select()`) is the re-entry
   * guard: `select()` would re-run the commit-action and navigate to
   * the route the router is already on, leaving the commit pending
   * forever.
   */
  private reflectFromUrl(router: Router): void {
    const next = this.readActiveId(router);
    if (!next || next === this.host.activeId()) {
      return;
    }
    const index = this.host.tabs().findIndex((t) => t.id === next);
    if (index >= 0) {
      this.host.activeIndex.set(index);
    }
  }

  /**
   * Find the tab the current URL belongs to, under the effective match
   * mode. Same exact-versus-prefix distinction `routerLinkActive` draws:
   * a tablist tab is a leaf and matches only its own route, a nav link is
   * a section and matches everything beneath it. `null` means the URL is
   * outside this tab set, in either mode.
   */
  private readActiveId(router: Router): string | null {
    const mode = this.match() ?? (this.navHost ? 'prefix' : 'suffix');
    return mode === 'prefix' ? this.readActiveIdByPrefix(router) : this.readActiveIdBySuffix(router);
  }

  /**
   * Find the tab whose route is the trailing segment(s) of the current
   * URL path. Anchors on position, not a loose "appears anywhere" scan -
   * a tab id that happens to equal an unrelated parent segment cannot
   * win. The path is taken before any query/fragment. If two tabs produce
   * the same trailing segment(s) (only possible with a custom `routeFor`
   * that collides), the first registered tab wins - the default id-based
   * mapping never collides.
   */
  private readActiveIdBySuffix(router: Router): string | null {
    const path = router.url.split(/[?#]/)[0];
    const segments = path.split('/').filter(Boolean);
    const routeFor = this.routeFor();
    for (const tab of this.host.tabs()) {
      const route = routeFor(tab).map((command) => String(command));
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
   * Find the tab that owns the current URL's subtree: the tab whose
   * resolved `UrlTree` is a subset of the active one, ignoring query
   * params, fragment, and matrix params.
   *
   * Routes resolve `{ relativeTo: ActivatedRoute }` rather than against
   * the URL root. A root-anchored segment compare would break a nav
   * mounted under a base path - at `/app/rounds` a `['rounds']` route
   * would compare `'app' === 'rounds'`, resolve `null`, and hand the
   * first link a wrong `aria-current`, which is the exact defect prefix
   * mode exists to fix. Relative resolution is safe on the read side
   * because the nav path is commit-free: links navigate through their own
   * `routerLink`, so nothing here can diverge from a commit navigation.
   *
   * Longest route wins, so a `/rounds` tab cannot shadow a
   * `/rounds/explorer` tab in the same set.
   */
  private readActiveIdByPrefix(router: Router): string | null {
    const routeFor = this.routeFor();
    let winner: string | null = null;
    let winnerDepth = -1;
    for (const tab of this.host.tabs()) {
      const route = routeFor(tab);
      if (route.length === 0) {
        continue;
      }
      const tree = router.createUrlTree(route, { relativeTo: this.activatedRoute });
      const active = router.isActive(tree, {
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
}
