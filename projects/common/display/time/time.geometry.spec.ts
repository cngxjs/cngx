import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTime } from './time.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root so the bidi cascade is exercised: an `Intl` absolute date reorders on
// its comma, so the `.cngx-time` host must compute `unicode-bidi: isolate`
// (isolate-only, bucket A - an Arabic-locale date keeps its native digit
// order). jsdom reports `''` for the read.

@Component({
  standalone: true,
  imports: [CngxTime],
  template: `<cngx-time [date]="date" [format]="{ dateStyle: 'medium' }" />`,
})
class TimeHost {
  date = new Date('2024-02-05T00:00:00Z');
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TimeHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-time');
  if (!host) {
    throw new Error('cngx-time did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-time-bidi');
});

describe('CngxTime geometry (rtl)', () => {
  it('isolates the date as a bidi run under dir=rtl (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const host = mount();
    expect(computedValue(host, 'unicode-bidi')).toBe('isolate');
  });

  it('lets a consumer opt out via --cngx-time-bidi', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-time-bidi', 'normal');
    const host = mount();
    expect(computedValue(host, 'unicode-bidi')).toBe('normal');
  });
});
