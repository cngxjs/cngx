import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, gridTracks, rasterise, type Rgba } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCardBadge } from './card-badge.directive';
import { CngxCardMedia } from './card-media.directive';
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

const BLUE = 'oklch(0.55 0.15 250)';
const EMBER = 'oklch(0.66 0.19 50)';

@Component({
  standalone: true,
  imports: [CngxCard, CngxCardBadge],
  template: `
    <div class="default">
      <cngx-card as="button" [selectable]="true" [selected]="true">
        <span cngxCardBadge intent="primary">P</span>
      </cngx-card>
    </div>
    <div class="branded" style="--cngx-color-primary: oklch(0.55 0.15 250)">
      <cngx-card as="button" [selectable]="true" [selected]="true">
        <span cngxCardBadge intent="primary">P</span>
      </cngx-card>
    </div>
    <div
      class="branded-dark"
      data-color-scheme="dark"
      style="--cngx-color-primary: oklch(0.55 0.15 250)"
    >
      <cngx-card as="button" [selectable]="true" [selected]="true">Dark</cngx-card>
    </div>
    <div class="achromatic" style="--cngx-color-primary: oklch(0.5 0 0)">
      <cngx-card as="button" [selectable]="true" [selected]="true">Grey</cngx-card>
    </div>
  `,
})
class PrimaryCardHost {}

@Component({
  standalone: true,
  imports: [CngxCard, CngxCardBadge, CngxCardMedia],
  template: `
    <div
      style="--cngx-radius-lg: 20px; --cngx-radius-pill: 6px;
        --cngx-color-danger: rgb(200, 10, 10); --cngx-color-warning: rgb(200, 150, 10);
        --cngx-color-success: rgb(10, 150, 10); --cngx-color-text-muted: rgb(90, 90, 90)"
    >
      <cngx-card as="button" [selectable]="true" [selected]="true">
        <div cngxCardMedia></div>
        <span cngxCardBadge intent="danger">D</span>
        <span cngxCardBadge intent="warning">W</span>
        <span cngxCardBadge intent="success">S</span>
        <span cngxCardBadge intent="neutral">N</span>
      </cngx-card>
    </div>
  `,
})
class ThemedCardHost {}

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

// Focus ring, selected border and primary badge fall back to the primary at the
// use site; a registered initial-value would shadow that fallback and paint
// Ember under any brand.
describe('CngxCard primary tokens', () => {
  function mountPrimary(): HTMLElement {
    const fixture = TestBed.createComponent(PrimaryCardHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    return mountedRoot;
  }
  const one = (root: HTMLElement, selector: string): HTMLElement => {
    const el = root.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`${selector} did not render`);
    }
    return el;
  };
  const colour = (root: HTMLElement, selector: string, property: string): Rgba =>
    rasterise(computedValue(one(root, selector), property));

  it('paints the selected border with the primary in scope', () => {
    const root = mountPrimary();
    expect(colour(root, '.branded .cngx-card', 'border-top-color')).toEqual(rasterise(BLUE));
    expect(colour(root, '.default .cngx-card', 'border-top-color')).toEqual(rasterise(EMBER));
  });

  it('tints the selected surface in the hue of the primary in scope', () => {
    const root = mountPrimary();
    const surface = (scope: string): Rgba =>
      colour(root, `${scope} .cngx-card`, 'background-color');
    expect(surface('.branded')).toEqual(rasterise('oklch(0.96 0.04 250)'));
    expect(surface('.default')).toEqual(rasterise('oklch(0.96 0.04 50)'));
    expect(surface('.branded-dark')).toEqual(rasterise('oklch(0.36 0.06 250)'));
    // An achromatic primary has no hue to borrow; the tint stays neutral.
    expect(surface('.achromatic')).toEqual(rasterise('oklch(0.96 0 0)'));
  });

  it('paints the focus ring with the primary in scope', () => {
    const root = mountPrimary();
    one(root, '.branded .cngx-card').focus();
    expect(colour(root, '.branded .cngx-card', 'outline-color')).toEqual(rasterise(BLUE));
    one(root, '.default .cngx-card').focus();
    expect(colour(root, '.default .cngx-card', 'outline-color')).toEqual(rasterise(EMBER));
  });

  it('paints the primary badge with the primary in scope', () => {
    const root = mountPrimary();
    const badge = '.cngx-card__badge--intent-primary';
    expect(colour(root, `.branded ${badge}`, 'background-color')).toEqual(rasterise(BLUE));
    expect(colour(root, `.default ${badge}`, 'background-color')).toEqual(rasterise(EMBER));
  });
});

// Radius and badge fills are registered with a fixed initial, so a use-site
// fallback never paints: the theme reaches them only through the SET.
describe('CngxCard theme-derived tokens', () => {
  it('derives the corner radius on every element that reads it', () => {
    const card = mount(ThemedCardHost, '.cngx-card');
    expect(computedValue(card, 'border-top-left-radius')).toBe('20px');
    const media = card.querySelector('.cngx-card__media') as HTMLElement;
    expect(computedValue(media, 'border-top-left-radius')).toBe('20px');
    expect(getComputedStyle(card, '::before').insetBlockStart).toBe('20px');
  });

  it('derives the badge fills and radius from the theme', () => {
    const card = mount(ThemedCardHost, '.cngx-card');
    const badge = (intent: string): HTMLElement =>
      card.querySelector(`.cngx-card__badge--intent-${intent}`) as HTMLElement;
    expect(rasterise(computedValue(badge('danger'), 'background-color'))).toEqual(
      rasterise('rgb(200, 10, 10)'),
    );
    expect(rasterise(computedValue(badge('warning'), 'background-color'))).toEqual(
      rasterise('rgb(200, 150, 10)'),
    );
    expect(rasterise(computedValue(badge('success'), 'background-color'))).toEqual(
      rasterise('rgb(10, 150, 10)'),
    );
    expect(rasterise(computedValue(badge('neutral'), 'background-color'))).toEqual(
      rasterise('rgb(90, 90, 90)'),
    );
    expect(computedValue(badge('danger'), 'border-top-left-radius')).toBe('6px');
  });
});
