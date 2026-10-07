import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { CNGX_STATEFUL, type CngxStateful } from '@cngx/core/utils';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
import { stripBidiIsolates } from '@cngx/testing';

import { provideFeedback, withErrorDetail } from '../config/feedback-config';

import { CngxAlerter } from './alerter.service';
import { CngxAlertOn } from './alert-on.directive';
import { CngxAlertStack } from './alert-stack';

@Component({
  selector: 'test-alert-explicit',
  template: `
    <div
      [cngxAlertOn]="state()"
      alertSuccess="Saved"
      alertError="Failed">
    </div>
  `,
  imports: [CngxAlertOn],
})
class ExplicitHost {
  readonly state = signal<ManualAsyncState<string> | undefined>(createManualState<string>());
}

@Component({
  selector: 'test-alert-fallback',
  template: `<div cngxAlertOn alertError="Failed"></div>`,
  imports: [CngxAlertOn],
})
class FallbackHost { }

@Component({
  selector: 'test-alert-missing',
  template: `<div cngxAlertOn alertError="Failed"></div>`,
  imports: [CngxAlertOn],
})
class MissingSourceHost { }

@Component({
  selector: 'test-alert-wiring',
  template: `
    <cngx-alert-stack scope="form" />
    <div [cngxAlertOn]="state()" alertError="Save failed" alertScope="form"></div>
  `,
  imports: [CngxAlertOn, CngxAlertStack],
})
class WiringHost {
  readonly state = signal<ManualAsyncState<string> | undefined>(createManualState<string>());
}

describe('CngxAlertOn', () => {
  it('uses explicit state input when provided', () => {
    TestBed.configureTestingModule({
      imports: [ExplicitHost],
      providers: [CngxAlerter],
    });
    const alerter = TestBed.inject(CngxAlerter);
    const fixture = TestBed.createComponent(ExplicitHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const state = fixture.componentInstance.state()!;
    state.setError(new Error('boom'));
    TestBed.flushEffects();

    expect(alerter.alerts().length).toBe(1);
    expect(alerter.alerts()[0].config.message).toBe('Failed');
  });

  it('does not fire for a state that mounts mid-flight (seeded tracker)', () => {
    TestBed.configureTestingModule({
      imports: [ExplicitHost],
      providers: [CngxAlerter],
    });
    const alerter = TestBed.inject(CngxAlerter);
    const fixture = TestBed.createComponent(ExplicitHost);
    // Settle the state BEFORE the directive observes it: the bridge tracker
    // seeds previous to the mount value, so no phantom idle -> success alert.
    fixture.componentInstance.state()!.setSuccess('pre-mount');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(alerter.alerts().length).toBe(0);

    // The next real edge still alerts.
    fixture.componentInstance.state()!.setError(new Error('boom'));
    TestBed.flushEffects();
    expect(alerter.alerts().length).toBe(1);
    expect(alerter.alerts()[0].config.message).toBe('Failed');
  });

  it('falls back to CNGX_STATEFUL when no state input is bound', () => {
    const tokenState = createManualState<string>();

    TestBed.configureTestingModule({
      imports: [FallbackHost],
      providers: [
        CngxAlerter,
        { provide: CNGX_STATEFUL, useValue: { state: tokenState } satisfies CngxStateful<string> },
      ],
    });
    const alerter = TestBed.inject(CngxAlerter);
    const fixture = TestBed.createComponent(FallbackHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    tokenState.setError(new Error('boom'));
    TestBed.flushEffects();

    expect(alerter.alerts().length).toBe(1);
  });

  it('routes alerts into a sibling CngxAlertStack via the environment alerter', () => {
    TestBed.configureTestingModule({
      imports: [WiringHost],
      providers: [CngxAlerter],
    });
    const fixture = TestBed.createComponent(WiringHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    fixture.componentInstance.state()!.setError(new Error('boom'));
    TestBed.flushEffects();
    fixture.detectChanges();

    const stackEl: HTMLElement = fixture.nativeElement.querySelector('cngx-alert-stack');
    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Save failed');
  });

  it('logs dev-mode error when neither state input nor CNGX_STATEFUL is available', () => {
    TestBed.configureTestingModule({
      imports: [MissingSourceHost],
      providers: [CngxAlerter],
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(MissingSourceHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/No state source/));
    spy.mockRestore();
  });

  describe('error detail', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    @Component({
      selector: 'test-alert-detail',
      template: `<div [cngxAlertOn]="state" alertError="Save failed" [alertErrorDetail]="true"></div>`,
      imports: [CngxAlertOn],
    })
    class DetailHost {
      readonly state = createManualState<string>();
    }

    const failWith = (error: unknown): string => {
      const alerter = TestBed.inject(CngxAlerter);
      const fixture = TestBed.createComponent(DetailHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.componentInstance.state.setError(error);
      TestBed.flushEffects();
      return alerter.alerts()[0].config.message;
    };

    it('appends the raw error text through errorWithDetail in development builds', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({ providers: [CngxAlerter] });
      const message = failWith(new Error('Timeout'));
      expect(message).toBe('\u2068Save failed\u2069: \u2068Timeout\u2069');
    });

    it('warns once per app that production builds show no raw detail', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({ providers: [CngxAlerter] });
      failWith(new Error('Timeout'));
      failWith(new Error('Timeout again'));
      const warnings = warn.mock.calls.filter(([text]) =>
        String(text).includes('withErrorDetail'),
      );
      expect(warnings).toHaveLength(1);
      expect(String(warnings[0][0])).toContain('Production builds show no detail');
    });

    it('does not warn when withErrorDetail maps the error', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        providers: [CngxAlerter, provideFeedback(withErrorDetail(() => 'Busy'))],
      });
      failWith(new Error('Timeout'));
      expect(warn.mock.calls.some(([text]) => String(text).includes('withErrorDetail'))).toBe(
        false,
      );
    });

    it('does not warn when the error carries no text', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({ providers: [CngxAlerter] });
      expect(failWith({ status: 500 })).toBe('Save failed');
      expect(warn.mock.calls.some(([text]) => String(text).includes('withErrorDetail'))).toBe(
        false,
      );
    });

    it('routes the detail through withErrorDetail', () => {
      TestBed.configureTestingModule({
        providers: [
          CngxAlerter,
          provideFeedback(withErrorDetail((error) => (error === 503 ? 'Server busy' : undefined))),
        ],
      });
      expect(stripBidiIsolates(failWith(503))).toBe('Save failed: Server busy');
    });

    it('shows the message alone when the mapping returns no detail', () => {
      TestBed.configureTestingModule({
        providers: [CngxAlerter, provideFeedback(withErrorDetail(() => undefined))],
      });
      expect(failWith(new Error('HTTP 500 Internal Server Error'))).toBe('Save failed');
    });

    it('joins message and detail with the active language pack', () => {
      TestBed.configureTestingModule({
        providers: [
          CngxAlerter,
          provideCngxI18n(
            withPartialPack({ locale: 'de', feedback: { errorWithDetail: '{message} ({detail})' } }),
            withDocumentLanguage('off'),
          ),
        ],
      });
      expect(stripBidiIsolates(failWith('Zeitlimit'))).toBe('Save failed (Zeitlimit)');
    });
  });
});
