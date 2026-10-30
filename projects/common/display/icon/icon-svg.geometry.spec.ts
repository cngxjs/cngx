import {
  Component,
  inject,
  Renderer2,
  RendererStyleFlags2,
  ViewEncapsulation,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { CNGX_ICON_CARET_DOWN, CNGX_ICON_X, type CngxIconData } from '@cngx/utils';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxIcon } from './icon.component';
import { CngxIconSvg } from './icon-svg.component';
import { createIconSvgElement } from './icon-svg-element';

// Runs in a real Chromium (the `test-geometry` target): paint and size come
// from the layered stylesheets, which jsdom does not compute. The context
// font size is pinned to 16px so the 1em box is exact.

@Component({
  selector: 'cngx-icon-svg-geometry-host',
  standalone: true,
  imports: [CngxIcon, CngxIconSvg],
  styleUrls: ['../../../core/theming/layers.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="font-size: 16px; color: rgb(255, 0, 0)">
      <svg class="fill" [cngxIconSvg]="caret"></svg>
      <svg class="stroke" [cngxIconSvg]="x"></svg>
      <svg class="sized" style="--cngx-icon-svg-size: 24px" [cngxIconSvg]="caret"></svg>
      <span style="--cngx-icon-svg-size: 2em; --cngx-icon-svg-stroke-width: 1.5">
        <svg class="ancestor" [cngxIconSvg]="x"></svg>
      </span>
      <cngx-icon size="lg">
        <svg class="in-icon-stroke" [cngxIconSvg]="x"></svg>
      </cngx-icon>
      <cngx-icon size="lg">
        <svg class="in-icon-fill" [cngxIconSvg]="caret"></svg>
      </cngx-icon>
    </div>
  `,
})
class IconSvgGeometryHost {
  protected readonly caret = CNGX_ICON_CARET_DOWN;
  protected readonly x = CNGX_ICON_X;
}

// Spec-local: the default set carries no micro drawing yet.
const WITH_MICRO: CngxIconData = {
  ...CNGX_ICON_X,
  micro: { viewBox: '0 0 12 12', d: 'M3 3H9V9H3Z' },
};

const BAND_SIZES = [9, 10, 12, 14, 15, 24] as const;

// Loads the global micro sheet next to the component sheet, as `cngx.css` does.
@Component({
  selector: 'cngx-icon-svg-micro-geometry-host',
  standalone: true,
  imports: [CngxIcon, CngxIconSvg],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-icon-glyph.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="font-size: 16px; color: rgb(255, 0, 0)">
      @for (size of sizes; track size) {
        <svg
          class="band-{{ size }}"
          [style.--cngx-icon-svg-size.px]="size"
          [cngxIconSvg]="icon"
        ></svg>
      }
      <cngx-icon size="xs">
        <svg class="in-icon-xs" [cngxIconSvg]="icon"></svg>
      </cngx-icon>
    </div>
  `,
})
class IconSvgMicroGeometryHost {
  protected readonly sizes = BAND_SIZES;
  protected readonly icon = WITH_MICRO;
}

// Loads only the component sheet, as a playground or an ejected skin does.
@Component({
  selector: 'cngx-icon-svg-bare-geometry-host',
  standalone: true,
  imports: [CngxIconSvg],
  styleUrls: ['../../../core/theming/layers.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="font-size: 16px">
      <svg class="bare" style="--cngx-icon-svg-size: 12px" [cngxIconSvg]="icon"></svg>
    </div>
  `,
})
class IconSvgBareGeometryHost {
  protected readonly icon = WITH_MICRO;
}

// Builds the glyph through the helper, as the tab link and menu indicator do.
@Component({
  selector: 'cngx-icon-svg-helper-geometry-host',
  standalone: true,
  template: '<div class="helper-root" style="font-size: 16px; color: rgb(255, 0, 0)"></div>',
})
class IconSvgHelperHost {
  readonly renderer = inject(Renderer2);
}

@Component({
  selector: 'cngx-icon-svg-helper-sheet-geometry-host',
  standalone: true,
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-icon-glyph.css'],
  encapsulation: ViewEncapsulation.None,
  template: '<div class="helper-root" style="font-size: 16px; color: rgb(255, 0, 0)"></div>',
})
class IconSvgHelperSheetHost {
  readonly renderer = inject(Renderer2);
}

let mountedRoot: HTMLElement | null = null;

function mountHelper(type: new () => { renderer: Renderer2 }, size: number): SVGSVGElement {
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const { renderer } = fixture.componentInstance;
  const { element } = createIconSvgElement(renderer, WITH_MICRO, 'helper-glyph');
  renderer.setStyle(element, '--cngx-icon-svg-size', `${size}px`, RendererStyleFlags2.DashCase);
  renderer.appendChild(query(mountedRoot, '.helper-root'), element);
  return element;
}

function mountHost(type: new () => unknown): HTMLElement {
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function visiblePath(svg: Element): 'path' | 'micro' | 'both' | 'none' {
  const path = computedValue(query(svg, '.cngx-icon-svg__path'), 'display') !== 'none';
  const micro = computedValue(query(svg, '.cngx-icon-svg__micro'), 'display') !== 'none';
  if (path && micro) {
    return 'both';
  }
  if (path) {
    return 'path';
  }
  return micro ? 'micro' : 'none';
}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(IconSvgGeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: Element, selector: string): Element {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('CngxIconSvg geometry', () => {
  it('sizes the glyph to 1em of the context font size', () => {
    const box = query(mount(), '.fill').getBoundingClientRect();
    expect(box.width).toBeCloseTo(16, 0);
    expect(box.height).toBeCloseTo(16, 0);
  });

  it('honours --cngx-icon-svg-size', () => {
    const box = query(mount(), '.sized').getBoundingClientRect();
    expect(box.width).toBeCloseTo(24, 0);
  });

  it('paints a fill icon in currentColor', () => {
    const el = query(mount(), '.fill');
    expect(computedValue(el, 'fill')).toBe('rgb(255, 0, 0)');
    expect(computedValue(el, 'stroke')).toBe('none');
  });

  it('paints a stroke icon outline only, with round caps', () => {
    const el = query(mount(), '.stroke');
    expect(computedValue(el, 'fill')).toBe('none');
    expect(computedValue(el, 'stroke')).toBe('rgb(255, 0, 0)');
    expect(computedValue(el, 'stroke-width')).toBe('2px');
    expect(computedValue(el, 'stroke-linecap')).toBe('round');
    expect(computedValue(el, 'stroke-linejoin')).toBe('round');
  });

  it('picks up size and stroke-width overrides set on an ancestor', () => {
    const el = query(mount(), '.ancestor');
    const box = el.getBoundingClientRect();
    expect(box.width).toBeCloseTo(2 * 16, 0);
    expect(computedValue(el, 'stroke-width')).toBe('1.5px');
  });

  it('keeps a stroke icon unfilled inside cngx-icon', () => {
    const root = mount();
    expect(computedValue(query(root, '.in-icon-stroke'), 'fill')).toBe('none');
    expect(computedValue(query(root, '.in-icon-fill'), 'fill')).toBe('rgb(255, 0, 0)');
  });

  it('lets cngx-icon own the box', () => {
    const box = query(mount(), '.in-icon-fill').getBoundingClientRect();
    expect(box.height).toBeCloseTo(1.5 * 16, 0);
  });
});

describe('CngxIconSvg micro tier', () => {
  it.each([
    [9, 'path'],
    [10, 'micro'],
    [12, 'micro'],
    [14, 'micro'],
    [15, 'path'],
    [24, 'path'],
  ] as const)('shows the %ipx box the %s', (size, expected) => {
    const svg = query(mountHost(IconSvgMicroGeometryHost), `.band-${size}`);
    expect(svg.getBoundingClientRect().width).toBeCloseTo(size, 1);
    expect(visiblePath(svg)).toBe(expected);
  });

  it('shows the micro path in a cngx-icon xs box at 16px text', () => {
    const svg = query(mountHost(IconSvgMicroGeometryHost), '.in-icon-xs');
    expect(svg.getBoundingClientRect().width).toBeCloseTo(12, 1);
    expect(visiblePath(svg)).toBe('micro');
  });

  it('fills the micro path in the text colour without the outline stroke', () => {
    const micro = query(mountHost(IconSvgMicroGeometryHost), '.band-12 .cngx-icon-svg__micro');
    expect(computedValue(micro, 'fill')).toBe('rgb(255, 0, 0)');
    expect(computedValue(micro, 'stroke')).toBe('none');
  });

  it('paints the micro fill in the forced colour of the 24-grid stroke', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const root = mountHost(IconSvgMicroGeometryHost);
    const micro = computedValue(query(root, '.band-12 .cngx-icon-svg__micro'), 'fill');
    const path = computedValue(query(root, '.band-24 .cngx-icon-svg__path'), 'stroke');
    expect(micro).not.toBe('rgb(255, 0, 0)');
    expect(micro).toBe(path);
  });

  it('paints only the 24-grid path without the global sheet', () => {
    const svg = query(mountHost(IconSvgBareGeometryHost), '.bare');
    expect(visiblePath(svg)).toBe('path');
  });

  it('shows the micro path of a helper-built svg in the band with the global sheet', () => {
    expect(visiblePath(mountHelper(IconSvgHelperSheetHost, 12))).toBe('micro');
  });

  it('keeps a helper-built svg on the 24-grid path outside the band', () => {
    expect(visiblePath(mountHelper(IconSvgHelperSheetHost, 24))).toBe('path');
  });

  it('paints only the 24-grid path of a helper-built svg without the global sheet', () => {
    const svg = mountHelper(IconSvgHelperHost, 12);
    expect(svg.getBoundingClientRect().width).toBeCloseTo(12, 1);
    expect(visiblePath(svg)).toBe('path');
  });
});
