import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
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

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
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

  it('navigates to routeFor(target) and resolves true when the navigation lands', async () => {
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 1) as Observable<boolean>).subscribe((v) => seen.push(v));
    expect(router.navigate).toHaveBeenCalledWith(['b']);
    await flushMicrotasks();
    expect(seen).toEqual([true]);
  });

  it('resolves false when the navigation is cancelled (a guard blocked the leave)', async () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(false);
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 2) as Observable<boolean>).subscribe((v) => seen.push(v));
    await flushMicrotasks();
    expect(seen).toEqual([false]);
  });

  it('resolves false when the navigation errors (guard/resolver threw)', async () => {
    vi.spyOn(router, 'navigate').mockRejectedValue(new Error('resolver threw'));
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 2) as Observable<boolean>).subscribe((v) => seen.push(v));
    await flushMicrotasks();
    expect(seen).toEqual([false]);
  });

  it('resolves true for a skipped same-URL navigation (promise resolves null)', async () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(null as unknown as boolean);
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 1) as Observable<boolean>).subscribe((v) => seen.push(v));
    await flushMicrotasks();
    expect(seen).toEqual([true]);
  });

  it('ignores terminal events of an unrelated concurrent navigation', async () => {
    // The commit correlates on its own navigate() promise; a foreign
    // NavigationEnd on the events stream must not resolve it.
    vi.spyOn(router, 'navigate').mockReturnValue(new Promise<boolean>(() => undefined));
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    (action(0, 1) as Observable<boolean>).subscribe((v) => seen.push(v));
    emit(router, new NavigationEnd(99, '/elsewhere', '/elsewhere'));
    await flushMicrotasks();
    expect(seen).toEqual([]);
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

  it('drops a late resolution after the subscription is torn down (supersede cancel)', async () => {
    let resolveNav!: (v: boolean) => void;
    vi.spyOn(router, 'navigate').mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolveNav = resolve;
      }),
    );
    const action = createTabRouterCommit({ router, tabs: () => tabs });
    const seen: boolean[] = [];
    const sub = (action(0, 1) as Observable<boolean>).subscribe((v) => seen.push(v));
    sub.unsubscribe();
    resolveNav(true);
    await flushMicrotasks();
    expect(seen).toEqual([]);
  });
});
