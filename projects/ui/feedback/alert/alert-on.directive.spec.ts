import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { CNGX_STATEFUL, type CngxStateful } from '@cngx/core/utils';

import { CngxAlerter } from './alerter.service';
import { CngxAlertOn } from './alert-on.directive';

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
});
