import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavigationEnd, provideRouter, Router, RouterOutlet } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxBreadcrumbBar } from './breadcrumb-bar.component';
import { CngxBreadcrumbRouterSync } from './breadcrumb-router-sync.directive';
import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

@Component({ standalone: true, template: '' })
class Blank {}

@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class Shell {}

const FALLBACK: readonly CngxBreadcrumbCrumb[] = [{ label: 'Fallback', href: '/fallback' }];

@Component({
  standalone: true,
  selector: 'router-host',
  imports: [CngxBreadcrumbBar, CngxBreadcrumbRouterSync, RouterOutlet],
  template: `
    <cngx-breadcrumb cngxRouterSync [items]="fallback" />
    <router-outlet />
  `,
})
class RouterHost {
  readonly fallback = FALLBACK;
}

@Component({
  standalone: true,
  selector: 'no-router-host',
  imports: [CngxBreadcrumbBar, CngxBreadcrumbRouterSync],
  template: `<cngx-breadcrumb cngxRouterSync />`,
})
class NoRouterHost {}

// Drains pending microtasks so the router's NavigationEnd propagates through
// toSignal before assertions. whenStable() has been observed to hang under
// Node 20 + zoneless tests with Router in providers (mirrors the tabs spec).
async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

describe('CngxBreadcrumbRouterSync', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function labels(barEl: HTMLElement): (string | undefined)[] {
    return Array.from(barEl.querySelectorAll<HTMLAnchorElement>('a.cngx-breadcrumb__link')).map(
      (a) => a.textContent?.trim(),
    );
  }

  async function mountRouted(): Promise<{
    fixture: ReturnType<typeof TestBed.createComponent<RouterHost>>;
    router: Router;
    directive: CngxBreadcrumbRouterSync;
    barEl: HTMLElement;
  }> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'catalog', component: Blank, data: { breadcrumb: 'Catalog' } },
          { path: 'settings', component: Blank, data: { breadcrumb: 'Settings' } },
        ]),
      ],
    });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(RouterHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;
    const directive = fixture.debugElement
      .query(By.directive(CngxBreadcrumbRouterSync))
      .injector.get(CngxBreadcrumbRouterSync);
    return { fixture, router, directive, barEl };
  }

  it('renders the router-derived trail through CNGX_BREADCRUMB_ITEMS_SOURCE, winning over [items]', async () => {
    const { fixture, router, barEl } = await mountRouted();

    await router.navigateByUrl('/catalog');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(labels(barEl)).toEqual(['Catalog']);
  });

  it('updates the trail on navigation', async () => {
    const { fixture, router, barEl } = await mountRouted();

    await router.navigateByUrl('/catalog');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();
    expect(labels(barEl)).toEqual(['Catalog']);

    await router.navigateByUrl('/settings');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();
    expect(labels(barEl)).toEqual(['Settings']);
  });

  it('keeps the same crumbs() reference for a same-shape navigation, and swaps it for a different one', async () => {
    const { router, directive } = await mountRouted();

    await router.navigateByUrl('/catalog');
    await flushMicrotasks();
    const first = directive.crumbs();

    // A NavigationEnd that resolves to the identical trail must not cascade:
    // the shape-based equal keeps the previous array reference.
    (router.events as unknown as { next: (e: unknown) => void }).next?.(
      new NavigationEnd(2, '/catalog', '/catalog'),
    );
    await flushMicrotasks();
    expect(directive.crumbs()).toBe(first);

    // A genuine route change produces a new reference.
    await router.navigateByUrl('/settings');
    await flushMicrotasks();
    const second = directive.crumbs();
    expect(second).not.toBe(first);
    expect(second.map((c) => c.label)).toEqual(['Settings']);
  });

  it('collapses a segment-less child route so the trail never emits a duplicate href (NG0955 guard)', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: 'docs',
            component: Shell,
            data: { breadcrumb: 'Docs' },
            children: [{ path: '', component: Blank, data: { breadcrumb: 'Overview' } }],
          },
        ]),
      ],
    });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(RouterHost);
    fixture.detectChanges();
    await flushMicrotasks();

    // Both routes carry a breadcrumb but the '' child adds no segment, so both
    // resolve to /docs. Without the collapse guard the @for track key would
    // duplicate and throw NG0955 during this change detection.
    await router.navigateByUrl('/docs');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb'))
      .nativeElement as HTMLElement;
    expect(labels(barEl)).toEqual(['Overview']);
    const directive = fixture.debugElement
      .query(By.directive(CngxBreadcrumbRouterSync))
      .injector.get(CngxBreadcrumbRouterSync);
    expect(directive.crumbs().map((c) => c.href)).toEqual(['/docs']);
  });

  it('is a graceful no-op (empty source) when Router is not provided', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    // The directive emits a one-shot afterNextRender dev warning here; it is not
    // asserted (the render hook does not deterministically flush for a directive
    // on the OnPush bar host - same reason the tabs router-sync spec asserts the
    // no-op, not the warn). Spy only to keep the console clean.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let directive!: CngxBreadcrumbRouterSync;
    expect(() => {
      const fixture = TestBed.createComponent(NoRouterHost);
      fixture.detectChanges();
      directive = fixture.debugElement
        .query(By.directive(CngxBreadcrumbRouterSync))
        .injector.get(CngxBreadcrumbRouterSync);
    }).not.toThrow();

    expect(directive.crumbs()).toEqual([]);
    warnSpy.mockRestore();
  });
});
