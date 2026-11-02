import { Component, input, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as utils from '@cngx/utils';
import type { CngxIconData } from '@cngx/utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, page } from 'vitest/browser';

import { CngxIconSvg } from './icon-svg.component';

// Runs in a real Chromium (the `test-geometry` target) at devicePixelRatio 1,
// pinned through CDP: the micro drawings exist so a 12px glyph paints on whole
// device pixels. The readback counts anti-aliased pixels (neither pure black
// nor pure white) of a black glyph on white, so it measures real raster output,
// not computed style.

const MICRO_ICONS = Object.entries(utils)
  .filter(([name]) => name.startsWith('CNGX_ICON_'))
  .map(([name, icon]) => [name, icon as CngxIconData] as const)
  .filter(([, icon]) => icon.micro !== undefined);

// Straight edges on whole units: nothing may anti-alias. Every other glyph has
// a diagonal or an arc, which anti-aliases on any grid, so it is held to "not
// worse than the 24-grid path in the same box".
const RECTILINEAR = [
  'CNGX_ICON_PLUS',
  'CNGX_ICON_MINUS',
  'CNGX_ICON_EXCLAMATION',
  'CNGX_ICON_EXCLAMATION_SOLID',
  'CNGX_ICON_INFO',
  'CNGX_ICON_MORE_HORIZONTAL',
] as const;

// Signed-off drawings that anti-alias more than their 24-grid path: 1.41-unit
// diagonal strips (X, CHECK) and a ring crossed by a slash (BAN) straddle pixel
// boundaries on any whole-unit grid. Measured ceilings keep them from getting
// worse without redrawing what the sheet signed off.
const MEASURED_CEILINGS: Readonly<Record<string, number>> = {
  CNGX_ICON_X: 30,
  CNGX_ICON_CHECK: 20,
  CNGX_ICON_BAN: 61,
};

@Component({
  selector: 'cngx-icon-micro-pixels-host',
  standalone: true,
  imports: [CngxIconSvg],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-icon-glyph.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="display: flex; flex-direction: column; gap: 4px; padding: 4px; inline-size: max-content; background: rgb(255, 255, 255); color: rgb(0, 0, 0)"
    >
      <svg class="micro" style="--cngx-icon-svg-size: 12px; display: block" [cngxIconSvg]="icon()"></svg>
      <svg class="path24" style="--cngx-icon-svg-size: 12px; display: block" [cngxIconSvg]="withoutMicro()"></svg>
    </div>
  `,
})
class IconMicroPixelsHost {
  readonly icon = input.required<CngxIconData>();

  protected withoutMicro(): CngxIconData {
    const { micro: _micro, ...rest } = this.icon();
    return rest;
  }
}

let mountedRoot: HTMLElement | null = null;

function mount(icon: CngxIconData): { micro: SVGSVGElement; path24: SVGSVGElement } {
  const fixture = TestBed.createComponent(IconMicroPixelsHost);
  fixture.componentRef.setInput('icon', icon);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return {
    micro: mountedRoot.querySelector('svg.micro') as SVGSVGElement,
    path24: mountedRoot.querySelector('svg.path24') as SVGSVGElement,
  };
}

/** Pixels that are neither pure black nor pure white, i.e. anti-aliased. */
async function antiAliasedPixels(element: Element): Promise<number> {
  const base64 = await page.screenshot({ element, save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  expect(image.width).toBe(12);
  expect(image.height).toBe(12);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let count = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const luminance = (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
    if (luminance > 0 && luminance < 255) {
      count++;
    }
  }
  return count;
}

beforeEach(async () => {
  await cdp().send('Emulation.setDeviceMetricsOverride', {
    width: window.innerWidth,
    height: window.innerHeight,
    deviceScaleFactor: 1,
    mobile: false,
  });
  expect(window.devicePixelRatio).toBe(1);
});

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.clearDeviceMetricsOverride');
});

describe('micro icon pixels at DPR 1', () => {
  it('covers every micro-carrying icon', () => {
    // The set only gains micro drawings; a shrinking list means the readback went vacuous.
    expect(MICRO_ICONS.length).toBeGreaterThanOrEqual(18);
  });

  it.each(MICRO_ICONS)('%s shows the micro path in the 12px box', (_, icon) => {
    const { micro } = mount(icon);
    expect(getComputedStyle(micro.querySelector('.cngx-icon-svg__micro')!).display).not.toBe('none');
    expect(getComputedStyle(micro.querySelector('.cngx-icon-svg__path')!).display).toBe('none');
  });

  it.each(MICRO_ICONS)('%s keeps its anti-aliased pixels within the 24-grid path or its measured ceiling', async (name, icon) => {
    const { micro, path24 } = mount(icon);
    const microCount = await antiAliasedPixels(micro);
    const path24Count = await antiAliasedPixels(path24);
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

  it.each(RECTILINEAR)('%s paints on whole pixels only', async (name) => {
    const icon = (utils as unknown as Record<string, CngxIconData>)[name];
    const { micro } = mount(icon);
    expect(await antiAliasedPixels(micro)).toBe(0);
  });
});
