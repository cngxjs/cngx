import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStatValue, createManualState } from '@cngx/common/data';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStatCard } from './stat-card.component';
import { CngxStatCardFooter } from './stat-card-slots';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-stat-card)` block SETs (stat-card.component.css): the host is a
// positioning context (so the refresh indicator can sit out of flow), the
// content view is a centred vertical flex column that reserves a fixed body
// min-height so a skeleton -> content swap never resizes the tile in a dashboard
// grid, and the value row shares a baseline. With no `[state]` the card resolves
// to its content view. jsdom reports `''` for every one of these reads.

@Component({
  selector: 'cngx-stat-card-geometry-host',
  standalone: true,
  imports: [CngxStatCard, CngxStatValue, CngxStatCardFooter],
  template: `
    <cngx-stat-card>
      <span cngxStatValue>1.2M</span>
      <span cngxStatCardFooter>updated now</span>
    </cngx-stat-card>
  `,
})
class StatCardHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(StatCardHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-stat-card');
  if (!host) {
    throw new Error('cngx-stat-card did not render');
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

describe('CngxStatCard geometry', () => {
  it('renders the host as a positioned block', () => {
    // position: relative is the anchor the out-of-flow refresh indicator resolves
    // against; without it the indicator would escape the tile.
    const host = mount();
    expect(computedValue(host, 'display')).toBe('block');
    expect(computedValue(host, 'position')).toBe('relative');
  });

  it('lays the content view out as a centred vertical flex column with a reserved body height', () => {
    const host = mount();
    const stat = query(host, '.cngx-stat-card__stat');
    expect(computedValue(stat, 'display')).toBe('flex');
    expect(computedValue(stat, 'flex-direction')).toBe('column');
    expect(computedValue(stat, 'justify-content')).toBe('center');
    // Every view branch reserves --cngx-stat-card-body-min-height (6rem == 96px at
    // the 16px root), so a refresh does not reflow the dashboard grid.
    expect(computedValue(stat, 'min-block-size')).toBe('96px');
  });

  it('shares a baseline across the value row', () => {
    const host = mount();
    const row = query(host, '.cngx-stat-card__row');
    expect(computedValue(row, 'display')).toBe('flex');
    expect(computedValue(row, 'align-items')).toBe('baseline');
  });
});

// ── Error and stale glyphs from the shared icon set (stat-card.component.css) ──

@Component({
  selector: 'cngx-stat-card-glyph-host',
  standalone: true,
  imports: [CngxStatCard, CngxStatValue],
  template: `
    <cngx-stat-card [state]="state" style="max-width: 260px">
      <span cngxStatValue>1.2M</span>
    </cngx-stat-card>
  `,
})
class StatCardGlyphHost {
  readonly state = createManualState<number>();
}

function mountGlyphs(view: 'error' | 'stale'): HTMLElement {
  const fixture = TestBed.createComponent(StatCardGlyphHost);
  const state = fixture.componentInstance.state;
  if (view === 'stale') {
    state.setSuccess(1.2);
  } else {
    state.set('loading');
  }
  state.setError(new Error('down'));
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return query(mountedRoot, '.cngx-stat-card');
}

function strokePx(svg: SVGSVGElement): number {
  return (parseFloat(computedValue(svg, 'stroke-width')) * svg.getBoundingClientRect().width) / 24;
}

function svgIn(root: HTMLElement, selector: string): { svg: SVGSVGElement; path: SVGPathElement } {
  const svg = root.querySelector<SVGSVGElement>(selector);
  const path = svg?.querySelector('path');
  if (!svg || !path) {
    throw new Error(`${selector} renders no icon`);
  }
  return { svg, path };
}

describe('CngxStatCard glyphs', () => {
  // The drawing it replaced inked its triangle 22.4 of 24 units across at 22px
  // with a 1.5-unit line; the shared triangle spans 21.5 with that line.
  it('draws the error triangle in the 22px box with a 1.5-unit line', () => {
    const { svg, path } = svgIn(mountGlyphs('error'), 'svg.cngx-stat-card__error-icon');
    expect(svg.getBoundingClientRect().width).toBeCloseTo(22, 1);
    expect(computedValue(svg, 'stroke-width')).toBe('1.5px');
    expect(path.getBoundingClientRect().width + strokePx(svg)).toBeCloseTo((22 * 21.5) / 24, 1);
    expect(computedValue(svg, 'stroke')).toBe(computedValue(svg, 'color'));
  });

  // The bold text exclamation inked 0.54 of the 16px badge tall.
  it('draws the stale exclamation 0.54 of the badge tall, centred in it', () => {
    const host = mountGlyphs('stale');
    const badge = query(host, '.cngx-stat-card__stale-glyph');
    const { svg, path } = svgIn(badge, 'svg.cngx-icon-svg');
    const box = badge.getBoundingClientRect();
    const ink = path.getBoundingClientRect();
    expect(box.width).toBeCloseTo(16, 1);
    expect(ink.height + strokePx(svg)).toBeCloseTo(0.54 * box.height, 1);
    expect(Math.abs(ink.left + ink.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(
      0.5,
    );
    expect(Math.abs(ink.top + ink.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(
      0.5,
    );
  });

  it('scales the stale exclamation with the badge size', () => {
    const host = mountGlyphs('stale');
    const badge = query(host, '.cngx-stat-card__stale-glyph');
    const { svg } = svgIn(badge, 'svg.cngx-icon-svg');
    const before = svg.getBoundingClientRect().height;
    host.style.setProperty('--cngx-stat-card-stale-glyph-size', '2rem');
    expect(svg.getBoundingClientRect().height).toBeCloseTo(before * 2, 1);
  });

  it('paints the exclamation in the glyph colour over the danger badge', () => {
    const host = mountGlyphs('stale');
    const badge = query(host, '.cngx-stat-card__stale-glyph');
    const { svg } = svgIn(badge, 'svg.cngx-icon-svg');
    expect(computedValue(svg, 'stroke')).toBe(computedValue(badge, 'color'));
    expect(computedValue(badge, 'background-color')).not.toBe(computedValue(badge, 'color'));
    expect(badge.getAttribute('aria-hidden')).toBe('true');
  });
});
