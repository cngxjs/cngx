import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxMetric } from './metric.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root so the bidi cascade is exercised: `.cngx-metric__value` renders a single
// `Intl.NumberFormat` run and must compute `unicode-bidi: isolate` (bucket A) -
// isolate only, never a forced `direction: ltr`, so RTL-locale digits keep
// their own resolved order. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxMetric],
  template: `<cngx-metric [value]="1234" unit="bpm" />`,
})
class MetricHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MetricHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const value = mountedRoot.querySelector('.cngx-metric__value');
  if (!value) {
    throw new Error('cngx-metric value did not render');
  }
  return value as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxMetric geometry (rtl)', () => {
  it('isolates the value run under dir=rtl (bucket A, isolate only)', () => {
    document.documentElement.dir = 'rtl';
    const value = mount();
    expect(computedValue(value, 'unicode-bidi')).toBe('isolate');
    // Bucket A never forces LTR: the single Intl run keeps its resolved
    // direction so genuinely RTL-locale digits are not corrupted.
    expect(computedValue(value, 'direction')).toBe('rtl');
  });
});
