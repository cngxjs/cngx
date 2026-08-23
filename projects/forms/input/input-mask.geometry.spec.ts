import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxInputMask } from './input-mask.directive';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: a masked value is a structured code that reads left-to-right
// regardless of locale (bucket B), so its host must compute `unicode-bidi:
// isolate` AND `direction: ltr` - a true forced LTR island, not just a fenced
// run. The `direction: ltr` read is the order proof; a property-only assertion
// would false-green (the plan-review blocker). jsdom reports `''`.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxInputMask],
  template: `<input [cngxInputMask]="mask()" />`,
})
class MaskHost {
  readonly mask = signal('(000) 000-0000');
}

function mount(): HTMLInputElement {
  const fixture = TestBed.createComponent(MaskHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const input = mountedRoot.querySelector('input');
  if (!input) {
    throw new Error('cngxInputMask did not render');
  }
  return input as HTMLInputElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-input-mask-bidi');
  document.documentElement.style.removeProperty('--cngx-input-mask-direction');
});

describe('CngxInputMask geometry (rtl)', () => {
  it('forces a LTR island on the masked code under dir=rtl (bucket B)', () => {
    document.documentElement.dir = 'rtl';
    const input = mount();
    expect(computedValue(input, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(input, 'direction')).toBe('ltr');
  });

  it('lets a consumer opt out via --cngx-input-mask-bidi / --cngx-input-mask-direction', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-input-mask-bidi', 'normal');
    document.documentElement.style.setProperty('--cngx-input-mask-direction', 'rtl');
    const input = mount();
    expect(computedValue(input, 'unicode-bidi')).toBe('normal');
    expect(computedValue(input, 'direction')).toBe('rtl');
  });
});
