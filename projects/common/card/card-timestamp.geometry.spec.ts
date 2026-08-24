import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCardTimestamp } from './card-timestamp.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: an `Intl.DateTimeFormat` timestamp (`24.08.2026`) reorders on its dot
// separators, so `.cngx-card-timestamp__date` must compute `unicode-bidi:
// isolate` (isolate-only, bucket A). jsdom reports `''` for the read.

@Component({
  standalone: true,
  imports: [CngxCardTimestamp],
  template: `<cngx-card-timestamp [date]="date" />`,
})
class CardTimestampHost {
  date = new Date('2026-08-24T00:00:00Z');
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CardTimestampHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const date = mountedRoot.querySelector('.cngx-card-timestamp__date');
  if (!date) {
    throw new Error('cngx-card-timestamp date did not render');
  }
  return date as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-card-timestamp-bidi');
});

describe('CngxCardTimestamp geometry (rtl)', () => {
  it('isolates the date as a bidi run under dir=rtl (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const date = mount();
    expect(computedValue(date, 'unicode-bidi')).toBe('isolate');
  });

  it('lets a consumer opt out via --cngx-card-timestamp-bidi', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-card-timestamp-bidi', 'normal');
    const date = mount();
    expect(computedValue(date, 'unicode-bidi')).toBe('normal');
  });
});
