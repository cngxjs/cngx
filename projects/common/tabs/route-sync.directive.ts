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
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { CNGX_TABS_COMMIT_ACTION, type CngxTabsCommitActionSource } from './commit-action.token';
import { cngxDefaultTabRoute, createTabRouterCommit } from './router-commit';
import { warnTabsRouterAbsent } from './router-absent-warning';
import { CNGX_TAB_GROUP_HOST, type CngxTabHandle } from './tab-group-host.token';
import type { CngxTabsCommitAction } from './presenter.directive';

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

  private readonly host = inject(CNGX_TAB_GROUP_HOST, { host: true });
  private readonly router = inject(Router, { optional: true });

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
   * Find the tab whose route is the trailing segment(s) of the current
   * URL path. Anchors on position (a suffix match), not a loose
   * "appears anywhere" scan - a tab id that happens to equal an
   * unrelated parent segment cannot win. The path is taken before any
   * query/fragment. If two tabs produce the same trailing segment(s)
   * (only possible with a custom `routeFor` that collides), the first
   * registered tab wins - the default id-based mapping never collides.
   */
  private readActiveId(router: Router): string | null {
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
}
