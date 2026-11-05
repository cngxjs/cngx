import { Component, input, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as utils from '@cngx/utils';
import type { CngxIconData } from '@cngx/utils';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxIconSvg } from './icon-svg.component';

// Runs in a real Chromium (the `test-geometry` target). The micro drawings
// exist so a 12px glyph paints on whole device pixels. Each drawing is
// rasterised into a 12x12 canvas, black on white, and the anti-aliased pixels
// (neither pure black nor pure white) are counted, so the proof measures real
// raster output, not computed style. The canvas is one canvas pixel per CSS
// pixel at any devicePixelRatio, and it depends on no page layout, viewport or
// pointer, which is what makes it stable in CI.

const MICRO_ICONS = Object.entries(utils)
  .filter(([name]) => name.startsWith('CNGX_ICON_'))
  .map(([name, icon]) => [name, icon as CngxIconData] as const)
  .filter(([, icon]) => icon.micro !== null);

const NO_MICRO_ICONS = Object.entries(utils)
  .filter(([name]) => name.startsWith('CNGX_ICON_'))
  .map(([name, icon]) => [name, icon as CngxIconData] as const)
  .filter(([, icon]) => icon.micro === null);

// Straight edges on whole units: nothing may anti-alias. Every other glyph has
// a diagonal or an arc, which anti-aliases on any grid, so it is held to "not
// worse than the 24-grid path in the same box".
const RECTILINEAR = [
  'CNGX_ICON_PLUS',
  'CNGX_ICON_MENU',
  'CNGX_ICON_MINUS',
  'CNGX_ICON_EXCLAMATION',
  'CNGX_ICON_EXCLAMATION_SOLID',
  'CNGX_ICON_INFO',
  'CNGX_ICON_MORE_HORIZONTAL',
  'CNGX_ICON_MORE_VERTICAL',
  'CNGX_ICON_GRIP_VERTICAL',
  'CNGX_ICON_COPY',
  'CNGX_ICON_CLIPBOARD',
  'CNGX_ICON_MAXIMIZE',
  'CNGX_ICON_ARCHIVE',
] as const;

// Signed-off drawings that anti-alias more than their 24-grid path: 1.41-unit
// diagonal strips (X, CHECK) straddle pixel boundaries on any whole-unit grid,
// and BAN's 1.5-unit ring and slash carry more edge than the 24-grid hairlines
// (they paint full-weight pixels the hairlines never reach). The magnifier lens
// is centred on 5.5 so its plus and minus centre in the hole, which puts the
// whole ring between pixels; the pencil's diagonal body ties its 24-grid path.
// Measured ceilings keep them from getting worse without redrawing what the
// sheet signed off.
const MEASURED_CEILINGS: Readonly<Record<string, number>> = {
  CNGX_ICON_X: 30,
  CNGX_ICON_CHECK: 20,
  CNGX_ICON_BAN: 87,
  CNGX_ICON_SEARCH: 57,
  CNGX_ICON_ZOOM_IN: 57,
  CNGX_ICON_ZOOM_OUT: 57,
  CNGX_ICON_PENCIL: 19,
};

const SMALL_ICONS = Object.entries(utils)
  .filter(([name]) => name.startsWith('CNGX_ICON_'))
  .map(([name, icon]) => [name, icon as CngxIconData] as const)
  .filter(([, icon]) => icon.small !== null);

// Straight edges on whole units in the 16 box: nothing may anti-alias. MINUS is
// the only rectilinear small drawing; every other band glyph has a diagonal or
// an arc and is held to "not worse than the 24-grid path in the same box".
const RECTILINEAR_SMALL = ['CNGX_ICON_MINUS', 'CNGX_ICON_MENU'] as const;

// Signed-off 16-grid drawings whose anti-aliased pixel count edges past their
// 24-grid path in a 16px box: X is a 1-unit diagonal strip that straddles pixel
// boundaries on the whole-unit grid (38 vs 36). Every other band glyph stays at
// or under its 24 path. The measured ceiling keeps X from getting worse without
// redrawing what the sheet signed off. (CHECK and BAN carry no small drawing -
// the 1x smoke kept them on the 24-grid path.)
const MEASURED_CEILINGS_SMALL: Readonly<Record<string, number>> = {
  CNGX_ICON_X: 38,
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const BOX = 12;
const BOX16 = 16;

@Component({
  selector: 'cngx-icon-micro-pixels-host',
  standalone: true,
  imports: [CngxIconSvg],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-icon-glyph.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg class="micro" style="--cngx-icon-svg-size: 12px; display: block" [cngxIconSvg]="icon()"></svg>
  `,
})
class IconMicroPixelsHost {
  readonly icon = input.required<CngxIconData>();
}

let mountedRoot: HTMLElement | null = null;

function mount(icon: CngxIconData): SVGSVGElement {
  const fixture = TestBed.createComponent(IconMicroPixelsHost);
  fixture.componentRef.setInput('icon', icon);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot.querySelector('svg.micro') as SVGSVGElement;
}

/**
 * The 24-grid path in a 12px box, with the paint contract of the shipped
 * renderer (`icon-svg.component.css`): a stroke icon is a 2-unit round-capped
 * outline, a fill icon fills its area.
 */
function path24Markup(icon: CngxIconData, box = BOX): string {
  const paint =
    icon.paint === 'stroke'
      ? 'fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
      : 'fill="#000"';
  return `<svg xmlns="${SVG_NS}" width="${box}" height="${box}" viewBox="${icon.viewBox}"><path ${paint} d="${icon.d}"/></svg>`;
}

function microMarkup(icon: CngxIconData): string {
  const micro = icon.micro!;
  return `<svg xmlns="${SVG_NS}" width="${BOX}" height="${BOX}" viewBox="${micro.viewBox}"><path fill="#000" d="${micro.d}"/></svg>`;
}

function smallMarkup(icon: CngxIconData): string {
  const small = icon.small!;
  return `<svg xmlns="${SVG_NS}" width="${BOX16}" height="${BOX16}" viewBox="${small.viewBox}"><path fill="#000" d="${small.d}"/></svg>`;
}

/** Pixels that are neither pure black nor pure white, i.e. anti-aliased. */
async function antiAliasedPixels(markup: string, box = BOX): Promise<number> {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = box;
  canvas.height = box;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, box, box);
  context.drawImage(image, 0, 0, box, box);
  const { data } = context.getImageData(0, 0, box, box);
  let count = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const luminance = (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
    if (luminance > 0 && luminance < 255) {
      count++;
    }
  }
  return count;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('micro icon pixels in a 12px box', () => {
  it('covers every micro-carrying icon', () => {
    // The set only gains micro drawings; a shrinking list means the readback went vacuous.
    expect(MICRO_ICONS.length).toBeGreaterThanOrEqual(39);
  });

  it.each(MICRO_ICONS)('%s shows the micro path in the 12px box', (_, icon) => {
    const micro = mount(icon);
    expect(getComputedStyle(micro.querySelector('.cngx-icon-svg__micro')!).display).not.toBe('none');
    expect(getComputedStyle(micro.querySelector('.cngx-icon-svg__path')!).display).toBe('none');
  });

  it.each(MICRO_ICONS)('%s keeps its anti-aliased pixels within the 24-grid path or its measured ceiling', async (name, icon) => {
    const microCount = await antiAliasedPixels(microMarkup(icon));
    const path24Count = await antiAliasedPixels(path24Markup(icon));
    const ceiling = MEASURED_CEILINGS[name];
    if (ceiling !== undefined) {
      expect(microCount, `${name} micro vs measured ceiling`).toBeLessThanOrEqual(ceiling);
      return;
    }
    const hasArc = /A/.test(icon.micro!.d);
    if (hasArc) {
      expect(microCount, `${name} micro vs 24 path`).toBeLessThanOrEqual(path24Count);
      return;
    }
    expect(microCount, `${name} micro vs 24 path`).toBeLessThan(path24Count);
  });

  it('finds the icons that keep the 24-grid path', () => {
    expect(NO_MICRO_ICONS.map(([name]) => name).sort()).toEqual([
      'CNGX_ICON_QUESTION',
      'CNGX_ICON_X_CIRCLE',
    ]);
  });

  it.each(NO_MICRO_ICONS)('%s keeps the 24-grid path in the 12px box', (_, icon) => {
    const svg = mount(icon);
    expect(svg.querySelector('.cngx-icon-svg__micro')).toBeNull();
    expect(getComputedStyle(svg.querySelector('.cngx-icon-svg__path')!).display).not.toBe('none');
  });

  it.each(RECTILINEAR)('%s paints on whole pixels only', async (name) => {
    const icon = (utils as unknown as Record<string, CngxIconData>)[name];
    expect(await antiAliasedPixels(microMarkup(icon))).toBe(0);
  });
});

describe('small icon pixels in a 16px box', () => {
  it('covers every small-carrying icon', () => {
    // The six band glyphs that carry a small drawing (CHECK, BAN and CARET_DOWN
    // stay on the 24-grid path); a shorter list means the readback went vacuous.
    expect(SMALL_ICONS.length).toBeGreaterThanOrEqual(6);
  });

  it.each(SMALL_ICONS)('%s keeps its anti-aliased pixels within the 24-grid path or its measured ceiling', async (name, icon) => {
    const smallCount = await antiAliasedPixels(smallMarkup(icon), BOX16);
    const path24Count = await antiAliasedPixels(path24Markup(icon, BOX16), BOX16);
    const ceiling = MEASURED_CEILINGS_SMALL[name];
    if (ceiling !== undefined) {
      expect(smallCount, `${name} small vs measured ceiling`).toBeLessThanOrEqual(ceiling);
      return;
    }
    expect(smallCount, `${name} small vs 24 path`).toBeLessThanOrEqual(path24Count);
  });

  it.each(RECTILINEAR_SMALL)('%s paints on whole pixels only', async (name) => {
    const icon = (utils as unknown as Record<string, CngxIconData>)[name];
    expect(await antiAliasedPixels(smallMarkup(icon), BOX16)).toBe(0);
  });
});
