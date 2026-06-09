import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxTabGroupPresenter } from './presenter.directive';
import { CngxTabsRouteSync } from './route-sync.directive';
import { CngxTab } from './tab.directive';

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
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
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

    emit(router, new NavigationCancel(1, '/b', 'blocked by CanDeactivate'));
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
    emit(router, new NavigationEnd(1, '/b', '/b'));
    fixture.detectChanges();
    await flushMicrotasks();

    expect(presenter.activeIndex()).toBe(1);
  });
});
