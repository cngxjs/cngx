import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxToc } from './toc.component';
import { CngxTocRouterSync } from './toc-router-sync.directive';
import type { CngxTocItem } from './toc.types';

// CngxToc builds a real IntersectionObserver and reads matchMedia; both are
// stubbed the same way as toc.component.spec.ts so creating the host is safe.
// These tests drive activation directly rather than through the observer.
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

let reducedMotionState = false;
let navigate: ReturnType<typeof vi.fn>;
let fragmentSubject: BehaviorSubject<string | null>;

const TOC: readonly CngxTocItem[] = [
  { id: 'intro', label: 'Intro' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
];

const SECTIONS = `
  <section id="intro">Intro</section>
  <section id="features">Features</section>
  <section id="pricing">Pricing</section>
`;

@Component({
  imports: [CngxToc, CngxTocRouterSync],
  template: `<cngx-toc cngxTocRouterSync [items]="items" />${SECTIONS}`,
})
class SyncHost {
  readonly items = TOC;
}

describe('CngxTocRouterSync', () => {
  beforeEach(() => {
    reducedMotionState = false;
    navigate = vi.fn().mockResolvedValue(true);
    fragmentSubject = new BehaviorSubject<string | null>(null);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    (globalThis as Record<string, unknown>)['matchMedia'] = vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotionState;
      },
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>)['matchMedia'];
  });

  function configureWithRouter(): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: fragmentSubject.asObservable(),
            snapshot: {
              get fragment() {
                return fragmentSubject.value;
              },
            },
          },
        },
      ],
    });
  }

  function getToc(fixture: { debugElement: import('@angular/core').DebugElement }): CngxToc {
    return fixture.debugElement.query(By.directive(CngxToc)).componentInstance;
  }

  function setup() {
    const fixture = TestBed.createComponent(SyncHost);
    const toc = getToc(fixture);
    fixture.detectChanges();
    TestBed.flushEffects();
    return { fixture, toc };
  }

  it('writes the fragment on activation with replaceUrl, keeping the query params', () => {
    configureWithRouter();
    const { toc } = setup();

    toc.activated.emit({ id: 'features', label: 'Features' });

    // queryParamsHandling 'merge': a bare fragment navigate would otherwise
    // wipe every query param on the URL (filters, tab state, pagination).
    expect(navigate).toHaveBeenCalledWith([], {
      fragment: 'features',
      replaceUrl: true,
      queryParamsHandling: 'merge',
    });
  });

  it('swallows a rejected fragment navigation instead of surfacing an unhandled rejection', async () => {
    navigate.mockRejectedValueOnce(new Error('guard blocked'));
    configureWithRouter();
    const { toc } = setup();

    toc.activated.emit({ id: 'features', label: 'Features' });
    // Flush the rejection through the microtask queue; an unhandled rejection
    // would fail the test run.
    await Promise.resolve();
    await Promise.resolve();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('scrolls to the initial deep-link fragment on load', () => {
    fragmentSubject.next('pricing');
    configureWithRouter();
    const fixture = TestBed.createComponent(SyncHost);
    const toc = getToc(fixture);
    const scrollTo = vi.spyOn(toc, 'scrollTo').mockImplementation(() => {});

    fixture.detectChanges();
    TestBed.flushEffects();

    expect(scrollTo).toHaveBeenCalledWith('pricing');
  });

  it('replaces the history entry rather than pushing (no double entries)', () => {
    configureWithRouter();
    const { toc } = setup();

    toc.activated.emit({ id: 'intro', label: 'Intro' });
    toc.activated.emit({ id: 'pricing', label: 'Pricing' });

    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate.mock.calls.every(([, extras]) => extras.replaceUrl === true)).toBe(true);
  });

  it('dev-warns once and no-ops without a Router', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.configureTestingModule({ providers: [] });
    const { toc } = setup();

    expect(() => toc.activated.emit({ id: 'intro', label: 'Intro' })).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('CngxTocRouterSync');
  });

  it('stops writing the fragment after the directive is destroyed', () => {
    configureWithRouter();
    const { fixture, toc } = setup();

    toc.activated.emit({ id: 'intro', label: 'Intro' });
    expect(navigate).toHaveBeenCalledTimes(1);

    fixture.destroy();
    // Emitting on the now-destroyed output logs an expected NG0953; the point
    // is the directive's takeUntilDestroyed subscription no longer reaches the
    // router, so navigate stays at one call.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    toc.activated.emit({ id: 'pricing', label: 'Pricing' });

    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
