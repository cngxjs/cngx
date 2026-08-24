import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTextStepper } from './text-stepper.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: the word-anchored `Step n of m` readout isolates for #316 policy
// consistency, so `.cngx-text-stepper__text` must compute `unicode-bidi:
// isolate` (isolate-only, bucket A). jsdom reports `''` for the read.

@Component({
  standalone: true,
  imports: [CngxTextStepper, CngxStep],
  template: `
    <cngx-text-stepper [(activeStepIndex)]="active">
      <div cngxStep label="Customer"></div>
      <div cngxStep label="Payment"></div>
      <div cngxStep label="Review"></div>
    </cngx-text-stepper>
  `,
})
class TextStepperHost {
  active = signal(0);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TextStepperHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const text = mountedRoot.querySelector('.cngx-text-stepper__text');
  if (!text) {
    throw new Error('cngx-text-stepper text did not render');
  }
  return text as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-text-stepper-bidi');
});

describe('CngxTextStepper geometry (rtl)', () => {
  it('isolates the count readout under dir=rtl (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const text = mount();
    expect(computedValue(text, 'unicode-bidi')).toBe('isolate');
  });

  it('lets a consumer opt out via --cngx-text-stepper-bidi', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-text-stepper-bidi', 'normal');
    const text = mount();
    expect(computedValue(text, 'unicode-bidi')).toBe('normal');
  });
});
