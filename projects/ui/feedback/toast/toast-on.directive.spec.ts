import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CNGX_STATEFUL, type CngxStateful } from '@cngx/core/utils';

import { provideToasts, CngxToaster } from './toast.service';
import { CngxToastOn } from './toast-on.directive';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';

@Component({
  selector: 'test-toast-explicit',
  template: `
    <div
      [cngxToastOn]="state()"
      toastSuccess="Saved"
      toastError="Failed">
    </div>
  `,
  imports: [CngxToastOn],
})
class ExplicitHost {
  readonly state = signal<ManualAsyncState<string> | undefined>(createManualState<string>());
}

@Component({
  selector: 'test-toast-fallback',
  template: `
    <div cngxToastOn toastSuccess="Saved" toastError="Failed"></div>
  `,
  imports: [CngxToastOn],
})
class FallbackHost { }

@Component({
  selector: 'test-toast-missing',
  template: `
    <div cngxToastOn toastSuccess="Saved"></div>
  `,
  imports: [CngxToastOn],
})
class MissingSourceHost { }

@Component({
  selector: 'test-toast-mixed',
  template: `<div [cngxToastOn]="inputState" toastSuccess="FromInput"></div>`,
  imports: [CngxToastOn],
})
class MixedHost {
  readonly inputState = createManualState<string>();
}

describe('CngxToastOn', () => {
  it('uses explicit state input when provided', () => {
    TestBed.configureTestingModule({
      imports: [ExplicitHost],
      providers: [provideToasts()],
    });
    const toaster = TestBed.inject(CngxToaster);
    const fixture = TestBed.createComponent(ExplicitHost);
    fixture.detectChanges();
    TestBed.tick();

    const state = fixture.componentInstance.state()!;
    state.setSuccess('ok');
    TestBed.tick();

    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].config.message).toBe('Saved');
  });

  it('falls back to CNGX_STATEFUL when no state input is bound', () => {
    const tokenState = createManualState<string>();
    const stateful: CngxStateful<string> = { state: tokenState };

    TestBed.configureTestingModule({
      imports: [FallbackHost],
      providers: [provideToasts(), { provide: CNGX_STATEFUL, useValue: stateful }],
    });
    const toaster = TestBed.inject(CngxToaster);
    const fixture = TestBed.createComponent(FallbackHost);
    fixture.detectChanges();
    TestBed.tick();

    tokenState.setSuccess('ok');
    TestBed.tick();

    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].config.message).toBe('Saved');
  });

  it('logs dev-mode error when neither state input nor CNGX_STATEFUL is available', () => {
    TestBed.configureTestingModule({
      imports: [MissingSourceHost],
      providers: [provideToasts()],
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(MissingSourceHost);
    fixture.detectChanges();
    TestBed.tick();
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/No state source/));
    spy.mockRestore();
  });

  it('explicit input wins over CNGX_STATEFUL', () => {
    const tokenState = createManualState<string>();

    TestBed.configureTestingModule({
      imports: [MixedHost],
      providers: [
        provideToasts(),
        { provide: CNGX_STATEFUL, useValue: { state: tokenState } satisfies CngxStateful<string> },
      ],
    });
    const toaster = TestBed.inject(CngxToaster);
    const fixture = TestBed.createComponent(MixedHost);
    fixture.detectChanges();
    TestBed.tick();

    tokenState.setSuccess('from-token');
    TestBed.tick();
    expect(toaster.toasts().length).toBe(0);

    fixture.componentInstance.inputState.setSuccess('from-input');
    TestBed.tick();
    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].config.message).toBe('FromInput');
  });
});
