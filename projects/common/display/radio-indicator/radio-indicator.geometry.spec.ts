import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRadioIndicator } from './radio-indicator.component';

// Runs in a real Chromium (the `test-geometry` target): paint, transform and
// box geometry come from the layered stylesheet, which jsdom does not compute.
// The context font size is pinned to 16px so the md 1em box is exact.

@Component({
  selector: 'cngx-radio-indicator-geometry-host',
  standalone: true,
  imports: [CngxRadioIndicator],
  styleUrls: ['../../../core/theming/layers.css'],
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
    </div>
  `,
})
class RadioIndicatorGeometryHost {
  protected readonly sizes = ['sm', 'md', 'lg'] as const;
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
    expect(computedValue(dot, 'transform')).toBe('matrix(0.5, 0, 0, 0.5, 0, 0)');
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
    expect(dot.width).toBeCloseTo(host.width * 0.5, 1);
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
});
