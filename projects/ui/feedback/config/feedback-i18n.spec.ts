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
    expect(bundle).toEqual({
      alertsRegionLabel: 'Hinweise',
      notificationsRegionLabel: 'Notifications',
    });
  });

  it('resolves the token without a provider', () => {
    expect(TestBed.inject(CNGX_FEEDBACK_I18N)).toEqual({
      alertsRegionLabel: 'Alerts',
      notificationsRegionLabel: 'Notifications',
    });
  });
});
