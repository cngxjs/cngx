import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxDelta } from './delta.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: `formatDelta` prepends an ASCII `+` and appends `%` around the Intl
// magnitude, so the host is a composite (bucket B) and must force a true LTR
// island - `unicode-bidi: isolate` AND `direction: ltr` - so the sign stays
// attached left of the digits instead of detaching at the RTL base level.
// Asserting the resolved `direction` (not just the property) is the order
// proof: the ASCII sign only stays left of the digits when the run is forced
// LTR. jsdom reports `''`.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxDelta],
  template: `<cngx-delta [value]="5.3" />`,
})
class DeltaHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(DeltaHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-delta');
  if (!host) {
    throw new Error('cngx-delta did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxDelta geometry (rtl)', () => {
  it('forces a LTR island on the composite under dir=rtl (bucket B)', () => {
    document.documentElement.dir = 'rtl';
    const host = mount();
    expect(computedValue(host, 'unicode-bidi')).toBe('isolate');
    // The order proof: the ASCII `+`/`%` stays left of the magnitude only
    // because the run is forced LTR, not merely fenced.
    expect(computedValue(host, 'direction')).toBe('ltr');
  });
});
