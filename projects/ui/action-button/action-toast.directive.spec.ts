import { Component, computed, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CNGX_ACTION_STATUS,
  CNGX_ASYNC_RUN_STATE,
  CNGX_HOST_INTERACTION_STATE,
  CngxActionStatusBrain,
  CngxAsyncClick,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { CngxToastOn, CngxToaster } from '@cngx/ui/feedback';

import { CngxActionToast } from './action-toast.directive';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testToastHost]',
  hostDirectives: [
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    { directive: CngxActionStatusBrain, inputs: ['autoAnnounce', 'externalState'] },
    {
      directive: CngxActionToast,
      inputs: ['toastSuccess', 'toastError', 'toastErrorDetail', 'toastErrorDuration'],
    },
  ],
  providers: [
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => {
        const status = inject(CNGX_ACTION_STATUS);
        return { disabled: signal(false), busy: status.externalBusy, announcement: status.announcement };
      },
    },
  ],
  template: `<ng-content />`,
})
class TestToastHost {}

@Component({
  imports: [TestToastHost],
  template: `
    <button
      testToastHost
      [action]="action"
      [autoAnnounce]="autoAnnounce()"
      [externalState]="ext()"
      toastSuccess="Saved"
      toastError="Save failed"
      [toastErrorDetail]="detail()"
      [toastErrorDuration]="errorDuration()"
    >
      Save
    </button>
  `,
})
class Host {
  actionImpl: () => Promise<unknown> = () => Promise.resolve();
  readonly action = () => this.actionImpl();
  readonly autoAnnounce = signal<boolean | undefined>(undefined);
  readonly detail = signal(false);
  readonly errorDuration = signal<number | 'persistent' | undefined>(undefined);
  readonly ext = signal<CngxAsyncState<unknown> | undefined>(undefined);
}

@Component({
  imports: [TestToastHost, CngxToastOn],
  template: `
    <button testToastHost [action]="action" toastSuccess="Saved" [cngxToastOn]="state">Save</button>
  `,
})
class DoubleToastHost {
  readonly action = () => Promise.resolve();
  readonly state = buildAsyncStateView<unknown>({
    status: signal<AsyncStatus>('idle'),
    data: computed(() => undefined),
    error: computed(() => undefined),
    lastUpdated: computed(() => undefined),
  });
}

function mockState() {
  const status = signal<AsyncStatus>('idle');
  const error = signal<unknown>(undefined);
  const state = buildAsyncStateView<unknown>({
    status: status.asReadonly(),
    data: computed(() => undefined),
    error: error.asReadonly(),
    lastUpdated: computed(() => undefined),
  });
  return { state, status, error };
}

function setup(configure?: (host: Host) => void, toaster = true) {
  const show = vi.fn();
  if (toaster) {
    TestBed.configureTestingModule({ providers: [{ provide: CngxToaster, useValue: { show } }] });
  }
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  const render = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  render();
  const root = fixture.nativeElement as HTMLElement;
  const btn = root.querySelector('button') as HTMLButtonElement;
  const runState = fixture.debugElement.children[0].injector.get(CNGX_ASYNC_RUN_STATE);
  const region = (): string => root.querySelector('[aria-live="polite"]')?.textContent ?? '';
  const run = async (outcome: 'success' | 'error'): Promise<void> => {
    fixture.componentInstance.actionImpl = () =>
      outcome === 'success' ? Promise.resolve() : Promise.reject(new Error('DB timeout'));
    btn.click();
    await vi.waitFor(() => {
      render();
      expect(runState.state.status()).toBe(outcome);
    });
    render();
  };
  return { fixture, host: fixture.componentInstance, btn, show, region, run, render };
}

describe('CngxActionToast', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows one toast per own settle', async () => {
    const { show, run } = setup();
    await run('success');
    await run('success');
    await run('error');
    expect(show.mock.calls.map(([t]) => [t.message, t.severity])).toEqual([
      ['Saved', 'success'],
      ['Saved', 'success'],
      ['Save failed', 'error'],
    ]);
  });

  it('leaves unbound durations to the toaster and forwards a bound one', async () => {
    const { show, run, host, render } = setup();
    await run('success');
    await run('error');
    // undefined lets CngxToaster resolve withToasts({ defaultDuration }) / 'persistent'.
    expect(show.mock.calls.map(([t]) => t.duration)).toEqual([undefined, undefined]);
    host.errorDuration.set(4000);
    render();
    await run('error');
    expect(show.mock.calls[2][0].duration).toBe(4000);
  });

  it('shows one toast per external edge, and none for the own runs while bound', async () => {
    const mock = mockState();
    const { show, render, run } = setup((h) => h.ext.set(mock.state));
    mock.status.set('success');
    render();
    render();
    expect(show).toHaveBeenCalledTimes(1);
    mock.status.set('pending');
    render();
    mock.status.set('error');
    render();
    expect(show.mock.calls.map(([t]) => t.severity)).toEqual(['success', 'error']);
    await run('success');
    expect(show).toHaveBeenCalledTimes(2);
  });

  it('adds the error detail to the error toast body', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { show, run } = setup((h) => h.detail.set(true));
    await run('error');
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '⁨Save failed⁩: ⁨DB timeout⁩',
        severity: 'error',
      }),
    );
  });

  it('is inert without a toaster and leaves the region to the brain', async () => {
    const { region, run } = setup(undefined, false);
    await run('success');
    expect(region()).toBe('Action succeeded');
  });

  it('covers a toasted outcome unless autoAnnounce is true', async () => {
    const covered = setup();
    await covered.run('success');
    expect(covered.region()).toBe('');
    covered.fixture.destroy();

    TestBed.resetTestingModule();
    const spoken = setup((h) => h.autoAnnounce.set(true));
    await spoken.run('success');
    expect(spoken.region()).toBe('Action succeeded');
  });

  it('warns CNGX3008 when [cngxToastOn] and toastSuccess share the element', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: CngxToaster, useValue: { show: vi.fn() } }],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(DoubleToastHost);
    fixture.detectChanges();
    TestBed.tick();
    const calls = warn.mock.calls.filter(([m]) => /^CNGX3008: /.test(String(m)));
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatch(/^CNGX3008: \[cngxActionToast\] \[toastSuccess\]\/\[toastError\] inputs/);
  });
});
