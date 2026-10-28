import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { CNGX_ICON_CARET_DOWN, CNGX_ICON_X } from '@cngx/utils';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxIcon } from './icon.component';
import { CngxIconSvg } from './icon-svg.component';

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

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(IconSvgGeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: HTMLElement, selector: string): Element {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
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
