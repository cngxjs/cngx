import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CngxButtonBrain, provideActionStatusHost, provideButtonHost } from '@cngx/common/button';
import {
  CNGX_ACTION_STATUS,
  CngxActionStatusBrain,
  CngxActionStatusStack,
  CngxAsyncClick,
  CngxFailed,
} from '@cngx/common/interactive';
import {
  buildAsyncStateView,
  CNGX_LOADING_DEFAULTS,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';

import { CngxActionButton } from './action-button';
import { CngxActionToast } from './action-toast.directive';

/**
 * The ejected action button: the four host directives, the two
 * provider helpers and a verbatim copy of the template, with no
 * class body beyond `brain` and `status`.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testEjectedAction]',
  imports: [NgComponentOutlet, CngxActionStatusStack],
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: ['variant: testEjectedAction', 'tone', 'size', 'disabled', 'disabledReason'],
    },
    {
      directive: CngxAsyncClick,
      inputs: ['cngxAsyncClick: action', 'feedbackDuration', 'showDelay', 'minDwell'],
    },
    {
      directive: CngxActionStatusBrain,
      inputs: [
        'succeededAnnouncement',
        'failedAnnouncement',
        'autoAnnounce',
        'pendingLabel',
        'succeededLabel',
        'failedLabel',
        'externalState',
      ],
    },
    { directive: CngxActionToast, inputs: ['toastSuccess', 'toastError'] },
  ],
  providers: [
    provideButtonHost('testEjectedAction', { defaultVariant: 'solid' }),
    provideActionStatusHost(),
  ],
  host: { class: 'cngx-button cngx-action-button' },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span
      class="cngx-button__label cngx-action-button__labels"
      cngxActionStatusStack
      cellClass="cngx-action-button__label"
    >
      <ng-content />
    </span>
    <ng-content select="[cngxButtonEnd]" />
    @if (brain.busyVisible() && status.activeCell() === 'idle') {
      <span class="cngx-button__busy" aria-hidden="true">
        @if (brain.spinner; as spinner) {
          <ng-container *ngComponentOutlet="spinner" />
        } @else {
          <span class="cngx-button__spinner"></span>
        }
      </span>
    }
    @if (brain.disabledReason(); as reason) {
      <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
})
class TestEjectedAction {
  protected readonly brain = inject(CngxButtonBrain);
  protected readonly status = inject(CNGX_ACTION_STATUS);
}

@Component({
  imports: [CngxActionButton, TestEjectedAction, CngxFailed],
  template: `
    <div class="lib">
      <button
        cngxActionButton
        [action]="action"
        pendingLabel="Saving"
        succeededLabel="Saved"
        [externalState]="ext()"
      >
        Save
        <ng-template cngxFailed let-err>Err: {{ err }}</ng-template>
      </button>
    </div>
    <div class="eject">
      <button
        testEjectedAction
        [action]="action"
        pendingLabel="Saving"
        succeededLabel="Saved"
        [externalState]="ext()"
      >
        Save
        <ng-template cngxFailed let-err>Err: {{ err }}</ng-template>
      </button>
    </div>
  `,
})
class PairHost {
  outcome: 'success' | 'error' | 'hold' = 'success';
  private release: (() => void) | null = null;
  readonly action = (): Promise<void> => {
    if (this.outcome === 'hold') {
      return new Promise<void>((resolve) => {
        this.release = resolve;
      });
    }
    return this.outcome === 'success' ? Promise.resolve() : Promise.reject('boom');
  };
  readonly ext = signal<CngxAsyncState<unknown> | undefined>(undefined);
  finish(): void {
    this.release?.();
  }
}

const ATTRS = [
  'data-status',
  'data-status-label',
  'data-busy',
  'data-pending',
  'aria-busy',
  'aria-disabled',
] as const;

interface Snapshot {
  readonly attrs: Record<string, string | null>;
  readonly active: string;
  readonly hidden: (string | null)[];
  readonly spinner: boolean;
  readonly region: string;
}

function snapshot(wrapper: HTMLElement): Snapshot {
  const btn = wrapper.querySelector('button') as HTMLButtonElement;
  const cells = Array.from(btn.querySelectorAll('.cngx-action-button__label'));
  return {
    attrs: Object.fromEntries(ATTRS.map((a) => [a, btn.getAttribute(a)])),
    active: btn.querySelector('.cngx-action-button__label[data-active]')?.textContent?.trim() ?? '',
    hidden: cells.map((c) => c.getAttribute('aria-hidden')),
    spinner: !!btn.querySelector('.cngx-button__busy'),
    region: wrapper.querySelector('[aria-live="polite"]')?.textContent ?? '',
  };
}

function mockState() {
  const status = signal<AsyncStatus>('idle');
  const state = buildAsyncStateView<unknown>({
    status: status.asReadonly(),
    data: computed(() => undefined),
    error: computed(() => undefined),
    lastUpdated: computed(() => undefined),
  });
  return { state, status };
}

function setup() {
  const fixture = TestBed.createComponent(PairHost);
  const root = fixture.nativeElement as HTMLElement;
  const render = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  render();
  const lib = root.querySelector('.lib') as HTMLElement;
  const eject = root.querySelector('.eject') as HTMLElement;
  const clickBoth = (): void => {
    for (const w of [lib, eject]) {
      (w.querySelector('button') as HTMLButtonElement).click();
    }
  };
  const expectSame = (expected: Partial<Snapshot>): void => {
    const a = snapshot(lib);
    expect(snapshot(eject)).toEqual(a);
    expect(a).toMatchObject(expected);
  };
  return { fixture, host: fixture.componentInstance, render, clickBoth, expectSame };
}

describe('ejected CngxActionButton template on the brain directives alone', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('idle', () => {
    const { expectSame } = setup();
    expectSame({ active: 'Save', spinner: false, region: '' });
  });

  it('pending after the show delay', async () => {
    vi.useFakeTimers();
    const { host, render, clickBoth, expectSame } = setup();
    host.outcome = 'hold';
    clickBoth();
    render();
    await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
    render();
    expectSame({
      active: 'Saving',
      attrs: { 'data-status': 'pending', 'data-busy': 'true', 'aria-busy': 'true' },
    });
    host.finish();
    await vi.advanceTimersByTimeAsync(0);
  });

  it('success', async () => {
    const { host, render, clickBoth, expectSame } = setup();
    host.outcome = 'success';
    clickBoth();
    await vi.waitFor(() => {
      render();
      expectSame({ active: 'Saved', region: 'Saved', attrs: { 'data-status': 'success' } });
    });
  });

  it('error with a cngxFailed template', async () => {
    const { host, render, clickBoth, expectSame } = setup();
    host.outcome = 'error';
    clickBoth();
    await vi.waitFor(() => {
      render();
      expectSame({ active: 'Err: boom', region: 'Err: boom' });
    });
  });

  it('external pending', async () => {
    vi.useFakeTimers();
    const mock = mockState();
    const { host, render, expectSame } = setup();
    host.ext.set(mock.state);
    render();
    mock.status.set('pending');
    render();
    await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
    render();
    expectSame({ active: 'Saving', attrs: { 'data-status': 'pending', 'aria-busy': 'true' } });
  });

  it('external success', () => {
    const mock = mockState();
    const { host, render, expectSame } = setup();
    host.ext.set(mock.state);
    render();
    mock.status.set('success');
    render();
    expectSame({ active: 'Saved', region: 'Saved' });
  });
});
