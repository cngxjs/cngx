import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  untracked,
  type AfterContentInit,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { warnTabsRouterAbsent } from './router-absent-warning';
import { CNGX_TAB_GROUP_HOST } from './tab-group-host.token';

/**
 * URL deep-linking for tab groups. \
 * Bidirectional sync between `activeId` and a URL fragment or query-param. Opt-in via
 * `[cngxTabsFragmentSync]` on the presenter element.
 *
 * - `mode = 'fragment'` (default) → `#tab=settings`
 * - `mode = 'queryParam'` with `paramName = 'tab'` → `?tab=settings`
 *
 * Reflecting the active tab replaces the current history entry by
 * default, so browser-back leaves the page instead of stepping through
 * the tabs opened on the way. Set `[replaceUrl]="false"` when the tabs
 * read as distinct destinations.
 *
 * `Router` is optional - without it the directive logs a dev warning
 * via `afterNextRender` and becomes a no-op. \
 * Every `router.navigate` and `host.selectById` inside the effects sits in `untracked()`.
 *
 * ```html
 * <!-- Default fragment mode: the active tab reflects to #tab=<id>, and a
 *      deep link like /account#tab=settings selects that tab on load. -->
 * <cngx-tab-group cngxTabsFragmentSync>
 *   <div cngxTab id="overview" label="Overview"></div>
 *   <div cngxTab id="settings" label="Settings"></div>
 * </cngx-tab-group>
 *
 * <!-- Query-param mode with a custom name -> ?section=settings -->
 * <cngx-tab-group cngxTabsFragmentSync mode="queryParam" paramName="section">
 *   <!-- ...tabs... -->
 * </cngx-tab-group>
 * ```
 *
 * @category common/tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/router-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroupPresenter, CngxTab
 */
@Directive({
  selector: '[cngxTabsFragmentSync]',
  exportAs: 'cngxTabsFragmentSync',
  standalone: true,
})
export class CngxTabsFragmentSync implements AfterContentInit {
  readonly mode = input<'fragment' | 'queryParam'>('fragment');
  readonly paramName = input<string>('tab');

  /**
   * Whether reflecting the active tab into the URL replaces the current
   * history entry instead of pushing a new one. Default `true`, which is
   * right for a view toggle: browser-back leaves the page rather than
   * stepping through the tabs the user opened on the way.
   *
   * Set `false` when the tabs read as distinct destinations and back
   * should step between them. Note that every tab switch then costs a
   * history entry.
   */
  readonly replaceUrl = input(true);

  private readonly host = inject(CNGX_TAB_GROUP_HOST, { host: true });
  private readonly router = inject(Router, { optional: true });

  /**
   * Latched once the URL seed has reached a registered tab, so the
   * `afterNextRender` fallback cannot run it twice.
   *
   * Not symmetric with {@link CngxTabsRouteSync}, and it has to be: that
   * sibling writes `activeIndex` directly, so its second seed bails on
   * the already-matching id. This one goes through `select()`, and under
   * a pessimistic commit `activeIndex` still holds the *previous* value
   * while the action is in flight - so the presenter's `target ===
   * previous` bail does not catch the repeat, and a consumer's async
   * commit action would fire a second time and supersede the first.
   */
  private seeded = false;

  constructor() {
    if (!this.router) {
      afterNextRender(() => warnTabsRouterAbsent('CngxTabsFragmentSync', 'deep-linking'));
      return;
    }
    const router = this.router;
    const destroyRef = inject(DestroyRef);

    // Fallback seed for tabs that register after content-init (a
    // dynamic @for over an async list). Idempotent against the
    // content-init seed: selectById is a no-op when the id is already
    // active.
    afterNextRender(() => {
      this.seedFromUrl(router);
    });

    effect(() => {
      const id = this.host.activeId();
      if (!id) {
        return;
      }
      untracked(() => {
        const replaceUrl = this.replaceUrl();
        const navigation =
          this.mode() === 'fragment'
            ? router.navigate([], {
                fragment: `${this.paramName()}=${id}`,
                queryParamsHandling: 'merge',
                replaceUrl,
              })
            : router.navigate([], {
                queryParams: { [this.paramName()]: id },
                queryParamsHandling: 'merge',
                replaceUrl,
              });
        // Router rejection (e.g. cancelled navigation) has no recovery path.
        navigation.catch?.(() => undefined);
      });
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
      untracked(() => {
        const next = this.readUrlValue(router);
        if (next && next !== this.host.activeId()) {
          this.host.selectById(next);
        }
      });
    });
  }

  /**
   * Seed from the URL before the group renders its panels. `CngxTab`
   * registers in `ngOnInit`, so the registry is populated by the time
   * this runs, and the group's own view has not rendered yet - which is
   * what keeps `panelMode="lazy"` from counting the default tab's first
   * render as its first activation on a deep link.
   *
   * Unlike {@link CngxTabsRouteSync}, this seed goes through
   * `selectById`, so it runs `select()` and any consumer-bound
   * commit-action. Moving it earlier therefore also moves when that
   * action first fires; it still fires exactly once for the seed.
   *
   * Its own router guard: the constructor's early return does not stop
   * lifecycle hooks from running.
   */
  ngAfterContentInit(): void {
    if (!this.router) {
      return;
    }
    this.seedFromUrl(this.router);
  }

  private seedFromUrl(router: Router): void {
    if (this.seeded) {
      return;
    }
    const initial = this.readUrlValue(router);
    if (!initial) {
      return;
    }
    // Only latch once the target is actually registered. A seed that
    // found no matching tab leaves the fallback armed for tabs that
    // register after content-init.
    if (!this.host.tabs().some((tab) => tab.id === initial)) {
      return;
    }
    this.seeded = true;
    untracked(() => this.host.selectById(initial));
  }

  private readUrlValue(router: Router): string | null {
    if (this.mode() === 'fragment') {
      const fragment = router.routerState.snapshot.root.fragment ?? '';
      return this.parseFragment(fragment);
    }
    return router.routerState.snapshot.root.queryParamMap.get(this.paramName()) ?? null;
  }

  private parseFragment(fragment: string): string | null {
    const param = this.paramName();
    const segments = fragment.split('&');
    for (const seg of segments) {
      const [key, val] = seg.split('=');
      if (key === param && val) {
        return val;
      }
    }
    return null;
  }
}
