import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRangeSlider } from './range-slider.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root so the `a - b` order-fix is exercised: `20 - 80` inherits direction:rtl
// and reorders to `80 - 20`, inverting the range meaning. The combined readout
// must compute `direction: ltr` on top of `unicode-bidi: isolate`. An ltr mount
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
});

describe('CngxRangeSlider geometry (rtl)', () => {
  it('pins the a - b range readout to isolate + direction:ltr under dir=rtl', () => {
    document.documentElement.dir = 'rtl';
    const readout = mount();
    // `20 - 80 -> 80 - 20` is the reorder direction:ltr guards; the rtl mount is
    // what makes the direction assertion discriminating.
    expect(computedValue(readout, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(readout, 'direction')).toBe('ltr');
  });
});
