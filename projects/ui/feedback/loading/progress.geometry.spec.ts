import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxProgress } from './progress';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: the percent label renders `{{ effectiveProgress() }}%` - a rounded
// integer plus an ASCII `%` concatenated outside Intl (bucket B) - so
// `.cngx-progress__label` must compute `unicode-bidi: isolate` AND
// `direction: ltr` to keep the percent attached to its number. The label is
// aria-hidden decorative, so forcing LTR never distorts an accessible name.
// jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxProgress],
  template: `<cngx-progress [progress]="42" [showLabel]="true" />`,
})
class ProgressHost {}

function mountLabel(): HTMLElement {
  const fixture = TestBed.createComponent(ProgressHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const label = mountedRoot.querySelector('.cngx-progress__label');
  if (!label) {
    throw new Error('cngx-progress label did not render');
  }
  return label as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-progress-bidi');
  document.documentElement.style.removeProperty('--cngx-progress-direction');
});

describe('CngxProgress geometry (rtl)', () => {
  it('forces a LTR island on the percent label under dir=rtl (bucket B)', () => {
    document.documentElement.dir = 'rtl';
    const label = mountLabel();
    expect(computedValue(label, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(label, 'direction')).toBe('ltr');
  });

  it('lets a consumer opt out via --cngx-progress-bidi / --cngx-progress-direction', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-progress-bidi', 'normal');
    document.documentElement.style.setProperty('--cngx-progress-direction', 'rtl');
    const label = mountLabel();
    expect(computedValue(label, 'unicode-bidi')).toBe('normal');
    expect(computedValue(label, 'direction')).toBe('rtl');
  });
});
