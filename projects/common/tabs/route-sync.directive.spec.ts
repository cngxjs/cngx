import { Component, provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  NavigationEnd,
  provideRouter,
  Router,
  RouterOutlet,
  type Routes,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxTabGroupPresenter } from './presenter.directive';
import { provideTabsConfig, withTabsRouteMatch } from './tabs-config';
import { CNGX_TAB_URL_MATCH_STRATEGY, type CngxTabUrlMatch } from './url-match';
import { CngxTabsRouteSync } from './route-sync.directive';
import { CNGX_TAB_NAV_HOST } from './tab-nav-host.token';
import { CngxTab } from './tab.directive';
import { CngxTabLink } from './tab-link.directive';

@Component({
  standalone: true,
  selector: 'route-host',
  imports: [CngxTab],
  hostDirectives: [CngxTabGroupPresenter, CngxTabsRouteSync],
  template: `
    <div cngxTab id="a" [label]="'A'"></div>
    <div cngxTab id="b" [label]="'B'"></div>
    <div cngxTab id="c" [label]="'C'"></div>
  `,
})
class RouteHost {}

@Component({
  standalone: true,
  selector: 'nested-route-host',
  imports: [CngxTab],
  hostDirectives: [
    CngxTabGroupPresenter,
    { directive: CngxTabsRouteSync, inputs: ['routeFor'] },
  ],
  template: `
    <div cngxTab id="a" [label]="'A'"></div>
    <div cngxTab id="b" [label]="'B'"></div>
    <div cngxTab id="c" [label]="'C'"></div>
  `,
})
class NestedRouteHost {}

// The native nav-link host: tabs register via CngxTabLink, the links
// navigate natively (no select() caller), and route-sync only reflects.
@Component({
  standalone: true,
  selector: 'nav-link-route-host',
  imports: [CngxTabLink],
  hostDirectives: [CngxTabGroupPresenter, CngxTabsRouteSync],
  template: `
    <a cngxTabLink id="a" [label]="'A'"></a>
    <a cngxTabLink id="b" [label]="'B'"></a>
    <a cngxTabLink id="c" [label]="'C'"></a>
  `,
})
class NavLinkRouteHost {}

@Component({ standalone: true, selector: 'blank-page', template: '' })
class BlankPage {}

// Tabs must be CONTENT children for ngAfterContentInit to see them
// registered - a host whose own template declares the tabs makes them
// view children, which register too late and let the afterNextRender
// fallback silently stand in for the seam under test.
@Component({
  standalone: true,
  selector: 'route-seed-shell',
  hostDirectives: [CngxTabGroupPresenter, CngxTabsRouteSync],
  template: '<ng-content />',
})
class RouteSeedShell {}

@Component({
  standalone: true,
  selector: 'projected-route-host',
  imports: [RouteSeedShell, CngxTab],
  template: `
    <route-seed-shell>
      <div cngxTab id="a" [label]="'A'"></div>
      <div cngxTab id="b" [label]="'B'"></div>
      <div cngxTab id="c" [label]="'C'"></div>
    </route-seed-shell>
  `,
})
class ProjectedRouteHost {}

// The nav flavour: provides the marker token, so route-sync defaults to
// prefix matching. Mirrors what <cngx-tab-nav> / [cngxMatTabNav] declare.
@Component({
  standalone: true,
  selector: 'section-nav-host',
  imports: [CngxTabLink],
  providers: [{ provide: CNGX_TAB_NAV_HOST, useValue: true }],
  hostDirectives: [
    CngxTabGroupPresenter,
    { directive: CngxTabsRouteSync, inputs: ['routeFor', 'match'] },
  ],
  template: `
    <a cngxTabLink id="overview" [label]="'Overview'"></a>
    <a cngxTabLink id="rounds" [label]="'Rounds'"></a>
  `,
})
class SectionNavHost {}

// Same flavour, but with a nested tab whose route is a strict extension
// of a sibling's - the longest-match case.
@Component({
  standalone: true,
  selector: 'overlapping-nav-host',
  imports: [CngxTabLink],
  providers: [{ provide: CNGX_TAB_NAV_HOST, useValue: true }],
  hostDirectives: [
    CngxTabGroupPresenter,
    { directive: CngxTabsRouteSync, inputs: ['routeFor'] },
  ],
  template: `
    <a cngxTabLink id="rounds" [label]="'Rounds'"></a>
    <a cngxTabLink id="explorer" [label]="'Explorer'"></a>
  `,
})
class OverlappingNavHost {}

// Mounted under a base path: the nav is the routed component at /app, so
// its ActivatedRoute is the mount point the tab routes resolve against.
@Component({
  standalone: true,
  selector: 'section-nav-shell',
  imports: [CngxTabLink, RouterOutlet],
  providers: [{ provide: CNGX_TAB_NAV_HOST, useValue: true }],
  hostDirectives: [CngxTabGroupPresenter, CngxTabsRouteSync],
  template: `
    <a cngxTabLink id="overview" [label]="'Overview'"></a>
    <a cngxTabLink id="rounds" [label]="'Rounds'"></a>
    <router-outlet />
  `,
})
class SectionNavShell {}

// The tablist twin of SectionNavHost: identical tab set, no marker token,
// so the suffix default applies.
@Component({
  standalone: true,
  selector: 'section-tab-host',
  imports: [CngxTab],
  hostDirectives: [CngxTabGroupPresenter, CngxTabsRouteSync],
  template: `
    <div cngxTab id="overview" [label]="'Overview'"></div>
    <div cngxTab id="rounds" [label]="'Rounds'"></div>
  `,
})
class SectionTabHost {}

const SECTION_ROUTES: Routes = [
  { path: 'overview', component: BlankPage },
  { path: 'rounds', component: BlankPage, children: [{ path: 'explorer', component: BlankPage }] },
  { path: 'elsewhere', component: BlankPage },
];

// Drains pending microtasks so afterNextRender / effect chains settle.
// Mirrors the fragment-sync spec - whenStable() has been observed to
// hang under Node 20 + zoneless tests with Router in providers.
async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

function emit(router: Router, event: unknown): void {
  (router.events as unknown as { next: (e: unknown) => void }).next(event);
}

describe('CngxTabsRouteSync', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('is a graceful no-op that warns once when Router is not provided', async () => {
    // Provide Router as null explicitly: a prior provideRouter([]) in a
    // sibling spec leaks a resolvable Router into the shared vitest
    // worker, which would otherwise mask the no-Router branch.
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: Router, useValue: null }],
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const fixture = TestBed.createComponent(RouteHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    // No injected action, so the presenter falls back to plain
    // navigation and select() lands immediately.
    expect(presenter.commitAction()).toBeNull();
    presenter.select(1);
    expect(presenter.activeIndex()).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('seeds the active tab from the current URL on mount', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/c');

    const fixture = TestBed.createComponent(RouteHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    expect(presenter.activeId()).toBe('c');
    expect(presenter.activeIndex()).toBe(2);
  });

  // Coverage note: this pins that a deep link resolves by the end of the
  // first CD pass, projected content and all. It does NOT discriminate
  // content-init from the afterNextRender fallback - detectChanges()
  // flushes afterRender hooks too. The seam itself (seed lands before the
  // group's panels render) is pinned where it is observable, in the
  // panelMode="lazy" block of projects/ui/tabs/tab-group.component.spec.ts.
  it('resolves the deep-linked tab on the first change-detection pass', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/c');

    const fixture = TestBed.createComponent(ProjectedRouteHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement
      .query(By.directive(RouteSeedShell))
      .injector.get(CngxTabGroupPresenter);

    expect(presenter.activeId()).toBe('c');
  });

  it('reflects an external NavigationEnd into activeIndex without re-navigating', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const urlSpy = vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    const fixture = TestBed.createComponent(RouteHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    expect(presenter.activeIndex()).toBe(0);

    // Back/forward lands the browser on tab B; the directive must
    // mirror it onto activeIndex but NOT issue a fresh navigation.
    urlSpy.mockReturnValue('/b');
    emit(router, new NavigationEnd(1, '/b', '/b'));
    fixture.detectChanges();
    await flushMicrotasks();

    expect(presenter.activeId()).toBe('b');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('keeps the active tab when a CanDeactivate guard cancels the routed switch', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    // A guard-cancelled navigation resolves the navigate() promise false.
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(false);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    const fixture = TestBed.createComponent(RouteHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    // The routed path pins pessimistic - the active tab must not move
    // until the navigation resolves.
    expect(presenter.commitMode()).toBe('pessimistic');
    presenter.select(1);
    expect(navigateSpy).toHaveBeenCalledWith(['b']);
    expect(presenter.activeIndex()).toBe(0);

    fixture.detectChanges();
    await flushMicrotasks();

    expect(presenter.activeIndex()).toBe(0);
    expect(presenter.lastFailedIndex()).toBe(1);
  });

  it('advances the active tab when the routed switch resolves', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    const fixture = TestBed.createComponent(RouteHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    presenter.select(1);
    expect(presenter.activeIndex()).toBe(0);
    // The mocked navigate() promise resolves true - the commit lands.
    fixture.detectChanges();
    await flushMicrotasks();

    expect(presenter.activeIndex()).toBe(1);
  });

  it('resolves the routed commit-action via the DI fallback without a construction cycle', async () => {
    // Pins the lazy-injector contract: the route-sync directive provides
    // CNGX_TABS_COMMIT_ACTION via useExisting and injects the presenter as
    // its host, so eager token injection in the presenter would be NG0200.
    // Mounting both on one element must not throw and must resolve the
    // routed action + pinned pessimistic mode.
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    let fixture!: ReturnType<typeof TestBed.createComponent<RouteHost>>;
    expect(() => {
      fixture = TestBed.createComponent(RouteHost);
      fixture.detectChanges();
    }).not.toThrow();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    expect(typeof presenter.commitAction()).toBe('function');
    expect(presenter.commitMode()).toBe('pessimistic');
  });

  it('matches multi-segment routes positionally on the URL tail', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const urlSpy = vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    const fixture = TestBed.createComponent(NestedRouteHost);
    fixture.componentRef.setInput('routeFor', (h: { id: string }) => ['settings', h.id]);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    urlSpy.mockReturnValue('/settings/b');
    emit(router, new NavigationEnd(1, '/settings/b', '/settings/b'));
    fixture.detectChanges();
    await flushMicrotasks();

    expect(presenter.activeId()).toBe('b');
  });

  it('does not reflect when a tab id appears only as a non-trailing segment', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const urlSpy = vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    const fixture = TestBed.createComponent(RouteHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    expect(presenter.activeIndex()).toBe(0);

    // 'a' is a parent segment, not the active leaf - the old loose
    // `includes` match would have wrongly reflected tab 'a'.
    urlSpy.mockReturnValue('/a/detail');
    emit(router, new NavigationEnd(1, '/a/detail', '/a/detail'));
    fixture.detectChanges();
    await flushMicrotasks();

    expect(presenter.activeIndex()).toBe(0);
  });

  it('stays purely reflective on the nav-link path: NavigationEnd writes activeIndex, the commit-action never fires', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const urlSpy = vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    const fixture = TestBed.createComponent(NavLinkRouteHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    // Route-sync still pins the routed action + pessimistic mode on the
    // host, but the nav path never calls select(), so the commit lifecycle
    // lies dormant - the link's own routerLink runs CanDeactivate natively.
    expect(presenter.commitState.status()).toBe('idle');
    expect(presenter.activeIndex()).toBe(0);

    // A link navigates natively; route-sync only mirrors the landed URL.
    urlSpy.mockReturnValue('/b');
    emit(router, new NavigationEnd(1, '/b', '/b'));
    fixture.detectChanges();
    await flushMicrotasks();

    expect(presenter.activeId()).toBe('b');
    expect(presenter.activeIndex()).toBe(1);
    // Reflective only: no re-navigation, no commit transition was opened.
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(presenter.commitState.status()).toBe('idle');
  });

  describe('prefix matching on the nav flavour', () => {
    // Real routes, real navigation: prefix mode resolves through
    // router.isActive against the live UrlTree, so a mocked router.url
    // getter would not exercise it.
    function configure(routes: Routes = SECTION_ROUTES): Router {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter(routes)],
      });
      return TestBed.inject(Router);
    }

    async function mountAt<T>(
      component: Type<T>,
      url: string,
      inputs: Record<string, unknown> = {},
    ): Promise<ComponentFixture<T>> {
      await TestBed.inject(Router).navigateByUrl(url);
      const fixture = TestBed.createComponent(component);
      for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value);
      }
      fixture.detectChanges();
      await flushMicrotasks();
      return fixture;
    }

    function presenterOf(fixture: ComponentFixture<unknown>): CngxTabGroupPresenter {
      return fixture.debugElement.injector.get(CngxTabGroupPresenter);
    }

    it('resolves the owning section on a URL beneath the link', async () => {
      configure();
      const fixture = await mountAt(SectionNavHost, '/rounds/explorer');

      // The reported defect: suffix matching resolved null here and the
      // first link kept aria-current="page".
      expect(presenterOf(fixture).activeId()).toBe('rounds');
      expect(presenterOf(fixture).activeIndex()).toBe(1);
    });

    it('lets the longest matching route win so a section cannot shadow its own child', async () => {
      configure();
      const fixture = await mountAt(OverlappingNavHost, '/rounds/explorer', {
        routeFor: (h: { id: string }) => (h.id === 'explorer' ? ['rounds', 'explorer'] : ['rounds']),
      });

      expect(presenterOf(fixture).activeId()).toBe('explorer');
    });

    it('anchors matching at the nav mount point, not the URL root', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([{ path: 'app', component: SectionNavShell, children: SECTION_ROUTES }]),
        ],
      });

      const harness = await RouterTestingHarness.create('/app/rounds/explorer');
      harness.detectChanges();
      await flushMicrotasks();
      const presenter = harness.routeDebugElement!.injector.get(CngxTabGroupPresenter);

      // Root-anchored segment compare would test 'app' === 'rounds' here
      // and resolve null, reintroducing the defect for nested mounts.
      expect(presenter.activeId()).toBe('rounds');
    });

    it('agrees with suffix mode at an exact leaf URL', async () => {
      configure();
      const prefix = await mountAt(SectionNavHost, '/overview');
      expect(presenterOf(prefix).activeId()).toBe('overview');

      TestBed.resetTestingModule();
      configure();
      const suffix = await mountAt(SectionNavHost, '/overview', { match: 'suffix' });
      expect(presenterOf(suffix).activeId()).toBe('overview');
    });

    it('restores suffix matching when match="suffix" is set on a nav host', async () => {
      configure();
      const fixture = await mountAt(SectionNavHost, '/rounds/explorer', { match: 'suffix' });

      // 'rounds' is a parent segment, not the trailing one - suffix mode
      // resolves nothing and the seed leaves the first link active.
      expect(presenterOf(fixture).activeIndex()).toBe(0);
    });

    it('leaves a tablist host on the unchanged suffix default', async () => {
      configure();
      const fixture = await mountAt(SectionTabHost, '/rounds/explorer');

      expect(presenterOf(fixture).activeIndex()).toBe(0);
    });

    it('takes the match mode from the tabs config when no input is bound', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideRouter(SECTION_ROUTES),
          provideTabsConfig(withTabsRouteMatch('suffix')),
        ],
      });
      // Config beats the nav flavour; the input would beat the config.
      const fixture = await mountAt(SectionNavHost, '/rounds/explorer');
      expect(presenterOf(fixture).activeIndex()).toBe(0);
    });

    it('lets the input win over the configured match mode', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideRouter(SECTION_ROUTES),
          provideTabsConfig(withTabsRouteMatch('suffix')),
        ],
      });
      const fixture = await mountAt(SectionNavHost, '/rounds/explorer', { match: 'prefix' });
      expect(presenterOf(fixture).activeId()).toBe('rounds');
    });

    it('routes the comparison through the swappable match strategy', async () => {
      // A consumer strategy that ignores the shipped policies entirely.
      const strategy: CngxTabUrlMatch = {
        resolve: (ctx) => ctx.tabs[ctx.tabs.length - 1]?.id ?? null,
      };
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideRouter(SECTION_ROUTES),
          { provide: CNGX_TAB_URL_MATCH_STRATEGY, useValue: strategy },
        ],
      });
      const fixture = await mountAt(SectionNavHost, '/elsewhere');

      // Neither shipped mode resolves anything at /elsewhere; the override
      // does, so the directive is genuinely delegating.
      expect(presenterOf(fixture).activeId()).toBe('rounds');
    });

    it('resolves no tab for a URL outside the set, in either mode', async () => {
      configure();
      const nav = await mountAt(SectionNavHost, '/elsewhere');
      expect(presenterOf(nav).activeIndex()).toBe(0);

      TestBed.resetTestingModule();
      configure();
      const tablist = await mountAt(SectionTabHost, '/elsewhere');
      expect(presenterOf(tablist).activeIndex()).toBe(0);
    });
  });
});
