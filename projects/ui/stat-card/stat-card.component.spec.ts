import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStatCaption, CngxStatDelta, CngxStatLabel, CngxStatValue } from '@cngx/common/data';
import {
  provideLoadingConfig,
  withSpinnerVsSkeletonCutoff,
  type AsyncStatus,
  type CngxAsyncState,
  type CngxLoadingTreatment,
} from '@cngx/core/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxStatCard } from './stat-card.component';
import { CngxStatCardFooter, CngxStatCardViz } from './stat-card-slots';

/**
 * Hand-rolled state so each spec drives `status` / `isFirstLoad` / `isEmpty`
 * independently. The card reads only the interface, never a producer.
 */
function makeState(): CngxAsyncState<unknown> & {
  set(patch: { status?: AsyncStatus; firstLoad?: boolean; empty?: boolean }): void;
} {
  const status = signal<AsyncStatus>('idle');
  const firstLoad = signal(true);
  const empty = signal(false);
  const busy = signal(false);

  return {
    status,
    data: signal<unknown>(undefined),
    error: signal<unknown>(undefined),
    progress: signal<number | undefined>(undefined),
    isLoading: busy,
    isPending: signal(false),
    isRefreshing: signal(false),
    isBusy: busy,
    isFirstLoad: firstLoad,
    isEmpty: empty,
    hasData: signal(false),
    isSettled: signal(false),
    lastUpdated: signal<Date | undefined>(undefined),
    set(patch) {
      if (patch.status !== undefined) {
        status.set(patch.status);
        busy.set(['loading', 'pending', 'refreshing'].includes(patch.status));
      }
      if (patch.firstLoad !== undefined) {
        firstLoad.set(patch.firstLoad);
      }
      if (patch.empty !== undefined) {
        empty.set(patch.empty);
      }
    },
  };
}

@Component({
  standalone: true,
  imports: [CngxStatCard],
  template: `
    <cngx-stat-card [state]="state()" [loadingTreatment]="treatment()" />
  `,
})
class TreatmentHost {
  state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  treatment = signal<CngxLoadingTreatment>('auto');
}

@Component({
  standalone: true,
  imports: [
    CngxStatCard,
    CngxStatLabel,
    CngxStatValue,
    CngxStatDelta,
    CngxStatCaption,
    CngxStatCardViz,
    CngxStatCardFooter,
  ],
  template: `
    <cngx-stat-card [state]="state()">
      <span cngxStatLabel>Revenue</span>
      <span cngxStatValue>1.2M</span>
      <span cngxStatDelta>+5.3%</span>
      <span cngxStatCaption>vs last quarter</span>
      <span cngxStatCardViz>sparkline</span>
      <span cngxStatCardFooter>updated now</span>
    </cngx-stat-card>
  `,
})
class TestHost {
  state = signal<CngxAsyncState<unknown> | undefined>(undefined);
}

describe('CngxStatCard', () => {
  let state: ReturnType<typeof makeState>;

  beforeEach(() => {
    state = makeState();
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup(bindState = true) {
    const fixture = TestBed.createComponent(TestHost);
    if (bindState) {
      fixture.componentInstance.state.set(state);
    }
    fixture.detectChanges();
    const card: HTMLElement = fixture.nativeElement.querySelector('cngx-stat-card');
    return { fixture, card };
  }

  it('names the whole tile from the projected stat slots', () => {
    const { card } = setup();
    const group = card.querySelector('[role="group"]')!;
    const expected = [
      card.querySelector('[cngxStatLabel]')!.id,
      card.querySelector('[cngxStatValue]')!.id,
      card.querySelector('[cngxStatDelta]')!.id,
      card.querySelector('[cngxStatCaption]')!.id,
    ];
    expect(expected.every(Boolean)).toBe(true);
    expect(group.getAttribute('aria-labelledby')).toBe(expected.join(' '));
  });

  it('projects the viz and footer slots', () => {
    const { card } = setup();
    expect(card.querySelector('.cngx-stat-card__viz')!.textContent).toContain('sparkline');
    expect(card.querySelector('.cngx-stat-card__footer')!.textContent).toContain('updated now');
  });

  it('renders content when no state is bound', () => {
    const { card } = setup(false);
    expect(card.querySelector('[role="group"]')).not.toBeNull();
    expect(card.getAttribute('aria-busy')).toBeNull();
  });

  it('switches to the skeleton body on a first load', () => {
    const { fixture, card } = setup();
    state.set({ status: 'loading', firstLoad: true });
    fixture.detectChanges();

    expect(card.querySelector('.cngx-stat-card__skeleton')).not.toBeNull();
    expect(card.querySelector('[role="group"]')).toBeNull();
    expect(card.querySelectorAll('.cngx-stat-card__skeleton-line')).toHaveLength(3);
  });

  it('switches to the error body when the first load fails', () => {
    const { fixture, card } = setup();
    state.set({ status: 'error', firstLoad: true });
    fixture.detectChanges();

    expect(card.querySelector('.cngx-stat-card__error')!.textContent).toContain('Could not load');
    expect(card.querySelector('[role="group"]')).toBeNull();
  });

  it('keeps stale content visible when a refresh fails', () => {
    const { fixture, card } = setup();
    state.set({ status: 'error', firstLoad: false });
    fixture.detectChanges();

    expect(card.querySelector('[role="group"]')).not.toBeNull();
    expect(card.querySelector('.cngx-stat-card__stale')!.textContent).toContain(
      'Showing last known value',
    );
  });

  it('derives aria-busy from the state rather than setting it once', () => {
    const { fixture, card } = setup();
    expect(card.getAttribute('aria-busy')).toBeNull();

    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();
    expect(card.getAttribute('aria-busy')).toBe('true');

    state.set({ status: 'success', firstLoad: false });
    fixture.detectChanges();
    expect(card.getAttribute('aria-busy')).toBeNull();
  });

  it('shows content once a refresh succeeds over existing data', () => {
    const { fixture, card } = setup();
    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();
    expect(card.querySelector('[role="group"]')).not.toBeNull();
    expect(card.querySelector('.cngx-stat-card__skeleton')).toBeNull();
  });
});

describe('CngxStatCard loading treatment', () => {
  let state: ReturnType<typeof makeState>;

  beforeEach(() => {
    state = makeState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(providers: unknown[] = []) {
    TestBed.configureTestingModule({
      imports: [TreatmentHost],
      providers: providers as never[],
    });
    const fixture = TestBed.createComponent(TreatmentHost);
    fixture.componentInstance.state.set(state);
    fixture.detectChanges();
    const card: HTMLElement = fixture.nativeElement.querySelector('cngx-stat-card');
    return { fixture, card, host: fixture.componentInstance };
  }

  function isSkeleton(card: HTMLElement): boolean {
    return card.querySelector('.cngx-stat-card__skeleton') !== null;
  }

  function isSpinner(card: HTMLElement): boolean {
    return card.querySelector('.cngx-stat-card__spinner') !== null;
  }

  it('pins the skeleton when asked, regardless of measurement', () => {
    const { fixture, card, host } = setup();
    host.treatment.set('skeleton');
    state.set({ status: 'loading', firstLoad: true });
    fixture.detectChanges();

    expect(isSkeleton(card)).toBe(true);
    expect(isSpinner(card)).toBe(false);
  });

  it('pins the spinner when asked', () => {
    const { fixture, card, host } = setup();
    host.treatment.set('spinner');
    state.set({ status: 'loading', firstLoad: true });
    fixture.detectChanges();

    expect(isSpinner(card)).toBe(true);
    expect(isSkeleton(card)).toBe(false);
  });

  it('shows a skeleton on the very first load, with nothing measured yet', () => {
    const { fixture, card } = setup();
    state.set({ status: 'loading', firstLoad: true });
    fixture.detectChanges();

    expect(isSkeleton(card)).toBe(true);
  });

  it('switches to a spinner after a fast window closed', () => {
    // performance.now() drives the probe, so it must be faked alongside timers
    // for the measured window to be deterministic.
    vi.useFakeTimers({ toFake: ['performance'] });
    const { fixture, card } = setup();

    state.set({ status: 'loading', firstLoad: true });
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    state.set({ status: 'success', firstLoad: false });
    fixture.detectChanges();

    // Second load: the 50ms window is well under the 800ms default cutoff.
    state.set({ status: 'refreshing', firstLoad: true });
    fixture.detectChanges();
    expect(isSpinner(card)).toBe(true);
    expect(isSkeleton(card)).toBe(false);
  });

  it('stays on the skeleton after a slow window closed', () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    const { fixture, card } = setup();

    state.set({ status: 'loading', firstLoad: true });
    fixture.detectChanges();
    vi.advanceTimersByTime(3000);
    state.set({ status: 'success', firstLoad: false });
    fixture.detectChanges();

    state.set({ status: 'refreshing', firstLoad: true });
    fixture.detectChanges();
    expect(isSkeleton(card)).toBe(true);
  });

  it('reads the cutoff from the config cascade, not a baked-in threshold', () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    const { fixture, card } = setup([provideLoadingConfig(withSpinnerVsSkeletonCutoff(20))]);

    state.set({ status: 'loading', firstLoad: true });
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    state.set({ status: 'success', firstLoad: false });
    fixture.detectChanges();

    // 50ms would be "fast" under the 800ms default; against a 20ms cutoff it is slow.
    state.set({ status: 'refreshing', firstLoad: true });
    fixture.detectChanges();
    expect(isSkeleton(card)).toBe(true);
  });
});
