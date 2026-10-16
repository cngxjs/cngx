import {
  EnvironmentInjector,
  provideZonelessChangeDetection,
  runInInjectionContext,
  signal,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { injectQueryParamSync, type QueryParamSyncOptions } from './inject-query-param-sync';

// Drains the microtask queue so a mocked navigate's `.catch` (onSyncError)
// settles before assertions.
async function flush(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

function run<T>(state: WritableSignal<T>, opts: QueryParamSyncOptions<T>): void {
  const injector = TestBed.inject(EnvironmentInjector);
  runInInjectionContext(injector, () => injectQueryParamSync(state, opts));
}

type NavExtras = {
  queryParams?: Record<string, string | null>;
  queryParamsHandling?: string;
  replaceUrl?: boolean;
};

describe('injectQueryParamSync', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('navigates once with the merged param when the signal changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const state = signal(false);
    run(state, { param: 'nav' });
    TestBed.tick();
    await flush();
    expect(nav).not.toHaveBeenCalled();

    state.set(true);
    TestBed.tick();
    await flush();

    expect(nav).toHaveBeenCalledTimes(1);
    const extras = nav.mock.calls[0][1] as NavExtras;
    expect(extras.queryParams).toEqual({ nav: 'open' });
    expect(extras.queryParamsHandling).toBe('merge');
    expect(extras.replaceUrl).toBe(true);
  });

  it('does not re-navigate when the same value is set again (loop guard)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const state = signal(false);
    run(state, { param: 'nav' });
    TestBed.tick();
    await flush();

    state.set(true);
    TestBed.tick();
    await flush();
    state.set(true);
    TestBed.tick();
    await flush();

    expect(nav).toHaveBeenCalledTimes(1);
  });

  it('hydrates the signal on a query-param emission (back/forward)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);

    const state = signal(false);
    run(state, { param: 'nav' });
    TestBed.tick();
    await flush();

    await router.navigate([], { queryParams: { nav: 'open' } });
    TestBed.tick();
    await flush();

    expect(state()).toBe(true);
  });

  it('hydrates from the initial param on load (URL wins)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { nav: 'open' } });

    const state = signal(false);
    run(state, { param: 'nav' });

    expect(state()).toBe(true);
    TestBed.tick();
    await flush();
  });

  it('no-ops and dev-warns once without provideRouter(...), instead of failing with NG0201', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // Router resolves without provideRouter(...) (providedIn: 'root');
    // ActivatedRoute does not, so a hard inject of it would throw NG0201.
    const state = signal(false);
    expect(() =>
      TestBed.runInInjectionContext(() => injectQueryParamSync(state, { param: 'nav' })),
    ).not.toThrow();
    TestBed.tick();
    await flush();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(
      /^CNGX1031: injectQueryParamSync\(\): no Router \/ ActivatedRoute available - the URL sync is a no-op\. Provide @angular\/router via provideRouter\(\.\.\.\) to enable query-param URL sync\. Find more at /,
    );
    expect(state()).toBe(false);
  });

  it('does not warn CNGX1031 with provideRouter([])', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const state = signal(false);
    expect(() =>
      TestBed.runInInjectionContext(() => injectQueryParamSync(state, { param: 'nav' })),
    ).not.toThrow();
    TestBed.tick();
    await flush();

    expect(warn.mock.calls.some(([m]) => /^CNGX1031: /.test(String(m)))).toBe(false);
  });

  it('writes nothing to the console without provideRouter(...) in production', async () => {
    vi.stubGlobal('ngDevMode', false);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const state = signal(false);
    TestBed.runInInjectionContext(() => injectQueryParamSync(state, { param: 'nav' }));
    TestBed.tick();
    await flush();

    expect(warn).not.toHaveBeenCalled();
    expect(state()).toBe(false);
  });

  it('honors a Signal<string> param rename and migrates the key in one navigate', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const param = signal('nav');
    const state = signal(true);
    run(state, { param });
    TestBed.tick();
    await flush();
    // init reflect wrote ?nav=open once.
    expect(nav).toHaveBeenCalledTimes(1);

    param.set('menu');
    TestBed.tick();
    await flush();

    expect(nav).toHaveBeenCalledTimes(2);
    const extras = nav.mock.calls[1][1] as NavExtras;
    expect(extras.queryParams).toEqual({ nav: null, menu: 'open' });
    expect(extras.queryParamsHandling).toBe('merge');
  });

  it('produces zero migration navigates on initialization', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const state = signal(false);
    run(state, { param: signal('nav') });
    TestBed.tick();
    await flush();

    expect(nav).not.toHaveBeenCalled();
  });

  it('emits two navigates on a rapid open->close toggle and lands on the final value', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const state = signal(false);
    run(state, { param: 'nav' });
    TestBed.tick();
    await flush();

    state.set(true);
    TestBed.tick();
    await flush();
    state.set(false);
    TestBed.tick();
    await flush();

    expect(nav).toHaveBeenCalledTimes(2);
    const last = nav.mock.calls[1][1] as NavExtras;
    expect(last.queryParams).toEqual({ nav: null });
  });

  it('invokes onSyncError with the rejection reason when navigate rejects', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const failure = new Error('navigation refused');
    vi.spyOn(router, 'navigate').mockReturnValue(Promise.reject(failure));

    const errors: unknown[] = [];
    const state = signal(false);
    run(state, { param: 'nav', onSyncError: (err) => errors.push(err) });
    TestBed.tick();
    await flush();

    state.set(true);
    TestBed.tick();
    await flush();

    expect(errors).toEqual([failure]);
  });
});
