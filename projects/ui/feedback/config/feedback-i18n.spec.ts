import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CngxAlertStack } from '../alert/alert-stack';
import { CngxToastOutlet } from '../toast/toast-outlet';
import { provideFeedback, withAlerts, withToasts } from './feedback-config';
import {
  CNGX_FEEDBACK_I18N,
  injectFeedbackI18n,
  provideFeedbackI18n,
  withFeedbackI18nLabels,
} from './feedback-i18n';

@Component({
  standalone: true,
  imports: [CngxAlertStack, CngxToastOutlet],
  template: '<cngx-alert-stack /><cngx-toast-outlet />',
})
class Host {}

const regionLabels = (): { alerts: string | null; toasts: string | null } => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = (selector: string): Element | null =>
    fixture.nativeElement.querySelector(selector) as Element | null;
  return {
    alerts: el('cngx-alert-stack')?.getAttribute('aria-label') ?? null,
    toasts: el('cngx-toast-outlet')?.getAttribute('aria-label') ?? null,
  };
};

describe('CNGX_FEEDBACK_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('names both regions in English without any provider', () => {
    TestBed.configureTestingModule({ providers: [provideFeedback(withAlerts(), withToasts())] });
    expect(regionLabels()).toEqual({ alerts: 'Alerts', toasts: 'Notifications' });
  });

  it('takes the override from withFeedbackI18nLabels inside provideFeedback', () => {
    TestBed.configureTestingModule({
      providers: [
        provideFeedback(
          withAlerts(),
          withToasts(),
          withFeedbackI18nLabels({ alertsRegionLabel: 'Hinweise' }),
        ),
      ],
    });
    expect(regionLabels()).toEqual({ alerts: 'Hinweise', toasts: 'Notifications' });
  });

  it('takes the override from a standalone provideFeedbackI18n', () => {
    TestBed.configureTestingModule({
      providers: [
        provideFeedback(withAlerts(), withToasts()),
        provideFeedbackI18n({ notificationsRegionLabel: 'Meldungen' }),
      ],
    });
    expect(regionLabels()).toEqual({ alerts: 'Alerts', toasts: 'Meldungen' });
  });

  it('keeps unset keys on the English default', () => {
    TestBed.configureTestingModule({
      providers: [provideFeedbackI18n({ alertsRegionLabel: 'Hinweise' })],
    });
    const bundle = TestBed.runInInjectionContext(() => injectFeedbackI18n());
    expect(bundle.alertsRegionLabel).toBe('Hinweise');
    expect(bundle.notificationsRegionLabel).toBe('Notifications');
  });

  it('resolves the token without a provider', () => {
    const bundle = TestBed.inject(CNGX_FEEDBACK_I18N);
    expect(bundle.alertsRegionLabel).toBe('Alerts');
    expect(bundle.notificationsRegionLabel).toBe('Notifications');
    expect(bundle.announcements.asyncLoading).toBe('Loading content');
  });

  it('merges an announcements override key by key', () => {
    TestBed.configureTestingModule({
      providers: [provideFeedbackI18n({ announcements: { asyncLoaded: 'Inhalt geladen' } })],
    });
    const { announcements } = TestBed.inject(CNGX_FEEDBACK_I18N);
    expect(announcements.asyncLoaded).toBe('Inhalt geladen');
    expect(announcements.asyncLoading).toBe('Loading content');
    expect(announcements.alertOverflow(3)).toBe('Show 3 more alerts');
  });

  it('announces the overridden async phrases and alert dismissal', () => {
    TestBed.configureTestingModule({
      providers: [
        provideFeedbackI18n({
          announcements: { alertDismissed: 'Hinweis verworfen', alertOverflow: (n) => `${n} weitere` },
        }),
      ],
    });
    const { announcements } = TestBed.inject(CNGX_FEEDBACK_I18N);
    expect(announcements.alertDismissed).toBe('Hinweis verworfen');
    expect(announcements.alertOverflow(2)).toBe('2 weitere');
  });
});
