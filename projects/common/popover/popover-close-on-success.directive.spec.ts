import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import {
  CNGX_ACTION_STATUS,
  CNGX_ANNOUNCEMENT_COVER,
  CNGX_HOST_INTERACTION_STATE,
  CngxActionStatusBrain,
  CngxAsyncClick,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';

import { providePopoverPanel, withCloseOnSuccess } from './popover-panel.config';
import { CngxPopoverCloseOnSuccess } from './popover-close-on-success.directive';
import { CngxPopover } from './popover.directive';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testCloseHost]',
  hostDirectives: [
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    { directive: CngxActionStatusBrain, inputs: ['succeededAnnouncement', 'externalState'] },
    { directive: CngxPopoverCloseOnSuccess, inputs: ['closeOnSuccessDelay'] },
  ],
  providers: [
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => ({
        disabled: signal(false),
        announcement: inject(CNGX_ACTION_STATUS).announcement,
      }),
    },
  ],
  template: `<ng-content />`,
})
class TestCloseHost {}

/** A close host with a second cover (a toast stand-in) that voices every success. */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testToastedCloseHost]',
  hostDirectives: [
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    { directive: CngxActionStatusBrain, inputs: ['succeededAnnouncement'] },
    { directive: CngxPopoverCloseOnSuccess, inputs: ['closeOnSuccessDelay'] },
  ],
  providers: [
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => ({
        disabled: signal(false),
        announcement: inject(CNGX_ACTION_STATUS).announcement,
      }),
    },
    {
      provide: CNGX_ANNOUNCEMENT_COVER,
      useValue: { covers: (s: string) => s === 'success' },
      multi: true,
    },
  ],
  template: `<ng-content />`,
})
class TestToastedCloseHost {}

@Component({
  imports: [CngxPopover, TestToastedCloseHost],
  template: `
    <div cngxPopover>
      <button testToastedCloseHost [action]="action" succeededAnnouncement="Saved">Save</button>
    </div>
  `,
})
class ToastedHost {
  readonly popover = viewChild.required(CngxPopover);
  resolveFn: (() => void) | null = null;
  readonly action = (): Promise<void> =>
    new Promise<void>((resolve) => {
      this.resolveFn = resolve;
    });
}

@Component({
  imports: [CngxPopover, TestCloseHost],
  template: `
    <div cngxPopover>
      <button
        testCloseHost
        [action]="action"
        [closeOnSuccessDelay]="delay()"
        [externalState]="ext()"
        succeededAnnouncement="Saved"
      >
        Save
      </button>
    </div>
  `,
})
class Host {
  readonly popover = viewChild.required(CngxPopover);
  readonly delay = signal<number | null | undefined>(undefined);
  readonly ext = signal<CngxAsyncState<unknown> | undefined>(undefined);
  outcome: 'success' | 'error' = 'success';
  resolveFn: (() => void) | null = null;
  readonly action = (): Promise<void> =>
    this.outcome === 'error'
      ? Promise.reject(new Error('nope'))
      : new Promise<void>((resolve) => {
          this.resolveFn = resolve;
        });
}

function stubPopoverElement(el: HTMLElement): void {
  const rec = el as unknown as Record<string, unknown>;
  rec['showPopover'] = vi.fn();
  rec['hidePopover'] = vi.fn();
  rec['togglePopover'] = vi.fn();
  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
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

function setup(config?: number, delay?: number | null) {
  if (config !== undefined) {
    TestBed.configureTestingModule({
      providers: [providePopoverPanel(withCloseOnSuccess(config))],
    });
  }
  const announce = vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce');
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  host.delay.set(delay);
  const root = fixture.nativeElement as HTMLElement;
  const popoverEl = root.querySelector('[cngxPopover]') as HTMLElement & {
    hidePopover: ReturnType<typeof vi.fn>;
  };
  stubPopoverElement(popoverEl);
  const render = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  render();
  host.popover().show();
  render();
  const btn = root.querySelector('button') as HTMLButtonElement;
  const region = (): string => root.querySelector('[aria-live="polite"]')?.textContent ?? '';
  const succeed = async (): Promise<void> => {
    btn.click();
    await vi.advanceTimersByTimeAsync(0);
    render();
    host.resolveFn?.();
    await vi.advanceTimersByTimeAsync(0);
    render();
  };
  return { fixture, host, btn, popoverEl, announce, region, render, succeed };
}

describe('CngxPopoverCloseOnSuccess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('closes after the configured delay', async () => {
    const { host, popoverEl, succeed } = setup(300);
    await succeed();
    await vi.advanceTimersByTimeAsync(299);
    expect(popoverEl.hidePopover).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(popoverEl.hidePopover).toHaveBeenCalled();
    expect(host.popover().state()).toBe('closed');
  });

  it('closes after a per-instance delay without the config feature', async () => {
    const { popoverEl, succeed } = setup(undefined, 50);
    await succeed();
    await vi.advanceTimersByTimeAsync(50);
    expect(popoverEl.hidePopover).toHaveBeenCalled();
  });

  it('keeps the popover open under a per-instance null and speaks in the region', async () => {
    const { popoverEl, announce, region, succeed } = setup(100, null);
    await succeed();
    await vi.advanceTimersByTimeAsync(1000);
    expect(popoverEl.hidePopover).not.toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalled();
    expect(region()).toBe('Saved');
  });

  it('closes on a success edge of a bound external state', async () => {
    const mock = mockState();
    const { host, popoverEl, announce, render } = setup(300);
    host.ext.set(mock.state);
    render();
    mock.status.set('pending');
    render();
    mock.status.set('success');
    render();
    await vi.advanceTimersByTimeAsync(300);
    expect(popoverEl.hidePopover).toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith('Saved', 'polite', expect.anything());
  });

  it('closes nothing for an own run while an external state is bound', async () => {
    const mock = mockState();
    const { host, popoverEl, render, succeed } = setup(300);
    host.ext.set(mock.state);
    render();
    await succeed();
    await vi.advanceTimersByTimeAsync(500);
    expect(popoverEl.hidePopover).not.toHaveBeenCalled();
  });

  it('closes nothing on an error', async () => {
    const { host, btn, popoverEl, render } = setup(0);
    host.outcome = 'error';
    btn.click();
    await vi.advanceTimersByTimeAsync(0);
    render();
    await vi.advanceTimersByTimeAsync(100);
    expect(popoverEl.hidePopover).not.toHaveBeenCalled();
  });

  it('cancels a scheduled close when a follow-up run starts', async () => {
    const { btn, popoverEl, render, succeed } = setup(300);
    await succeed();
    await vi.advanceTimersByTimeAsync(100);
    btn.click();
    await vi.advanceTimersByTimeAsync(0);
    render();
    await vi.advanceTimersByTimeAsync(500);
    expect(popoverEl.hidePopover).not.toHaveBeenCalled();
  });

  it('clears the timer on destroy', async () => {
    const { fixture, host, succeed } = setup(300);
    await succeed();
    const hide = vi.spyOn(host.popover(), 'hide');
    fixture.destroy();
    // The popover may tear itself down on destroy; the timer must add no call.
    const atDestroy = hide.mock.calls.length;
    await vi.advanceTimersByTimeAsync(500);
    expect(hide).toHaveBeenCalledTimes(atDestroy);
  });

  it('speaks a closing success outside once and leaves the region empty for it', async () => {
    const { announce, region, succeed } = setup(300);
    await succeed();
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce.mock.calls[0][0]).toBe('Saved');
    expect(announce.mock.calls[0][1]).toBe('polite');
    expect(region()).toBe('');
  });

  it('speaks nothing outside when another co-hosted cover voices the success', async () => {
    TestBed.configureTestingModule({ providers: [providePopoverPanel(withCloseOnSuccess(300))] });
    const announce = vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce');
    const fixture = TestBed.createComponent(ToastedHost);
    const root = fixture.nativeElement as HTMLElement;
    const popoverEl = root.querySelector('[cngxPopover]') as HTMLElement & {
      hidePopover: ReturnType<typeof vi.fn>;
    };
    stubPopoverElement(popoverEl);
    const render = (): void => {
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
    };
    render();
    fixture.componentInstance.popover().show();
    render();
    (root.querySelector('button') as HTMLButtonElement).click();
    await vi.advanceTimersByTimeAsync(0);
    render();
    fixture.componentInstance.resolveFn?.();
    await vi.advanceTimersByTimeAsync(0);
    render();
    expect(announce).not.toHaveBeenCalled();
    expect(root.querySelector('[aria-live="polite"]')?.textContent ?? '').toBe('');
    await vi.advanceTimersByTimeAsync(300);
    expect(popoverEl.hidePopover).toHaveBeenCalled();
  });
});
