import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTrend } from './trend.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: `CngxTrend` renders `formatDelta(value, 'percent', ...)` - an ASCII
// `+`/`%` around the Intl magnitude - so the host is a composite (bucket B)
// and must force a true LTR island: `unicode-bidi: isolate` AND
// `direction: ltr`. Asserting the resolved `direction` (not just the property)
// is the order proof: the ASCII `+`/`%` only stays attached when the run is
// forced LTR.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxTrend],
  template: `<cngx-trend [value]="5.3" />`,
})
class TrendHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TrendHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-trend');
  if (!host) {
    throw new Error('cngx-trend did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-trend-bidi');
  document.documentElement.style.removeProperty('--cngx-trend-direction');
});

describe('CngxTrend geometry (rtl)', () => {
  it('forces a LTR island on the composite under dir=rtl (bucket B)', () => {
    document.documentElement.dir = 'rtl';
    const host = mount();
    expect(computedValue(host, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(host, 'direction')).toBe('ltr');
  });

  it('lets a consumer opt out via --cngx-trend-bidi / --cngx-trend-direction', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-trend-bidi', 'normal');
    document.documentElement.style.setProperty('--cngx-trend-direction', 'rtl');
    const host = mount();
    expect(computedValue(host, 'unicode-bidi')).toBe('normal');
    expect(computedValue(host, 'direction')).toBe('rtl');
  });
});
