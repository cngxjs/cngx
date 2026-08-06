import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gridTracks, resolvedToken } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTimelineItem, CngxTimelineOpposite } from './timeline-item.component';

// The first geometry spec. It runs in a real Chromium (the `test-geometry`
// target), where `getComputedStyle` reports resolved grid tracks and custom
// properties. The default jsdom `test` target excludes `*.geometry.spec.ts`
// because there the same reads come back `''` and would pass vacuously.

@Component({
  selector: 'cngx-timeline-geometry-host',
  standalone: true,
  imports: [CngxTimelineItem, CngxTimelineOpposite],
  template: `
    <div [attr.data-mode]="mode()">
      <cngx-timeline-item>
        @if (opposite()) {
          <span cngxTimelineOpposite>2019</span>
        }
        <p>Founded</p>
      </cngx-timeline-item>
    </div>
  `,
})
class GeometryHost {
  // The organism sets [data-mode] on an ancestor; null renders the narrative
  // default. Held on the wrapper div so it is an ancestor of the row.
  readonly mode = signal<'activity' | null>(null);
  readonly opposite = signal(false);
}

let mountedRoot: HTMLElement | null = null;

function mount(): { host: GeometryHost; row: HTMLElement; detect: () => void } {
  const fixture = TestBed.createComponent(GeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  // Layout, not just render: `1fr` and the auto marker track only resolve to
  // real widths once the row is in the document.
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const row = mountedRoot.querySelector('cngx-timeline-item');
  if (!row) {
    throw new Error('cngx-timeline-item did not render');
  }
  return {
    host: fixture.componentInstance,
    row: row as HTMLElement,
    detect: () => fixture.detectChanges(),
  };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxTimelineItem geometry', () => {
  it('rasters a narrative row on two column tracks', () => {
    const { row } = mount();
    expect(gridTracks(row)).toHaveLength(2);
  });

  it('rasters an activity row on three column tracks', () => {
    const { host, row, detect } = mount();
    host.mode.set('activity');
    detect();
    expect(gridTracks(row)).toHaveLength(3);
  });

  it('derives the rail inset as half the marker size', () => {
    const { row } = mount();
    const inset = parseFloat(resolvedToken(row, '--cngx-timeline-rail-inset'));
    const marker = parseFloat(resolvedToken(row, '--cngx-timeline-marker-size'));
    expect(marker).toBeGreaterThan(0);
    expect(inset).toBeCloseTo(marker / 2, 3);
  });

  it('adds the opposite track only for a row that projects into it', () => {
    const { host, row, detect } = mount();
    expect(gridTracks(row)).toHaveLength(2);
    host.opposite.set(true);
    detect();
    expect(gridTracks(row)).toHaveLength(3);
  });
});
