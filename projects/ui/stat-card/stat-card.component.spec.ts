import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStatCaption, CngxStatDelta, CngxStatLabel, CngxStatValue } from '@cngx/common/data';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';
import { beforeEach, describe, expect, it } from 'vitest';

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
