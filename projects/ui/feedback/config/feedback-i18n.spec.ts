import { describe, it, expect, beforeEach } from 'vitest';
import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CngxAlert } from '../alert/alert';
import { CngxAlertStack } from '../alert/alert-stack';
import { CngxToastOutlet } from '../toast/toast-outlet';
import { CngxToaster, provideToasts } from '../toast/toast.service';
import { provideFeedback, withAlerts, withToasts } from './feedback-config';
import {
  CNGX_FEEDBACK_I18N,
  FEEDBACK_I18N_DEFAULTS,
  injectFeedbackI18n,
  injectResolvedFeedbackI18n,
  provideFeedbackI18n,
  type CngxFeedbackI18nOverrides,
  withFeedbackI18nLabels,
} from './feedback-i18n';

@Component({
  imports: [CngxAlert],
  template: `
    <cngx-alert [closable]="true">One</cngx-alert>
    <cngx-alert [closable]="true">Two</cngx-alert>
  `,
})
class AlertPairHost {}

@Component({
  imports: [CngxToastOutlet],
  template: '<cngx-toast-outlet />',
})
class ToastHost {}

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
    expect(bundle().alertsRegionLabel).toBe('Hinweise');
    expect(bundle().notificationsRegionLabel).toBe('Notifications');
  });

  it('resolves the token without a provider', () => {
    const bundle = TestBed.inject(CNGX_FEEDBACK_I18N)();
    expect(bundle.alertsRegionLabel).toBe('Alerts');
    expect(bundle.notificationsRegionLabel).toBe('Notifications');
    expect(bundle.announcements.asyncLoading).toBe('Loading content');
  });

  it('merges an announcements override key by key', () => {
    TestBed.configureTestingModule({
      providers: [provideFeedbackI18n({ announcements: { asyncLoaded: 'Inhalt geladen' } })],
    });
    const { announcements } = TestBed.inject(CNGX_FEEDBACK_I18N)();
    expect(announcements.asyncLoaded).toBe('Inhalt geladen');
    expect(announcements.asyncLoading).toBe('Loading content');
    expect(announcements.alertOverflow(3)).toBe('+ 3 more alerts');
  });

  it('announces the overridden async phrases and alert dismissal', () => {
    TestBed.configureTestingModule({
      providers: [
        provideFeedbackI18n({
          announcements: { alertDismissed: 'Hinweis verworfen', alertOverflow: (n) => `${n} weitere` },
        }),
      ],
    });
    const { announcements } = TestBed.inject(CNGX_FEEDBACK_I18N)();
    expect(announcements.alertDismissed).toBe('Hinweis verworfen');
    expect(announcements.alertOverflow(2)).toBe('2 weitere');
  });

  it('resolves plain overrides to the same bundle as the eager merge did', () => {
    const overrides: CngxFeedbackI18nOverrides = {
      alertsRegionLabel: 'Hinweise',
      dismissLabel: 'Schliessen',
      announcements: { asyncLoaded: 'Inhalt geladen' },
    };
    TestBed.configureTestingModule({ providers: [provideFeedbackI18n(overrides)] });
    expect(TestBed.inject(CNGX_FEEDBACK_I18N)()).toEqual({
      ...FEEDBACK_I18N_DEFAULTS,
      ...overrides,
      announcements: { ...FEEDBACK_I18N_DEFAULTS.announcements, ...overrides.announcements },
    });
  });

  it('follows a Signal override and keeps its reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideFeedbackI18n(
          computed<CngxFeedbackI18nOverrides>(() =>
            lang() === 'en'
              ? {}
              : { alertsRegionLabel: 'Hinweise', announcements: { asyncLoaded: 'Geladen' } },
          ),
        ),
      ],
    });
    const bundle = TestBed.inject(CNGX_FEEDBACK_I18N);
    expect(bundle().alertsRegionLabel).toBe('Alerts');

    lang.set('de');
    const german = bundle();
    expect(german.alertsRegionLabel).toBe('Hinweise');
    expect(german.announcements.asyncLoaded).toBe('Geladen');
    expect(german.announcements.asyncLoading).toBe('Loading content');

    lang.set('de-AT');
    expect(bundle()).toBe(german);
  });

  it('keeps the other announcement defaults on a partial Signal override', () => {
    const copy = signal<CngxFeedbackI18nOverrides>({});
    TestBed.configureTestingModule({
      providers: [provideFeedback(withFeedbackI18nLabels(copy))],
    });
    const bundle = TestBed.inject(CNGX_FEEDBACK_I18N);
    copy.set({ announcements: { alertDismissed: 'Verworfen' } });
    expect(bundle().announcements.alertDismissed).toBe('Verworfen');
    expect(bundle().announcements.asyncRefreshed).toBe('Content refreshed');
    expect(bundle().announcements.alertOverflow(2)).toBe('+ 2 more alerts');
  });

  it('renames both regions on a language switch', () => {
    const copy = signal<CngxFeedbackI18nOverrides>({});
    TestBed.configureTestingModule({
      providers: [provideFeedback(withAlerts(), withToasts()), provideFeedbackI18n(copy)],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const label = (selector: string): string | null =>
      (fixture.nativeElement as HTMLElement).querySelector(selector)!.getAttribute('aria-label');
    expect(label('cngx-alert-stack')).toBe('Alerts');

    copy.set({ alertsRegionLabel: 'Hinweise', notificationsRegionLabel: 'Meldungen' });
    fixture.detectChanges();
    expect(label('cngx-alert-stack')).toBe('Hinweise');
    expect(label('cngx-toast-outlet')).toBe('Meldungen');
  });

  describe('dismiss, banner and repeat copy', () => {
    it('fills the new keys with the English defaults without a provider', () => {
      const bundle = TestBed.runInInjectionContext(() => injectResolvedFeedbackI18n());
      expect(bundle().dismissLabel).toBe('Dismiss');
      expect(bundle().bannerActionFailed).toBe('Action failed');
      expect(bundle().toastRepeatCount(3)).toBe('(x3)');
    });

    it('keeps the English defaults for a full bundle provided without the new keys', () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: CNGX_FEEDBACK_I18N,
            useValue: signal({
              alertsRegionLabel: 'Hinweise',
              notificationsRegionLabel: 'Meldungen',
              announcements: {
                alertDismissed: 'Verworfen',
                alertOverflow: (count: number) => `${count} weitere`,
                asyncLoading: 'Laedt',
                asyncLoaded: 'Geladen',
                asyncError: 'Fehler',
                asyncRefreshing: 'Aktualisiert',
                asyncRefreshed: 'Aktuell',
                asyncRefreshFailed: 'Aktualisierung fehlgeschlagen',
              },
            }),
          },
        ],
      });
      const bundle = TestBed.runInInjectionContext(() => injectResolvedFeedbackI18n());
      expect(bundle().alertsRegionLabel).toBe('Hinweise');
      expect(bundle().dismissLabel).toBe('Dismiss');
      expect(bundle().bannerActionFailed).toBe('Action failed');
    });

    it('names every alert dismiss button from dismissLabel', () => {
      TestBed.configureTestingModule({
        providers: [provideFeedbackI18n({ dismissLabel: 'Schliessen' })],
      });
      const fixture = TestBed.createComponent(AlertPairHost);
      fixture.detectChanges();
      const labels = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.cngx-alert__dismiss button'),
      ).map((b) => b.getAttribute('aria-label'));
      expect(labels).toEqual(['Schliessen', 'Schliessen']);
    });

    it('renders the toast repeat marker through toastRepeatCount', () => {
      TestBed.configureTestingModule({
        providers: [
          provideToasts(),
          provideFeedbackI18n({ toastRepeatCount: (count) => `${count}-mal` }),
        ],
      });
      const fixture = TestBed.createComponent(ToastHost);
      const toaster = fixture.debugElement.children[0].injector.get(CngxToaster);
      toaster.show({ message: 'Saved' });
      toaster.show({ message: 'Saved' });
      fixture.detectChanges();
      const count = (fixture.nativeElement as HTMLElement).querySelector('.cngx-toast__count');
      expect(count?.textContent?.trim()).toBe('2-mal');
    });

    it('shares one i18n Signal across alert instances under one injector', () => {
      const fixture = TestBed.createComponent(AlertPairHost);
      fixture.detectChanges();
      const [first, second] = fixture.debugElement
        .queryAll((el) => el.name === 'cngx-alert')
        .map((el) => (el.componentInstance as unknown as { i18n: unknown }).i18n);
      expect(first).toBe(second);
    });
  });
});
