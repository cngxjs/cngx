import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  provideRouter,
  Router,
} from '@angular/router';
import type { Observable } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTabRouterCommit } from './router-commit';
import type { CngxTabHandle } from './tab-group-host.token';

function handle(id: string): CngxTabHandle {
  return {
    id,
    label: signal(id),
    subLabel: signal(undefined),
    disabled: signal(false),
    errorAggregator: signal(undefined),
    hasError: signal(false),
    errorMessage: signal(undefined),
    closable: signal(undefined),
  };
}

function emit(router: Router, event: unknown): void {
  (router.events as unknown as { next: (e: unknown) => void }).next(event);
}

describe('createTabRouterCommit', () => {
  const tabs = [handle('a'), handle('b'), handle('c')];
  let router: Router;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('navigates to routeFor(target) and resolves true on NavigationEnd', () => {
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 1) as Observable<boolean>).subscribe((v) => seen.push(v));
    expect(router.navigate).toHaveBeenCalledWith(['b']);
    emit(router, new NavigationEnd(1, '/b', '/b'));
    expect(seen).toEqual([true]);
  });

  it('resolves false on NavigationCancel (a guard blocked the leave)', () => {
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 2) as Observable<boolean>).subscribe((v) => seen.push(v));
    emit(router, new NavigationCancel(1, '/c', 'blocked by CanDeactivate'));
    expect(seen).toEqual([false]);
  });

  it('resolves false on NavigationError', () => {
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 2) as Observable<boolean>).subscribe((v) => seen.push(v));
    emit(router, new NavigationError(1, '/c', new Error('resolver threw')));
    expect(seen).toEqual([false]);
  });

  it('subscribes to events before navigating so a sync outcome is not missed', () => {
    const order: string[] = [];
    vi.spyOn(router, 'navigate').mockImplementation(() => {
      order.push('navigate');
      return Promise.resolve(true);
    });
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    (action(0, 1) as Observable<boolean>).subscribe(() => order.push('resolve'));
    emit(router, new NavigationEnd(1, '/b', '/b'));
    expect(order).toEqual(['navigate', 'resolve']);
  });

  it('honours a custom routeFor', () => {
    const action = createTabRouterCommit({
      router,
      tabs: () => tabs,
      routeFor: (h) => ['settings', h.id],
    });
    (action(0, 1) as Observable<boolean>).subscribe();
    expect(router.navigate).toHaveBeenCalledWith(['settings', 'b']);
  });

  it('resolves false without navigating when the target index is out of range', () => {
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 99) as Observable<boolean>).subscribe((v) => seen.push(v));
    expect(seen).toEqual([false]);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('takes only the first navigation outcome', () => {
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 1) as Observable<boolean>).subscribe((v) => seen.push(v));
    emit(router, new NavigationEnd(1, '/b', '/b'));
    emit(router, new NavigationCancel(2, '/b', 'late'));
    expect(seen).toEqual([true]);
  });

  it('stops listening after the subscription is torn down (supersede cancel)', () => {
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    const sub = (action(0, 1) as Observable<boolean>).subscribe((v) => seen.push(v));
    sub.unsubscribe();
    emit(router, new NavigationEnd(1, '/b', '/b'));
    expect(seen).toEqual([]);
  });
});
