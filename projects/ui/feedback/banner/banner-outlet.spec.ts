import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBanner } from './banner.service';
import { CngxBannerOutlet } from './banner-outlet';

@Component({
  template: `<cngx-banner-outlet />`,
  imports: [CngxBannerOutlet],
})
class TestHost {}

describe('CngxBannerOutlet', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [CngxBanner],
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const outletEl: HTMLElement = fixture.nativeElement.querySelector('cngx-banner-outlet');
    return { fixture, outletEl };
  }

  it('renders with the cngx-banner-outlet host class', () => {
    const { outletEl } = setup();
    expect(outletEl.classList.contains('cngx-banner-outlet')).toBe(true);
  });

  it('pins the dismiss close-button with flex-shrink: 0 to survive narrow widths', () => {
    setup();

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(styleText).toMatch(/\.cngx-banner__dismiss\s*\{[^}]*flex-shrink:\s*0/);
  });
});
