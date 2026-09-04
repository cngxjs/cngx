import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { CNGX_STATEFUL, type CngxStateful } from '@cngx/core/utils';

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
});
