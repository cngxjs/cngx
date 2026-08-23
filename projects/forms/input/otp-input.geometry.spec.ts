import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxOtpInput, CngxOtpSlot } from './otp-input.directive';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: each OTP slot holds a single digit (bucket A), so its host input must
// compute `unicode-bidi: isolate` and keep its inherited RTL direction - never
// a forced LTR. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxOtpInput, CngxOtpSlot],
  template: `
    <div cngxOtpInput [length]="4" #otp="cngxOtpInput">
      @for (i of otp.indices(); track i) {
        <input [cngxOtpSlot]="i" />
      }
    </div>
  `,
})
class OtpHost {}

function mountFirstSlot(): HTMLInputElement {
  const fixture = TestBed.createComponent(OtpHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const input = mountedRoot.querySelector('input');
  if (!input) {
    throw new Error('cngxOtpSlot did not render');
  }
  return input as HTMLInputElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxOtpSlot geometry (rtl)', () => {
  it('isolates each slot under dir=rtl (bucket A, isolate only)', () => {
    document.documentElement.dir = 'rtl';
    const input = mountFirstSlot();
    expect(computedValue(input, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(input, 'direction')).toBe('rtl');
  });
});
