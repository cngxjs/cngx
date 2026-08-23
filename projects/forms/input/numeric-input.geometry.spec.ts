import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxNumericInput } from './numeric-input.directive';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: a numeric field renders a single `Intl.NumberFormat` run (bucket A),
// so its host must compute `unicode-bidi: isolate` and keep its inherited RTL
// direction - never a forced LTR, which would corrupt RTL-locale digits.
// jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxNumericInput],
  template: `<input cngxNumericInput />`,
})
class NumericHost {}

function mount(): HTMLInputElement {
  const fixture = TestBed.createComponent(NumericHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const input = mountedRoot.querySelector('input');
  if (!input) {
    throw new Error('cngxNumericInput did not render');
  }
  return input as HTMLInputElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxNumericInput geometry (rtl)', () => {
  it('isolates the entry run under dir=rtl (bucket A, isolate only)', () => {
    document.documentElement.dir = 'rtl';
    const input = mount();
    expect(computedValue(input, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(input, 'direction')).toBe('rtl');
  });
});
