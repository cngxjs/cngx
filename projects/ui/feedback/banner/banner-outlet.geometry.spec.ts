import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CngxBanner } from './banner.service';
import { CngxBannerOutlet } from './banner-outlet';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-banner-outlet)` block SETs (banner-outlet.css): the outlet is a
// sticky block that collapses to `display: none` while empty, and each pushed
// banner is a horizontal flex row whose body grows and may shrink past its
// intrinsic width. jsdom reports `''` for every one of these reads.

@Component({
  selector: 'cngx-banner-outlet-geometry-host',
  standalone: true,
  imports: [CngxBannerOutlet],
  template: `<cngx-banner-outlet />`,
})
class BannerOutletHost {}

let mountedRoot: HTMLElement | null = null;

function mountEmpty(): HTMLElement {
  const fixture = TestBed.createComponent(BannerOutletHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const outlet = mountedRoot.querySelector('.cngx-banner-outlet');
  if (!outlet) {
    throw new Error('cngx-banner-outlet did not render');
  }
  return outlet as HTMLElement;
}

function mountWithBanner(): HTMLElement {
  const fixture = TestBed.createComponent(BannerOutletHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.inject(CngxBanner).show({ id: 'geo', message: 'Maintenance tonight' });
  fixture.detectChanges();
  const outlet = mountedRoot.querySelector('.cngx-banner-outlet');
  if (!outlet) {
    throw new Error('cngx-banner-outlet did not render');
  }
  return outlet as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [CngxBanner] });
});

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxBannerOutlet geometry', () => {
  it('collapses to display:none while empty and sticks once shown', () => {
    const outlet = mountEmpty();
    // The `:scope:empty { display: none }` rule takes the whole outlet out of
    // flow until a banner is pushed - a browser-only read jsdom cannot make.
    expect(computedValue(outlet, 'display')).toBe('none');
  });

  it('sticks the outlet to the block-start of its scroll container', () => {
    const outlet = mountWithBanner();
    expect(computedValue(outlet, 'position')).toBe('sticky');
    expect(computedValue(outlet, 'display')).toBe('block');
  });

  it('lays a pushed banner out as a horizontal flex row with a growing body', () => {
    const outlet = mountWithBanner();
    const banner = query(outlet, '.cngx-banner');
    expect(computedValue(banner, 'display')).toBe('flex');
    expect(computedValue(banner, 'align-items')).toBe('center');
    const body = query(outlet, '.cngx-banner__body');
    expect(computedValue(body, 'flex-grow')).toBe('1');
    expect(computedValue(body, 'min-width')).toBe('0px');
  });
});
