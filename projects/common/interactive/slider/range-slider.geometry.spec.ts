import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRangeSlider } from './range-slider.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root so the direction read discriminates: the readout is the translated
// `rangeValue` message and follows the page direction, while
// --cngx-slider-range-direction still pins a fixed ltr `a - b`. An ltr mount
// would make the direction read vacuous.

@Component({
  standalone: true,
  imports: [CngxRangeSlider],
  template: `<cngx-range-slider [value]="[20, 80]" [min]="0" [max]="100" [showValue]="true" />`,
})
class RangeSliderHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(RangeSliderHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const readout = mountedRoot.querySelector('.cngx-slider__value--range');
  if (!readout) {
    throw new Error('cngx-range-slider range readout did not render');
  }
  return readout as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-slider-range-direction');
});

describe('CngxRangeSlider geometry (rtl)', () => {
  it('isolates the range readout and lets it follow dir=rtl', () => {
    document.documentElement.dir = 'rtl';
    const readout = mount();
    expect(computedValue(readout, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(readout, 'direction')).toBe('rtl');
  });

  it('pins the readout to ltr through the direction token', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-slider-range-direction', 'ltr');
    const readout = mount();
    expect(computedValue(readout, 'direction')).toBe('ltr');
  });
});
