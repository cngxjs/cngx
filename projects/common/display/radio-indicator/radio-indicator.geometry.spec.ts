import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRadioIndicator } from './radio-indicator.component';

// Runs in a real Chromium (the `test-geometry` target): paint, transform and
// box geometry come from the layered stylesheet, which jsdom does not compute.
// The context font size is pinned to 16px so the md 1em box is exact.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-radio-indicator-geometry-host',
  standalone: true,
  imports: [CngxRadioIndicator],
  styleUrls: ['../../../core/theming/layers.css', '../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="font-size: 16px">
      <cngx-radio-indicator class="unchecked" />
      <cngx-radio-indicator class="checked" [checked]="true" />
      <cngx-radio-indicator
        class="tuned"
        [checked]="true"
        style="--cngx-radio-indicator-dot-scale: 0.6; --cngx-radio-indicator-border-width: 2"
      />
      <span style="--cngx-radio-indicator-dot-scale: 0.4">
        <cngx-radio-indicator class="ancestor" [checked]="true" />
      </span>
      @for (size of sizes; track size) {
        <cngx-radio-indicator [class]="'size-' + size" [size]="size" [checked]="true" />
      }
      <cngx-radio-indicator class="check-off" skin="check" />
      <cngx-radio-indicator class="check-on" skin="check" [checked]="true" />
      <cngx-radio-indicator class="check-disabled" skin="check" [checked]="true" [disabled]="true" />
      <cngx-radio-indicator class="tinted-on" skin="tinted" [checked]="true" />
      <span style="--cngx-radio-indicator-mark-color: rgb(1, 2, 3); --cngx-radio-indicator-tinted-dot-scale: 0.3">
        <cngx-radio-indicator class="check-ancestor" skin="check" [checked]="true" />
        <cngx-radio-indicator class="tinted-ancestor" skin="tinted" [checked]="true" />
      </span>
      <span class="probe-primary" style="color: var(--cngx-color-primary)"></span>
      <span class="probe-surface-plain" style="color: var(--cngx-color-surface)"></span>
      <span
        class="probe-tint"
        style="color: color-mix(in oklab, var(--cngx-color-primary) 16%, transparent)"
      ></span>
    </div>
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="font-size: 16px; color: var(--cngx-color-text)"
      >
        <cngx-radio-indicator class="ring" size="sm" />
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      </div>
    }
  `,
})
class RadioIndicatorGeometryHost {
  protected readonly sizes = ['sm', 'md', 'lg'] as const;
  protected readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(RadioIndicatorGeometryHost);
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

// Paints `colour` over `backdrop` on a 1x1 canvas, so a translucent ring is
// measured as it actually reads on the surface.
function composite(backdrop: string, colour: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('2d canvas unavailable');
  }
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function centre(rect: DOMRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxRadioIndicator geometry', () => {
  it('scales the unchecked dot to zero', () => {
    const dot = query(mount(), '.unchecked .cngx-radio-indicator__dot');
    expect(computedValue(dot, 'transform')).toBe('matrix(0, 0, 0, 0, 0, 0)');
  });

  it('scales the checked dot to --cngx-radio-indicator-dot-scale about its own centre', () => {
    const dot = query(mount(), '.checked .cngx-radio-indicator__dot');
    expect(computedValue(dot, 'transform')).toBe('matrix(0.54, 0, 0, 0.54, 0, 0)');
    expect(computedValue(dot, 'transform-box')).toBe('fill-box');
  });

  it('centres the dot on the ring', () => {
    const root = mount();
    for (const sel of ['.checked', '.tuned', '.size-sm', '.size-md', '.size-lg']) {
      const ring = centre(query(root, `${sel} .cngx-radio-indicator__circle`).getBoundingClientRect());
      const dot = centre(query(root, `${sel} .cngx-radio-indicator__dot`).getBoundingClientRect());
      expect(dot.x, sel).toBeCloseTo(ring.x, 2);
      expect(dot.y, sel).toBeCloseTo(ring.y, 2);
    }
  });

  it('sizes the dot as a fraction of the indicator diameter', () => {
    const root = mount();
    const host = query(root, '.checked').getBoundingClientRect();
    const dot = query(root, '.checked .cngx-radio-indicator__dot').getBoundingClientRect();
    expect(host.width).toBeCloseTo(16, 1);
    expect(dot.width).toBeCloseTo(host.width * 0.54, 1);
  });

  it('lets dot-scale and border-width overrides reach the svg', () => {
    const root = mount();
    expect(computedValue(query(root, '.checked .cngx-radio-indicator__circle'), 'stroke-width')).toBe('1.5px');
    expect(computedValue(query(root, '.tuned .cngx-radio-indicator__circle'), 'stroke-width')).toBe('2px');
    expect(computedValue(query(root, '.tuned .cngx-radio-indicator__dot'), 'transform')).toBe(
      'matrix(0.6, 0, 0, 0.6, 0, 0)',
    );
    expect(computedValue(query(root, '.ancestor .cngx-radio-indicator__dot'), 'transform')).toBe(
      'matrix(0.4, 0, 0, 0.4, 0, 0)',
    );
  });

  it.each(SCHEMES)('keeps the unchecked ring at 3:1 against the surface, %s (WCAG 1.4.11)', (scheme) => {
    const root = mount();
    const surface = computedValue(query(root, `.scheme-${scheme} .probe-surface`), 'color');
    const ring = computedValue(query(root, `.scheme-${scheme} .ring .cngx-radio-indicator__circle`), 'stroke');
    expect(contrast(composite(surface, ring), composite(surface, surface))).toBeGreaterThanOrEqual(3);
  });

  it('check skin: fills the checked disc with the checked colour and fades in a round-capped mark', () => {
    const root = mount();
    const primary = computedValue(query(root, '.probe-primary'), 'color');
    const surface = computedValue(query(root, '.probe-surface-plain'), 'color');
    expect(computedValue(query(root, '.check-on .cngx-radio-indicator__circle'), 'fill')).toBe(primary);
    const mark = query(root, '.check-on .cngx-radio-indicator__mark');
    expect(computedValue(mark, 'stroke')).toBe(surface);
    expect(computedValue(mark, 'stroke-linecap')).toBe('round');
    expect(computedValue(mark, 'stroke-linejoin')).toBe('round');
    expect(computedValue(mark, 'opacity')).toBe('1');
    expect(computedValue(query(root, '.check-off .cngx-radio-indicator__mark'), 'opacity')).toBe('0');
    expect(computedValue(query(root, '.check-off .cngx-radio-indicator__circle'), 'fill')).toBe(
      'rgba(0, 0, 0, 0)',
    );
  });

  it('check skin: centres the mark on the ring', () => {
    const root = mount();
    const ring = centre(query(root, '.check-on .cngx-radio-indicator__circle').getBoundingClientRect());
    const mark = centre(query(root, '.check-on .cngx-radio-indicator__mark').getBoundingClientRect());
    expect(mark.x).toBeCloseTo(ring.x, 1);
    expect(mark.y).toBeCloseTo(ring.y, 1);
  });

  it('check skin: a disabled disc takes the disabled colour while the mark stays surface', () => {
    const root = mount();
    const primary = computedValue(query(root, '.probe-primary'), 'color');
    const surface = computedValue(query(root, '.probe-surface-plain'), 'color');
    const disabled = query(root, '.check-disabled');
    expect(computedValue(query(root, '.check-disabled .cngx-radio-indicator__circle'), 'fill')).toBe(
      computedValue(disabled, 'color'),
    );
    expect(computedValue(query(root, '.check-disabled .cngx-radio-indicator__circle'), 'fill')).not.toBe(
      primary,
    );
    expect(computedValue(query(root, '.check-disabled .cngx-radio-indicator__mark'), 'stroke')).toBe(surface);
  });

  it('tinted skin: fills the checked disc with the 16% tint and shrinks the dot', () => {
    const root = mount();
    const tint = computedValue(query(root, '.probe-tint'), 'color');
    expect(computedValue(query(root, '.tinted-on .cngx-radio-indicator__circle'), 'fill')).toBe(tint);
    expect(computedValue(query(root, '.tinted-on .cngx-radio-indicator__dot'), 'transform')).toBe(
      'matrix(0.42, 0, 0, 0.42, 0, 0)',
    );
  });

  it('lets ancestor overrides of the skin tokens reach the skinned indicator', () => {
    const root = mount();
    expect(computedValue(query(root, '.check-ancestor .cngx-radio-indicator__mark'), 'stroke')).toBe(
      'rgb(1, 2, 3)',
    );
    expect(computedValue(query(root, '.tinted-ancestor .cngx-radio-indicator__dot'), 'transform')).toBe(
      'matrix(0.3, 0, 0, 0.3, 0, 0)',
    );
  });
});
