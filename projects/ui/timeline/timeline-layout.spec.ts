import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState } from '@cngx/common/data';
import { CngxTimelineItemTpl } from '@cngx/common/timeline';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CngxTimeline,
  type CngxTimelineMode,
  type CngxTimelinePlacement,
} from './timeline.component';

interface Event {
  readonly id: number;
  readonly at: Date;
  readonly summary: string;
}

/** Four events on one day, so parity is read across a single band. */
const ONE_BAND: readonly Event[] = [
  { id: 1, at: new Date(2026, 6, 20, 9), summary: 'opened' },
  { id: 2, at: new Date(2026, 6, 20, 11), summary: 'reviewed' },
  { id: 3, at: new Date(2026, 6, 20, 14), summary: 'approved' },
  { id: 4, at: new Date(2026, 6, 20, 17), summary: 'merged' },
];

/** Two events per day across two days, so parity restarts per band. */
const TWO_BANDS: readonly Event[] = [
  { id: 1, at: new Date(2026, 6, 20, 9), summary: 'opened' },
  { id: 2, at: new Date(2026, 6, 20, 17), summary: 'reviewed' },
  { id: 3, at: new Date(2026, 6, 21, 9), summary: 'approved' },
  { id: 4, at: new Date(2026, 6, 21, 17), summary: 'merged' },
];

@Component({
  selector: 'cngx-timeline-layout-host',
  standalone: true,
  imports: [CngxTimeline, CngxTimelineItemTpl],
  template: `
    <cngx-timeline
      [items]="items()"
      [dateAccessor]="at"
      [idAccessor]="byId"
      [groupBy]="groupBy()"
      [mode]="mode()"
      [placement]="placement()"
      [state]="state()"
      [skeletonRowCount]="4"
    >
      <ng-template [cngxTimelineItem]="items()" let-event>
        <span class="row">{{ event.summary }}</span>
      </ng-template>
    </cngx-timeline>
  `,
})
class LayoutHost {
  readonly items = signal<readonly Event[]>(ONE_BAND);
  readonly groupBy = signal<'day' | 'none'>('day');
  readonly mode = signal<CngxTimelineMode>('narrative');
  readonly placement = signal<CngxTimelinePlacement>('start');
  readonly state = signal<ReturnType<typeof createManualState<readonly Event[]>> | undefined>(
    undefined,
  );
  readonly at = (event: Event): Date => event.at;
  readonly byId = (event: Event): number => event.id;
}

function mount(): { host: LayoutHost; el: HTMLElement; detect: () => void } {
  TestBed.configureTestingModule({ imports: [LayoutHost] });
  const fixture = TestBed.createComponent(LayoutHost);
  fixture.detectChanges();
  return {
    host: fixture.componentInstance,
    el: fixture.nativeElement as HTMLElement,
    detect: () => fixture.detectChanges(),
  };
}

/** `data-row-side` of every rendered content row, in DOM order. */
function sides(el: HTMLElement): readonly (string | null)[] {
  return Array.from(el.querySelectorAll('.cngx-timeline__item'), (row) =>
    row.getAttribute('data-row-side'),
  );
}

/** The role triple the ARIA chain is made of, grouped or ungrouped. */
function roles(el: HTMLElement): readonly (string | null)[] {
  return [
    el.querySelector('.cngx-timeline__list')?.getAttribute('role') ?? null,
    el.querySelector('.cngx-timeline__group')?.getAttribute('role') ?? null,
    el.querySelector('.cngx-timeline__rows')?.getAttribute('role') ?? null,
  ];
}

const PLACEMENTS: readonly CngxTimelinePlacement[] = ['start', 'end', 'alternate'];

describe('CngxTimeline layout', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  describe('placement attribute', () => {
    it('defaults to start, so v1 markup renders unchanged', () => {
      const { el } = mount();

      expect(el.querySelector('cngx-timeline')?.getAttribute('data-placement')).toBe('start');
    });

    it.each(PLACEMENTS)('reflects placement "%s" onto the host', (placement) => {
      const { el, host, detect } = mount();

      host.placement.set(placement);
      detect();

      expect(el.querySelector('cngx-timeline')?.getAttribute('data-placement')).toBe(placement);
    });
  });

  describe('row side derivation', () => {
    it('puts every row on the start side by default', () => {
      const { el } = mount();

      expect(sides(el)).toEqual(['start', 'start', 'start', 'start']);
    });

    it('mirrors every row under placement="end"', () => {
      const { el, host, detect } = mount();

      host.placement.set('end');
      detect();

      expect(sides(el)).toEqual(['end', 'end', 'end', 'end']);
    });

    it('alternates by index across a band', () => {
      const { el, host, detect } = mount();

      host.placement.set('alternate');
      detect();

      expect(sides(el)).toEqual(['start', 'end', 'start', 'end']);
    });

    it('restarts parity in each band, because the index is the band-local one', () => {
      const { el, host, detect } = mount();

      host.items.set(TWO_BANDS);
      host.placement.set('alternate');
      detect();

      // Two bands of two rows: each band opens on the start side rather
      // than continuing the run's parity across the header between them.
      expect(sides(el)).toEqual(['start', 'end', 'start', 'end']);
    });

    it('alternates an ungrouped list too', () => {
      const { el, host, detect } = mount();

      host.groupBy.set('none');
      host.placement.set('alternate');
      detect();

      expect(sides(el)).toEqual(['start', 'end', 'start', 'end']);
    });
  });

  describe('activity never alternates', () => {
    it('resolves every row to the start side', () => {
      const { el, host, detect } = mount();

      host.mode.set('activity');
      host.placement.set('alternate');
      detect();

      expect(sides(el)).toEqual(['start', 'start', 'start', 'start']);
    });

    it('keeps the attribute on the host, so the CSS can see the conflict', () => {
      const { el, host, detect } = mount();

      host.mode.set('activity');
      host.placement.set('alternate');
      detect();

      const timeline = el.querySelector('cngx-timeline');
      expect(timeline?.getAttribute('data-placement')).toBe('alternate');
      expect(timeline?.getAttribute('data-mode')).toBe('activity');
    });

    it('warns exactly once in dev mode instead of ignoring the input silently', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({ imports: [LayoutHost] });
      const fixture = TestBed.createComponent(LayoutHost);
      fixture.componentInstance.mode.set('activity');
      fixture.componentInstance.placement.set('alternate');
      fixture.detectChanges();
      await fixture.whenStable();

      const hits = warn.mock.calls.filter(([first]) =>
        String(first).includes('placement="alternate" is ignored'),
      );
      expect(hits).toHaveLength(1);
    });

    it('stays silent for every supported combination', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({ imports: [LayoutHost] });
      const fixture = TestBed.createComponent(LayoutHost);
      fixture.componentInstance.placement.set('alternate');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        warn.mock.calls.filter(([first]) => String(first).includes('placement="alternate"')),
      ).toHaveLength(0);
    });
  });

  describe('ARIA chain is placement-blind', () => {
    it.each(PLACEMENTS)('keeps the grouped role triple identical under "%s"', (placement) => {
      const { el, host, detect } = mount();

      host.placement.set(placement);
      detect();

      expect(roles(el)).toEqual(['group', null, 'list']);
      expect(el.querySelectorAll('[role="listitem"]')).toHaveLength(4);
    });

    it.each(PLACEMENTS)('keeps the ungrouped role triple identical under "%s"', (placement) => {
      const { el, host, detect } = mount();

      host.groupBy.set('none');
      host.placement.set(placement);
      detect();

      expect(roles(el)).toEqual(['list', 'presentation', 'presentation']);
      expect(el.querySelectorAll('[role="listitem"]')).toHaveLength(4);
    });

    it('adds no ARIA of its own to the row wrapper beyond listitem', () => {
      const { el, host, detect } = mount();

      host.placement.set('alternate');
      detect();
      const row = el.querySelector('.cngx-timeline__item');

      expect(row?.getAttribute('role')).toBe('listitem');
      expect(row?.hasAttribute('aria-hidden')).toBe(false);
      expect(row?.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('skeleton branch', () => {
    // The skeleton container gates on show-delay / min-dwell timers, so the
    // placeholder never appears inside a synchronous spec without them.
    // Scoped to this block on purpose: the dev-warning specs above drive
    // afterNextRender through whenStable(), which does not mix with a faked
    // clock.
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Drives the organism into its first-load placeholder body. */
    function loading(placement: CngxTimelinePlacement): {
      el: HTMLElement;
      host: LayoutHost;
    } {
      const mounted = mount();
      mounted.host.placement.set(placement);
      const state = createManualState<readonly Event[]>();
      mounted.host.state.set(state);
      state.set('loading');
      // Twice: the first pass swaps the branch in and creates the container,
      // the second lets its show-delay elapse. One pass would advance the
      // clock before the container exists to start its timer.
      for (let pass = 0; pass < 2; pass++) {
        vi.advanceTimersByTime(1000);
        mounted.detect();
      }
      return { el: mounted.el, host: mounted.host };
    }

    /** `data-row-side` of every placeholder row, in DOM order. */
    function placeholderSides(el: HTMLElement): readonly (string | null)[] {
      return Array.from(el.querySelectorAll('.cngx-timeline__skeleton-row'), (row) =>
        row.getAttribute('data-row-side'),
      );
    }

    it.each(PLACEMENTS)('renders placeholder rows under "%s"', (placement) => {
      const { el } = loading(placement);

      expect(el.querySelectorAll('.cngx-timeline__skeleton-row').length).toBe(4);
    });

    it('mirrors the content parity, so the swap has nothing to jump between', () => {
      const { el } = loading('alternate');

      expect(placeholderSides(el)).toEqual(['start', 'end', 'start', 'end']);
    });

    it('mirrors placement="end" too', () => {
      const { el } = loading('end');

      expect(placeholderSides(el)).toEqual(['end', 'end', 'end', 'end']);
    });

    it('lands every placeholder on the start side by default', () => {
      const { el } = loading('start');

      expect(placeholderSides(el)).toEqual(['start', 'start', 'start', 'start']);
    });

    it('keeps activity single-sided in the placeholder too', () => {
      const mounted = mount();
      mounted.host.mode.set('activity');
      mounted.host.placement.set('alternate');
      const state = createManualState<readonly Event[]>();
      mounted.host.state.set(state);
      state.set('loading');
      for (let pass = 0; pass < 2; pass++) {
        vi.advanceTimersByTime(1000);
        mounted.detect();
      }

      // Same rowSide() the content rows use, so the two cannot disagree.
      expect(placeholderSides(mounted.el)).toEqual(['start', 'start', 'start', 'start']);
    });
  });
});
