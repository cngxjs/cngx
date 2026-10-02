/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxChartLegend } from './legend/legend.component';
import { CngxBullet } from './presets/bullet.component';
import { CngxDeviationBar } from './presets/deviation-bar.component';
import { CngxDonut } from './presets/donut.component';
import { CngxMiniBar } from './presets/mini-bar.component';
import { CngxStackedBar } from './presets/stacked-bar.component';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors the
// div presets and the legend swatches are painted with background only and used
// to flatten into Canvas. Tracks are now Canvas under a ring overlay (an own
// outline would sit below the positioned marks), values CanvasText, bullet
// ranges carry a GrayText end tick, and stacked segments and legend swatches
// share one four-step pattern cycle by index (solid, 45deg hatch, hollow, 0deg
// hatch) so a legend entry still points at its segment.

const SCHEMES = ['light', 'dark'] as const;
const SEGMENTS = [
  { value: 1, label: 'a', color: '#d2452f' },
  { value: 1, label: 'b', color: '#1f9d55' },
  { value: 1, label: 'c', color: '#3b82f6' },
  { value: 1, label: 'd', color: '#f59e0b' },
  { value: 1, label: 'e', color: '#8b5cf6' },
];
const RANGES = [
  { from: 0, to: 50, color: '#d2452f' },
  { from: 50, to: 100, color: '#1f9d55' },
];

@Component({
  selector: 'cngx-chart-forced-host',
  standalone: true,
  imports: [CngxMiniBar, CngxBullet, CngxDeviationBar, CngxDonut, CngxStackedBar, CngxChartLegend],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-mini-bar class="mb" [value]="40" />
    <cngx-bullet class="bl" [actual]="60" [target]="80" [max]="100" [ranges]="ranges" />
    <cngx-deviation-bar class="dv" [value]="30" />
    <cngx-stacked-bar class="sb" [segments]="segments" />
    <cngx-chart-legend class="lg" [items]="segments" />
    <cngx-donut class="dn" [value]="40" style="--cngx-donut-color: rgb(200, 0, 0)" />
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class ChartHost {
  protected readonly segments = SEGMENTS;
  protected readonly ranges = RANGES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ChartHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function all(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

const paint = (el: HTMLElement): string =>
  ['background-color', 'background-image', 'box-shadow'].map((p) => computedValue(el, p)).join('|');

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('chart presets under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string => computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('rings every track as Canvas with an inset CanvasText overlay above the marks', async () => {
    const root = await mountForced();
    for (const track of [
      '.mb .cngx-mini-bar__track',
      '.bl .cngx-bullet__track',
      '.dv .cngx-deviation-bar__track',
      '.sb .cngx-stacked-bar__track',
    ]) {
      const el = one(root, track);
      expect(computedValue(el, 'background-color')).toBe(probe(root, 'canvas'));
      const ring = getComputedStyle(el, '::after');
      expect(ring.getPropertyValue('position')).toBe('absolute');
      expect(ring.getPropertyValue('box-shadow')).toBe(`${probe(root, 'canvastext')} 0px 0px 0px 1px inset`);
    }
  });

  it('paints every value mark in opaque CanvasText', async () => {
    const root = await mountForced();
    for (const mark of [
      '.mb .cngx-mini-bar__fill',
      '.bl .cngx-bullet__actual',
      '.bl .cngx-bullet__target',
      '.dv .cngx-deviation-bar__fill',
      '.dv .cngx-deviation-bar__baseline',
    ]) {
      const el = one(root, mark);
      expect(computedValue(el, 'background-color')).toBe(probe(root, 'canvastext'));
      expect(computedValue(el, 'opacity')).toBe('1');
    }
  });

  it('separates the bullet ranges with a GrayText end tick on Canvas', async () => {
    const root = await mountForced();
    for (const range of all(root, '.bl .cngx-bullet__range')) {
      expect(computedValue(range, 'background-color')).toBe(probe(root, 'canvas'));
      expect(computedValue(range, 'box-shadow')).toContain(probe(root, 'gray'));
      expect(computedValue(range, 'opacity')).toBe('1');
    }
  });

  it('cycles the stacked segments through four patterns by index', async () => {
    const root = await mountForced();
    const ink = probe(root, 'canvastext');
    const canvas = probe(root, 'canvas');
    const segs = all(root, '.sb .cngx-stacked-bar__segment');
    expect(segs).toHaveLength(5);

    expect(computedValue(segs[0], 'background-color')).toBe(ink);
    expect(computedValue(segs[0], 'background-image')).toBe('none');
    expect(computedValue(segs[1], 'background-image')).toContain('45deg');
    expect(computedValue(segs[2], 'background-color')).toBe(canvas);
    expect(computedValue(segs[2], 'box-shadow')).toContain(ink);
    expect(computedValue(segs[3], 'background-image')).toContain('repeating-linear-gradient');
    expect(computedValue(segs[3], 'background-image')).not.toContain('45deg');
    expect(new Set(segs.slice(0, 4).map(paint)).size).toBe(4);
    expect(paint(segs[4])).toBe(paint(segs[0]));
    for (const seg of segs) {
      expect(computedValue(seg, 'box-shadow')).toContain(`${canvas} -2px 0px 0px 0px inset`);
    }
  });

  it('gives each legend swatch the pattern of the segment with the same index', async () => {
    const root = await mountForced();
    const ink = probe(root, 'canvastext');
    const canvas = probe(root, 'canvas');
    const swatches = all(root, '.lg .cngx-chart-legend__swatch');
    const segs = all(root, '.sb .cngx-stacked-bar__segment');
    expect(swatches).toHaveLength(5);
    swatches.forEach((swatch, i) => {
      const fill = ['background-color', 'background-image'].map((p) => computedValue(swatch, p)).join('|');
      const segFill = ['background-color', 'background-image'].map((p) => computedValue(segs[i], p)).join('|');
      expect(fill).toBe(segFill);
    });
    expect(computedValue(swatches[0], 'background-color')).toBe(ink);
    expect(computedValue(swatches[2], 'background-color')).toBe(canvas);
    expect(computedValue(swatches[2], 'box-shadow')).toContain(ink);
  });

  it('draws the donut arc solid CanvasText over a dashed CanvasText track', async () => {
    const root = await mountForced();
    const ink = probe(root, 'canvastext');
    const arc = one(root, '.dn .cngx-donut__fill');
    const track = one(root, '.dn .cngx-donut__track');
    expect(computedValue(arc, 'stroke')).toBe(ink);
    expect(computedValue(track, 'stroke')).toBe(ink);
    expect(computedValue(track, 'stroke-dasharray')).toBe('2px, 3px');
    expect(computedValue(track, 'stroke-opacity')).toBe('0.6');
  });
});

describe('chart presets without forced colors', () => {
  it('keeps the author paint: no ring, inline series colours', () => {
    const root = mount();
    expect(getComputedStyle(one(root, '.mb .cngx-mini-bar__track'), '::after').getPropertyValue('content')).toBe('none');
    expect(computedValue(one(root, '.sb .cngx-stacked-bar__segment'), 'background-color')).toBe('rgb(210, 69, 47)');
    expect(computedValue(one(root, '.sb .cngx-stacked-bar__segment'), 'box-shadow')).toBe('none');
    expect(computedValue(one(root, '.lg .cngx-chart-legend__swatch'), 'background-color')).toBe('rgb(210, 69, 47)');
    expect(computedValue(one(root, '.bl .cngx-bullet__range'), 'opacity')).toBe('0.35');
    expect(computedValue(one(root, '.dn .cngx-donut__fill'), 'stroke')).toBe('rgb(200, 0, 0)');
    expect(computedValue(one(root, '.dn .cngx-donut__track'), 'stroke-dasharray')).toBe('none');
  });
});
