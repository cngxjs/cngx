import { describe, it, expect, beforeEach } from 'vitest';
import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';

import { CngxAlert } from '../alert/alert';
import { CngxAlertStack } from '../alert/alert-stack';
import { CngxToastOutlet } from '../toast/toast-outlet';
import { CngxToaster, provideToasts } from '../toast/toast.service';
import { provideFeedback, withAlerts, withToasts } from './feedback-config';
import {
  CNGX_FEEDBACK_I18N,
  injectFeedbackI18n,
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
          announcements: {
            alertDismissed: 'Hinweis verworfen',
            alertOverflow: (n) => `${n} weitere`,
          },
        }),
      ],
    });
    const { announcements } = TestBed.inject(CNGX_FEEDBACK_I18N)();
    expect(announcements.alertDismissed).toBe('Hinweis verworfen');
    expect(announcements.alertOverflow(2)).toBe('2 weitere');
  });

  it('applies plain overrides over the English section, announcements key by key', () => {
    const overrides: CngxFeedbackI18nOverrides = {
      alertsRegionLabel: 'Hinweise',
      dismissLabel: 'Schliessen',
      announcements: { asyncLoaded: 'Inhalt geladen' },
    };
    TestBed.configureTestingModule({ providers: [provideFeedbackI18n(overrides)] });
    const bundle = TestBed.inject(CNGX_FEEDBACK_I18N)();
    expect(bundle.alertsRegionLabel).toBe('Hinweise');
    expect(bundle.dismissLabel).toBe('Schliessen');
    expect(bundle.notificationsRegionLabel).toBe('Notifications');
    expect(bundle.announcements.asyncLoaded).toBe('Inhalt geladen');
    expect(bundle.announcements.asyncRefreshFailed).toBe('Refresh failed');
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
      const bundle = TestBed.runInInjectionContext(() => injectFeedbackI18n());
      expect(bundle().dismissLabel).toBe('Dismiss');
      expect(bundle().bannerActionFailed).toBe('Action failed');
      expect(bundle().toastRepeatCount(3)).toBe('(x3)');
    });

    it('fills the keys a directly provided bundle leaves out from the English section', () => {
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
      const bundle = TestBed.runInInjectionContext(() => injectFeedbackI18n());
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

  describe('feedback language section', () => {
    const germanAnnouncements = {
      alertDismissed: 'Hinweis verworfen',
      alertOverflow: { one: '+ {count} weiterer Hinweis', other: '+ {count} weitere Hinweise' },
      alertOverflowVisible: '+ {count} weitere',
      asyncLoading: 'Inhalt wird geladen',
      asyncLoaded: 'Geladen',
      asyncError: 'Fehler beim Laden',
      asyncRefreshing: 'Inhalt wird aktualisiert',
      asyncRefreshed: 'Inhalt aktualisiert',
      asyncRefreshFailed: 'Aktualisierung fehlgeschlagen',
    };

    it('derives the pre-section English copy from the English section', () => {
      const i18n = TestBed.inject(CNGX_FEEDBACK_I18N)();
      expect(i18n.alertsRegionLabel).toBe('Alerts');
      expect(i18n.notificationsRegionLabel).toBe('Notifications');
      expect(i18n.dismissLabel).toBe('Dismiss');
      expect(i18n.bannerActionFailed).toBe('Action failed');
      expect(i18n.toastRepeatCount(3)).toBe('(x3)');
      expect(i18n.loadingLabel).toBe('Loading');
      expect(i18n.progressLabel).toBe('Progress');
      expect(stripBidiIsolates(i18n.progressValueText(42, '42%'))).toBe('42%');
      expect(stripBidiIsolates(i18n.errorWithDetail('Save failed', 'Timeout'))).toBe(
        'Save failed: Timeout',
      );
      const a = i18n.announcements;
      expect(a.alertDismissed).toBe('Alert dismissed');
      expect(a.alertOverflow(3)).toBe('+ 3 more alerts');
      expect(a.alertOverflowVisible(3)).toBe('+ 3 more');
      expect(a.asyncLoading).toBe('Loading content');
      expect(a.asyncLoaded).toBe('Content loaded');
      expect(a.asyncError).toBe('Error loading content');
      expect(a.asyncRefreshing).toBe('Refreshing content');
      expect(a.asyncRefreshed).toBe('Content refreshed');
      expect(a.asyncRefreshFailed).toBe('Refresh failed');
    });

    it('fixes the singular overflow name and formats counts with the locale', () => {
      TestBed.configureTestingModule({ providers: [provideLocale('de')] });
      const i18n = TestBed.inject(CNGX_FEEDBACK_I18N)();
      expect(i18n.announcements.alertOverflow(1)).toBe('+ 1 more alert');
      expect(i18n.announcements.alertOverflowVisible(1200)).toBe('+ 1.200 more');
      expect(i18n.toastRepeatCount(1200)).toBe('(x1.200)');
    });

    it('isolates both parts of an error with detail', () => {
      const i18n = TestBed.inject(CNGX_FEEDBACK_I18N)();
      expect(i18n.errorWithDetail('Save failed', 'Timeout')).toBe(
        '\u2068Save failed\u2069: \u2068Timeout\u2069',
      );
    });

    it('reads the feedback section of the active pack, with English for what it leaves out', () => {
      const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
      TestBed.configureTestingModule({
        providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
      });
      const bundle = TestBed.inject(CNGX_FEEDBACK_I18N);
      expect(bundle().alertsRegionLabel).toBe('Alerts');

      pack.set({
        locale: 'de',
        feedback: {
          alertsRegionLabel: 'Hinweise',
          errorWithDetail: '{message} ({detail})',
          announcements: germanAnnouncements,
        },
      });
      const german = bundle();
      expect(german.alertsRegionLabel).toBe('Hinweise');
      expect(german.announcements.alertOverflow(1)).toBe('+ 1 weiterer Hinweis');
      expect(german.announcements.alertOverflow(2)).toBe('+ 2 weitere Hinweise');
      expect(stripBidiIsolates(german.errorWithDetail('Fehler', 'Zeit'))).toBe('Fehler (Zeit)');
      expect(german.announcements.asyncLoaded).toBe('Geladen');
      expect(german.dismissLabel).toBe('Dismiss');
    });

    it('reads English for an announcement the pack leaves unset', () => {
      const announcements = { asyncLoaded: 'Geladen', asyncError: undefined };
      TestBed.configureTestingModule({
        providers: [
          provideCngxI18n(
            withPartialPack({
              locale: 'de',
              feedback: { announcements } as unknown as CngxActiveLanguagePack['feedback'],
            }),
            withDocumentLanguage('off'),
          ),
        ],
      });
      const { announcements: resolved } = TestBed.inject(CNGX_FEEDBACK_I18N)();
      expect(resolved.asyncLoaded).toBe('Geladen');
      expect(resolved.asyncError).toBe('Error loading content');
      expect(resolved.asyncLoading).toBe('Loading content');
    });

    it('keeps the bundle while the pack keeps its section and maps anew on a flip', () => {
      const de = { locale: 'de', feedback: { dismissLabel: 'Schliessen' } };
      const pack = signal<CngxActiveLanguagePack | undefined>(de);
      TestBed.configureTestingModule({
        providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
      });
      const bundle = TestBed.inject(CNGX_FEEDBACK_I18N);
      const first = bundle();
      pack.set({ ...de });
      expect(bundle()).toBe(first);
      pack.set({ locale: 'de', feedback: { dismissLabel: 'Verwerfen' } });
      expect(bundle()).not.toBe(first);
      expect(bundle().dismissLabel).toBe('Verwerfen');
    });

    it('lets provideFeedbackI18n override single keys on top of the active pack', () => {
      TestBed.configureTestingModule({
        providers: [
          provideCngxI18n(
            withPartialPack({
              locale: 'de',
              feedback: {
                dismissLabel: 'Schliessen',
                announcements: germanAnnouncements,
              },
            }),
            withDocumentLanguage('off'),
          ),
          provideFeedbackI18n({ announcements: { asyncLoaded: 'Inhalt da' } }),
        ],
      });
      const i18n = TestBed.inject(CNGX_FEEDBACK_I18N)();
      expect(i18n.dismissLabel).toBe('Schliessen');
      expect(i18n.announcements.asyncLoaded).toBe('Inhalt da');
      expect(i18n.announcements.asyncError).toBe('Fehler beim Laden');
    });

    it('formats the default keys in the locale of a provideLocaleAt subtree', () => {
      TestBed.configureTestingModule({
        providers: [provideFeedbackI18n({ dismissLabel: 'Schliessen' })],
      });
      const root = TestBed.runInInjectionContext(() => injectFeedbackI18n());
      const german = runInSubtree([provideLocaleAt('de')], () => injectFeedbackI18n());
      expect(root().toastRepeatCount(1200)).toBe('(x1,200)');
      expect(german().toastRepeatCount(1200)).toBe('(x1.200)');
      expect(german().dismissLabel).toBe('Schliessen');
    });
  });
});
