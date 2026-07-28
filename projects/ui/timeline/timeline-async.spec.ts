import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState } from '@cngx/common/data';
import {
  CngxTimelineEmpty,
  CngxTimelineError,
  CngxTimelineItemTpl,
  CngxTimelineLoadingTail,
  CngxTimelineRetryButton,
} from '@cngx/common/timeline';
import { CNGX_STATEFUL, type AsyncStatus, type CngxStateful } from '@cngx/core/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxTimeline } from './timeline.component';

interface Event {
  readonly id: number;
  readonly at: Date;
}

const EVENTS: readonly Event[] = [
  { id: 1, at: new Date(2026, 6, 20, 9) },
  { id: 2, at: new Date(2026, 6, 21, 9) },
];

@Component({
  selector: 'cngx-timeline-async-host',
  standalone: true,
  imports: [
    CngxTimeline,
    CngxTimelineItemTpl,
    CngxTimelineEmpty,
    CngxTimelineError,
    CngxTimelineRetryButton,
    CngxTimelineLoadingTail,
  ],
  template: `
    <cngx-timeline
      [state]="state"
      [dateAccessor]="at"
      [emptyReason]="emptyReason()"
      [skeletonRowCount]="2"
      (retry)="retries.set(retries() + 1)"
    >
      <ng-template cngxTimelineItem>
        <span class="row">row</span>
      </ng-template>
      @if (withSlots()) {
        <ng-template cngxTimelineEmpty let-reason>
          <span class="slot-empty">EMPTY {{ reason }}</span>
        </ng-template>
        <ng-template cngxTimelineError let-error let-retry="retry">
          <button class="slot-error" type="button" (click)="retry()">ERR</button>
        </ng-template>
        <ng-template cngxTimelineLoadingTail>
          <span class="slot-tail">TAIL</span>
        </ng-template>
      }
      @if (withRetryButtonSlot()) {
        <ng-template cngxTimelineRetryButton let-retry>
          <button class="slot-retry" type="button" (click)="retry()">AGAIN</button>
        </ng-template>
      }
    </cngx-timeline>
  `,
})
class Host {
  readonly state = createManualState<readonly Event[]>();
  readonly emptyReason = signal<'first-use' | 'no-results' | 'cleared'>('first-use');
  readonly withSlots = signal(false);
  readonly withRetryButtonSlot = signal(false);
  readonly retries = signal(0);
  readonly at = (event: Event): Date => event.at;
}

function mount(): { host: Host; el: HTMLElement; detect: () => void } {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline');
  if (!el) {
    throw new Error('cngx-timeline did not render');
  }
  return {
    host: fixture.componentInstance,
    el: el as HTMLElement,
    detect: () => fixture.detectChanges(),
  };
}

/** What the body is showing, named the way the view switch names it. */
function surfaces(el: HTMLElement): string[] {
  const present: string[] = [];
  if (el.querySelector('.cngx-timeline__skeleton')) {
    present.push('skeleton');
  }
  if (el.querySelector('.cngx-timeline__empty')) {
    present.push('empty');
  }
  if (el.querySelector('.cngx-timeline__error')) {
    present.push('error');
  }
  if (el.querySelector('.cngx-timeline__list')) {
    present.push('content');
  }
  if (el.querySelector('.cngx-timeline__tail')) {
    present.push('tail');
  }
  return present;
}

describe('CngxTimeline async body', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    // The skeleton container gates on show-delay / min-dwell timers; without
    // fake timers the placeholder never appears within a synchronous spec.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function settleGate(detect: () => void): void {
    vi.advanceTimersByTime(1000);
    detect();
  }

  describe('the six AsyncStatus values', () => {
    it('shows nothing before the first load starts', () => {
      const { el, detect } = mount();
      settleGate(detect);

      expect(surfaces(el)).toEqual([]);
    });

    it.each<AsyncStatus>(['loading', 'pending', 'refreshing'])(
      'shows the skeleton while "%s" on first load',
      (status) => {
        const { el, host, detect } = mount();

        host.state.set(status);
        settleGate(detect);

        expect(surfaces(el)).toEqual(['skeleton']);
      },
    );

    it('shows the error surface when the first load fails', () => {
      const { el, host, detect } = mount();

      host.state.setError(new Error('boom'));
      settleGate(detect);

      expect(surfaces(el)).toEqual(['error']);
    });

    it('shows the empty surface when a load succeeds with nothing in it', () => {
      const { el, host, detect } = mount();

      host.state.setSuccess([]);
      settleGate(detect);

      expect(surfaces(el)).toEqual(['empty']);
    });

    it('shows content when a load succeeds with data', () => {
      const { el, host, detect } = mount();

      host.state.setSuccess(EVENTS);
      settleGate(detect);

      expect(surfaces(el)).toEqual(['content']);
      expect(el.querySelectorAll('.row')).toHaveLength(2);
    });

    it('keeps content on screen and adds a tail while refreshing', () => {
      const { el, host, detect } = mount();
      host.state.setSuccess(EVENTS);
      settleGate(detect);

      host.state.set('refreshing');
      settleGate(detect);

      expect(surfaces(el)).toEqual(['content', 'tail']);
      expect(el.querySelectorAll('.row')).toHaveLength(2);
    });

    it('keeps content on screen and adds the error when a refresh fails', () => {
      const { el, host, detect } = mount();
      host.state.setSuccess(EVENTS);
      settleGate(detect);

      host.state.setError(new Error('boom'));
      settleGate(detect);

      expect(surfaces(el)).toEqual(['error', 'content']);
      expect(el.querySelectorAll('.row')).toHaveLength(2);
    });
  });

  describe('skeleton', () => {
    it('draws the requested number of placeholder rows on the item raster', () => {
      const { el, host, detect } = mount();

      host.state.set('loading');
      settleGate(detect);

      const rows = el.querySelectorAll('.cngx-timeline__skeleton-row');
      expect(rows).toHaveLength(2);
      for (const row of Array.from(rows)) {
        // Self-contained: no class here belongs to CngxTimelineItem, whose
        // stylesheet is not in the document before the first row renders.
        expect(row.className).not.toContain('cngx-timeline-item');
        expect(row.querySelector('.cngx-timeline__skeleton-marker')).not.toBeNull();
        expect(row.querySelector('.cngx-timeline__skeleton-rail')).not.toBeNull();
        expect(row.querySelector('.cngx-timeline__skeleton-body')).not.toBeNull();
      }
    });

    it('hides the placeholder from assistive tech and announces the load instead', () => {
      const { el, host, detect } = mount();

      host.state.set('loading');
      settleGate(detect);

      for (const row of Array.from(el.querySelectorAll('.cngx-timeline__skeleton-row'))) {
        expect(row.getAttribute('aria-hidden')).toBe('true');
      }
      expect(el.querySelector('.cngx-timeline__sr-only')?.textContent?.trim()).toBe(
        'Loading timeline',
      );
    });
  });

  describe('retry', () => {
    it('emits from the built-in retry button', () => {
      const { el, host, detect } = mount();
      host.state.setError(new Error('boom'));
      settleGate(detect);

      el.querySelector<HTMLButtonElement>('.cngx-timeline__retry')?.click();
      detect();

      expect(host.retries()).toBe(1);
    });

    it('emits from a consumer retry-button slot', () => {
      const { el, host, detect } = mount();
      host.withRetryButtonSlot.set(true);
      host.state.setError(new Error('boom'));
      settleGate(detect);

      expect(el.querySelector('.cngx-timeline__retry')).toBeNull();
      el.querySelector<HTMLButtonElement>('.slot-retry')?.click();
      detect();

      expect(host.retries()).toBe(1);
    });

    it('emits from a consumer error slot that owns its own control', () => {
      const { el, host, detect } = mount();
      host.withSlots.set(true);
      host.state.setError(new Error('boom'));
      settleGate(detect);

      el.querySelector<HTMLButtonElement>('.slot-error')?.click();
      detect();

      expect(host.retries()).toBe(1);
    });
  });

  describe('slots', () => {
    it('passes the empty reason into the empty slot', () => {
      const { el, host, detect } = mount();
      host.withSlots.set(true);
      host.emptyReason.set('no-results');
      host.state.setSuccess([]);
      settleGate(detect);

      expect(el.querySelector('.slot-empty')?.textContent?.trim()).toBe('EMPTY no-results');
    });

    it('renders the loading-tail slot instead of the fallback copy', () => {
      const { el, host, detect } = mount();
      host.withSlots.set(true);
      host.state.setSuccess(EVENTS);
      settleGate(detect);

      host.state.set('refreshing');
      settleGate(detect);

      expect(el.querySelector('.slot-tail')).not.toBeNull();
      // The visible tail is decoration; the announcement is the live region.
      expect(el.querySelector('.cngx-timeline__tail')?.getAttribute('aria-hidden')).toBe('true');
      expect(el.querySelector('.cngx-timeline__sr-only')?.textContent?.trim()).toBe('Updating…');
    });

    it('falls back to the config copy with no slots bound', () => {
      const { el, host, detect } = mount();

      host.state.setSuccess([]);
      settleGate(detect);
      expect(el.querySelector('.cngx-timeline__empty')?.textContent?.trim()).toBe('No events yet.');

      host.state.setError(new Error('boom'));
      settleGate(detect);
      expect(el.querySelector('.cngx-timeline__error-message')?.textContent?.trim()).toBe(
        'Could not load the timeline.',
      );
      expect(el.querySelector('.cngx-timeline__retry')?.textContent?.trim()).toBe('Retry');
    });
  });

  describe('CNGX_STATEFUL', () => {
    function mountStateful(): {
      host: Host;
      stateful: CngxStateful;
      detect: () => void;
    } {
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const timeline = fixture.debugElement.query((node) => node.name === 'cngx-timeline');
      return {
        host: fixture.componentInstance,
        stateful: timeline.injector.get<CngxStateful>(CNGX_STATEFUL),
        detect: () => fixture.detectChanges(),
      };
    }

    it('is resolvable from inside the timeline, so a bridge needs no binding', () => {
      const { stateful } = mountStateful();

      expect(stateful.state).toBeDefined();
      expect(stateful.state.status()).toBe('idle');
    });

    it('forwards every transition of the bound state', () => {
      const { host, stateful, detect } = mountStateful();

      host.state.set('loading');
      detect();
      expect(stateful.state.status()).toBe('loading');
      expect(stateful.state.isBusy()).toBe(true);

      host.state.setSuccess(EVENTS);
      detect();
      expect(stateful.state.status()).toBe('success');
      expect(stateful.state.isEmpty()).toBe(false);
      expect(stateful.state.isBusy()).toBe(false);

      host.state.setError(new Error('boom'));
      detect();
      expect(stateful.state.status()).toBe('error');
      expect(stateful.state.error()).toBeInstanceOf(Error);
    });
  });

  describe('live region', () => {
    it('is in the DOM from the first render, before it has anything to say', () => {
      const { el, detect } = mount();
      settleGate(detect);
      const region = el.querySelector('.cngx-timeline__sr-only');

      expect(region).not.toBeNull();
      expect(region?.getAttribute('aria-live')).toBe('polite');
      expect(region?.textContent?.trim()).toBe('');
    });

    it('stays the same element across load, refresh and quiet', () => {
      const { el, host, detect } = mount();
      settleGate(detect);
      const region = el.querySelector('.cngx-timeline__sr-only');

      host.state.set('loading');
      settleGate(detect);
      expect(el.querySelector('.cngx-timeline__sr-only')).toBe(region);

      host.state.setSuccess(EVENTS);
      settleGate(detect);
      expect(el.querySelector('.cngx-timeline__sr-only')).toBe(region);
      expect(region?.textContent?.trim()).toBe('');
    });
  });

  describe('aria-busy', () => {
    it('sits on the list, not the role-less host, and tracks the bound state', () => {
      const { el, host, detect } = mount();
      host.state.setSuccess(EVENTS);
      settleGate(detect);

      const list = el.querySelector('.cngx-timeline__list');
      expect(list?.getAttribute('role')).toBe('list');
      expect(el.hasAttribute('aria-busy')).toBe(false);
      expect(list?.hasAttribute('aria-busy')).toBe(false);

      host.state.set('refreshing');
      settleGate(detect);
      expect(el.querySelector('.cngx-timeline__list')?.getAttribute('aria-busy')).toBe('true');

      host.state.setSuccess(EVENTS);
      settleGate(detect);
      expect(el.querySelector('.cngx-timeline__list')?.hasAttribute('aria-busy')).toBe(false);
    });
  });
});
