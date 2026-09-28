import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CNGX_FEEDBACK_I18N, type CngxFeedbackI18n } from '../config/feedback-i18n';
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
    const banner = TestBed.inject(CngxBanner);
    return { fixture, outletEl, banner };
  }

  it('renders with the cngx-banner-outlet host class', () => {
    const { outletEl } = setup();
    expect(outletEl.classList.contains('cngx-banner-outlet')).toBe(true);
  });

  it('announces warning banners assertively, matching their role="alert"', () => {
    const { fixture, outletEl, banner } = setup();
    banner.show({ id: 'w', message: 'Warn', severity: 'warning' });
    fixture.detectChanges();

    const el = outletEl.querySelector('.cngx-banner');
    expect(el?.getAttribute('role')).toBe('alert');
    expect(el?.getAttribute('aria-live')).toBe('assertive');
  });

  it('announces info banners politely as role="status"', () => {
    const { fixture, outletEl, banner } = setup();
    banner.show({ id: 'i', message: 'Info', severity: 'info' });
    fixture.detectChanges();

    const el = outletEl.querySelector('.cngx-banner');
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-live')).toBe('polite');
  });

  it('pins the dismiss close-button with flex-shrink: 0 to survive narrow widths', () => {
    setup();

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(styleText).toMatch(/\.cngx-banner__dismiss\s*\{[^}]*flex-shrink:\s*0/);
  });

  it('keeps a shown action error on a copy flip and uses the new copy on the next error', async () => {
    // The public token type is a plain bundle; a Signal-carrying value exercises the
    // reactive-ready read path the follow-up program switches on.
    const copy = signal<Partial<CngxFeedbackI18n>>({});
    TestBed.overrideProvider(CNGX_FEEDBACK_I18N, { useValue: copy as unknown as CngxFeedbackI18n });
    const { fixture, outletEl, banner } = setup();
    banner.show({
      id: 'sync',
      message: 'Sync paused',
      action: { label: 'Retry', handler: () => Promise.reject(new Error('offline')) },
    });
    await banner.executeAction('sync');
    fixture.detectChanges();
    const errorText = (): string | undefined =>
      outletEl.querySelector('.cngx-banner__error')?.textContent?.trim();
    expect(errorText()).toBe('Action failed');

    copy.set({ bannerActionFailed: 'Aktion fehlgeschlagen' });
    fixture.detectChanges();
    expect(errorText()).toBe('Action failed');

    await banner.executeAction('sync');
    fixture.detectChanges();
    expect(errorText()).toBe('Aktion fehlgeschlagen');
  });
});
