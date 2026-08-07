import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, gridTracks } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCard } from './card.component';
import { CngxCardGrid } from './card-grid.component';
import { CngxCardSkeleton } from './card-skeleton.component';

// Runs in a real Chromium (the `test-geometry` target). Three co-located
// `@scope` stylesheets in the card folder, each `''` under jsdom:
//
//   1. `.cngx-card` (card.component.css:659) - the block surface is a
//      positioned anchor so an absolutely-placed `.cngx-card__badge` corner
//      resolves against it, and the touch floor lifts `min-height` off the
//      `--cngx-target-min` token past the 44px baseline.
//   2. `.cngx-card-grid` (card-grid.component.css:49) - an `auto-fill` +
//      `minmax()` grid that reflows into intrinsic columns with no media
//      query, and a `--comfortable` density that re-pins the gap from the
//      scale.
//   3. `.cngx-card-skeleton` (card-skeleton.component.css:122) - a vertical
//      flex stack whose gap derives from `--cngx-space-*`.

let mountedRoot: HTMLElement | null = null;

function mount<T>(type: new () => T, selector: string): HTMLElement {
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = (mountedRoot.matches(selector) ? mountedRoot : mountedRoot.querySelector(selector)) as
    | HTMLElement
    | null;
  if (!host) {
    throw new Error(`${selector} did not render`);
  }
  return host;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

@Component({
  standalone: true,
  imports: [CngxCard],
  template: `<cngx-card>Body</cngx-card>`,
})
class CardHost {}

@Component({
  standalone: true,
  imports: [CngxCardGrid],
  // Explicit width + minWidth make the auto-fill column count deterministic.
  template: `<cngx-card-grid
    [minWidth]="'200px'"
    [density]="density"
    style="width: 900px; display: grid"
  ></cngx-card-grid>`,
})
class GridHost {
  density: 'default' | 'comfortable' = 'default';
}

@Component({
  standalone: true,
  imports: [CngxCardSkeleton],
  template: `<cngx-card-skeleton [lines]="3" [showMedia]="true" />`,
})
class SkeletonHost {}

describe('CngxCard geometry', () => {
  it('is a block surface that positions its badge anchor', () => {
    const host = mount(CardHost, '.cngx-card');
    expect(computedValue(host, 'display')).toBe('block');
    // The badge corner is absolutely placed against the card, so the card
    // must be the positioned containing block.
    expect(computedValue(host, 'position')).toBe('relative');
  });

  it('floors the card height off the pointer-derived target', () => {
    const host = mount(CardHost, '.cngx-card');
    // min-height is max(44px, --cngx-target-min): the 64px floor exceeds the
    // 44px baseline, so it wins.
    host.style.setProperty('--cngx-target-min', '64px');
    expect(computedValue(host, 'min-height')).toBe('64px');
  });
});

describe('CngxCardGrid geometry', () => {
  it('reflows into multiple intrinsic columns without a media query', () => {
    const grid = mount(GridHost, '.cngx-card-grid');
    expect(computedValue(grid, 'display')).toBe('grid');
    // auto-fill + minmax(200px, 1fr) packs several columns into the 900px
    // container; every resolved track is a used pixel length.
    const tracks = gridTracks(grid, 'columns');
    expect(tracks.length).toBeGreaterThan(1);
    for (const track of tracks) {
      expect(track).toMatch(/px$/);
    }
  });

  it('re-pins the gap from the scale in the comfortable density', () => {
    const fixture = TestBed.createComponent(GridHost);
    fixture.componentInstance.density = 'comfortable';
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const grid = mountedRoot.querySelector('.cngx-card-grid') as HTMLElement;
    // --comfortable SETs --cngx-card-grid-gap to var(--cngx-space-lg); driving
    // the scale token mimics what a density ancestor does to the gap.
    grid.style.setProperty('--cngx-space-lg', '30px');
    expect(computedValue(grid, 'gap')).toBe('30px');
  });
});

describe('CngxCardSkeleton geometry', () => {
  it('stacks the placeholder bars vertically with a scale-derived gap', () => {
    const host = mount(SkeletonHost, '.cngx-card-skeleton');
    expect(computedValue(host, 'display')).toBe('flex');
    expect(computedValue(host, 'flex-direction')).toBe('column');
    // :scope SETs --cngx-skeleton-gap to var(--cngx-space-sm), so the stack
    // gap tracks the scale token.
    host.style.setProperty('--cngx-space-sm', '20px');
    expect(computedValue(host, 'gap')).toBe('20px');
  });
});
