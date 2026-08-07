import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxTimelineItemTpl } from '@cngx/common/timeline';
import type { TimelineGroupBy } from '@cngx/common/timeline';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTimeline } from './timeline.component';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-timeline)` block SETs (timeline.component.css): the host is a
// block that also declares the `cngx-timeline` inline-size query container. That
// container NAME is a cross-library contract - `@cngx/common`'s
// `timeline-item.component.css` queries that exact string to collapse
// `placement="alternate"` below 32rem - so a drift here silently disables the
// degrade. The list and its bands are vertical flex stacks. jsdom reports `''`
// for every one of these reads.

interface Event {
  readonly id: number;
  readonly at: Date;
  readonly summary: string;
}

const EVENTS: readonly Event[] = [
  { id: 1, at: new Date(2026, 6, 20, 9), summary: 'opened' },
  { id: 2, at: new Date(2026, 6, 21, 9), summary: 'reviewed' },
];

@Component({
  selector: 'cngx-timeline-geometry-host',
  standalone: true,
  imports: [CngxTimeline, CngxTimelineItemTpl],
  template: `
    <cngx-timeline
      [items]="items()"
      [dateAccessor]="at"
      [idAccessor]="byId"
      [groupBy]="groupBy()"
      aria-label="Audit trail"
    >
      <ng-template cngxTimelineItem let-i="index">{{ i }}</ng-template>
    </cngx-timeline>
  `,
})
class TimelineHost {
  readonly items = signal<readonly Event[]>(EVENTS);
  readonly groupBy = signal<TimelineGroupBy<Event>>('day');
  readonly at = (event: Event): Date => event.at;
  readonly byId = (event: Event): unknown => event.id;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TimelineHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-timeline');
  if (!host) {
    throw new Error('cngx-timeline did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxTimeline geometry', () => {
  it('declares the cross-library cngx-timeline query container', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('block');
    const container = containerState(host);
    expect(container.type).toBe('inline-size');
    // The name is API: the row stylesheet in @cngx/common queries it by string to
    // collapse the alternate placement below 32rem. A rename here breaks the
    // degrade silently, so pin it.
    expect(container.name).toBe('cngx-timeline');
  });

  it('stacks the list and its bands as vertical flex columns', () => {
    const host = mount();
    const list = query(host, '.cngx-timeline__list');
    expect(computedValue(list, 'display')).toBe('flex');
    expect(computedValue(list, 'flex-direction')).toBe('column');
    // A day-grouped feed renders a band per day; the band stacks its rows the
    // same way.
    const rows = query(host, '.cngx-timeline__rows');
    expect(computedValue(rows, 'display')).toBe('flex');
    expect(computedValue(rows, 'flex-direction')).toBe('column');
  });
});
