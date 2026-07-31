import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxTabGroupPresenter } from './presenter.directive';
import { CngxTab } from './tab.directive';
import { CngxTabsFragmentSync } from './router-sync.directive';

@Component({
  standalone: true,
  selector: 'fragment-host',
  imports: [CngxTab],
  hostDirectives: [CngxTabGroupPresenter, CngxTabsFragmentSync],
  template: `
    <div cngxTab [label]="'A'"></div>
    <div cngxTab [label]="'B'"></div>
  `,
})
class FragmentHost {}

@Component({
  standalone: true,
  selector: 'queryparam-host',
  imports: [CngxTab],
  hostDirectives: [
    CngxTabGroupPresenter,
    {
      directive: CngxTabsFragmentSync,
      inputs: ['mode', 'paramName'],
    },
  ],
  template: `
    <div cngxTab [label]="'A'"></div>
    <div cngxTab [label]="'B'"></div>
  `,
})
class QueryParamHost {}

@Component({
  standalone: true,
  selector: 'replace-url-host',
  imports: [CngxTab],
  hostDirectives: [
    CngxTabGroupPresenter,
    { directive: CngxTabsFragmentSync, inputs: ['replaceUrl'] },
  ],
  template: `
    <div cngxTab id="a" [label]="'A'"></div>
    <div cngxTab id="b" [label]="'B'"></div>
  `,
})
class ReplaceUrlHost {}

@Component({
  standalone: true,
  selector: 'commit-seed-host',
  imports: [CngxTab],
  hostDirectives: [
    { directive: CngxTabGroupPresenter, inputs: ['commitAction'] },
    CngxTabsFragmentSync,
  ],
  template: `
    <div cngxTab id="a" [label]="'A'"></div>
    <div cngxTab id="b" [label]="'B'"></div>
  `,
})
class CommitSeedHost {}

// Drains pending microtasks so the directive's effect() chain (which
// reads activeId, then calls router.navigate inside untracked()) has
// a chance to fire and the spy captures the call. Mirrors the
// stepper router-sync spec — `whenStable()` has been observed to hang
// under Node 20 + zoneless tests with Router in providers.
async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

describe('CngxTabsFragmentSync', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('writes a fragment when activeId changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(FragmentHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const calls = navigateSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastExtras = calls[calls.length - 1][1] as {
      fragment?: string;
      queryParams?: Record<string, string>;
    };
    expect(lastExtras.fragment).toMatch(/^tab=cngx-tab-/);
    expect(lastExtras.queryParams).toBeUndefined();
  });

  it('writes a queryParam in queryParam mode', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(QueryParamHost);
    fixture.componentRef.setInput('mode', 'queryParam');
    fixture.componentRef.setInput('paramName', 'panel');
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const calls = navigateSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastExtras = calls[calls.length - 1][1] as {
      fragment?: string;
      queryParams?: Record<string, string>;
    };
    expect(lastExtras.queryParams).toEqual({
      panel: expect.stringMatching(/^cngx-tab-/) as unknown as string,
    });
    expect(lastExtras.fragment).toBeUndefined();
  });

  it('is a graceful no-op when Router is not provided (dev-warn only)', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => {
      const fixture = TestBed.createComponent(FragmentHost);
      fixture.detectChanges();
    }).not.toThrow();
    warnSpy.mockRestore();
  });

  it('reads the initial fragment on mount and selects the matching tab', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // Pre-stub the snapshot so the directive's afterNextRender hook
    // reads a fragment that targets the second tab. We seed it before
    // creating the fixture because the constructor's afterNextRender
    // callback fires on first detectChanges.
    Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
      get: () => 'tab=__sentinel__',
      configurable: true,
    });

    const fixture = TestBed.createComponent(FragmentHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    const tabs = presenter.tabs();

    // Re-point the snapshot at the actual second tab id and dispatch a
    // NavigationEnd via the public router.events stream so the URL→host
    // sync effect fires.
    Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
      get: () => `tab=${tabs[1].id}`,
      configurable: true,
    });
    (router as unknown as { navigated: boolean }).navigated = true;
    (router.events as unknown as { next: (e: unknown) => void }).next?.(
      new NavigationEnd(1, '/', '/'),
    );
    fixture.detectChanges();
    await flushMicrotasks();

    // Either the afterNextRender path (no-op for sentinel) or the
    // NavigationEnd path lands the URL value on the presenter.
    expect(presenter.activeId()).toBe(tabs[1].id);
  });

  it('seeds the deep-linked tab at content-init, before the host view renders', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
      get: () => 'tab=b',
      configurable: true,
    });

    const fixture = TestBed.createComponent(ReplaceUrlHost);
    // No detectChanges yet: ngAfterContentInit runs during the first
    // CD pass, ahead of the host's own view. Panels rendered by that
    // view therefore never see index 0 under panelMode="lazy".
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);

    expect(presenter.activeId()).toBe('b');
  });

  it('pushes a history entry instead of replacing when [replaceUrl]="false"', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(ReplaceUrlHost);
    fixture.componentRef.setInput('replaceUrl', false);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const extras = navigateSpy.mock.calls[navigateSpy.mock.calls.length - 1][1] as {
      replaceUrl?: boolean;
    };
    expect(extras.replaceUrl).toBe(false);
  });

  it('replaces by default so browser-back leaves the page', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(ReplaceUrlHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const extras = navigateSpy.mock.calls[navigateSpy.mock.calls.length - 1][1] as {
      replaceUrl?: boolean;
    };
    expect(extras.replaceUrl).toBe(true);
  });

  it('runs a bound commit action exactly once for the content-init seed', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
      get: () => 'tab=b',
      configurable: true,
    });
    const commitAction = vi.fn().mockResolvedValue(true);

    const fixture = TestBed.createComponent(CommitSeedHost);
    fixture.componentRef.setInput('commitAction', commitAction);
    fixture.detectChanges();
    await flushMicrotasks();

    // The seed goes through selectById -> select(), so it does run the
    // consumer's action - but the afterNextRender fallback must not run
    // it a second time.
    expect(commitAction).toHaveBeenCalledTimes(1);
    // (fromIndex, toIndex): the seed moves off the default tab.
    expect(commitAction.mock.calls[0]).toEqual([0, 1]);
  });
});
