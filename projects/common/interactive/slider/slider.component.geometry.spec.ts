import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSlider } from './slider.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: the single-thumb value readout, the value bubble, and the tick labels
// are self-contained numbers that must compute `unicode-bidi: isolate`
// (isolate-only, bucket A). jsdom reports `''` for every read.

@Component({
  standalone: true,
  imports: [CngxSlider],
  template: `
    <cngx-slider
      aria-label="Volume"
      [value]="50"
      [min]="0"
      [max]="100"
      [step]="25"
      showValue
      showTicks
      showTickLabels
    />
  `,
})
class SliderValueHost {}

@Component({
  standalone: true,
  imports: [CngxSlider],
  template: `<cngx-slider aria-label="Volume" [value]="50" [min]="0" [max]="100" showValueBubble />`,
})
class SliderBubbleHost {}

let mountedRoot: HTMLElement | null = null;

function mount(host: typeof SliderValueHost | typeof SliderBubbleHost): HTMLElement {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
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
  document.documentElement.removeAttribute('dir');
});

describe('CngxSlider single-value surfaces isolate under dir=rtl', () => {
  it('isolates the floating value and the tick labels (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const root = mount(SliderValueHost);
    expect(computedValue(query(root, '.cngx-slider__value'), 'unicode-bidi')).toBe('isolate');
    expect(computedValue(query(root, '.cngx-slider__tick-label'), 'unicode-bidi')).toBe('isolate');
  });

  it('isolates the value bubble (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const root = mount(SliderBubbleHost);
    expect(computedValue(query(root, '.cngx-slider__bubble'), 'unicode-bidi')).toBe('isolate');
  });
});
