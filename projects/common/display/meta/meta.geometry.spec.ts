import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxMeta } from './meta.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: a projected consumer code/id/hash reorders on its neutral characters,
// so `.cngx-meta__value` must compute `unicode-bidi: isolate` (isolate-only,
// bucket A - the value may legitimately be RTL text). jsdom reports `''`.

@Component({
  standalone: true,
  imports: [CngxMeta],
  template: `<cngx-meta term="trace">9f31c0d4</cngx-meta>`,
})
class MetaHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MetaHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const value = mountedRoot.querySelector('.cngx-meta__value');
  if (!value) {
    throw new Error('cngx-meta value did not render');
  }
  return value as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-meta-value-bidi');
});

describe('CngxMeta geometry (rtl)', () => {
  it('isolates the value as a bidi run under dir=rtl (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const value = mount();
    expect(computedValue(value, 'unicode-bidi')).toBe('isolate');
  });

  it('lets a consumer opt out via --cngx-meta-value-bidi', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-meta-value-bidi', 'normal');
    const value = mount();
    expect(computedValue(value, 'unicode-bidi')).toBe('normal');
  });
});
