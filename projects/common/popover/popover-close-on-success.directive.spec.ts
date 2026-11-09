import { Component, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import {
  CNGX_ACTION_STATUS,
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
  ],
  template: `<ng-content />`,
})
class TestCloseHost {}

@Component({
  imports: [CngxPopover, TestCloseHost],
  template: `
    <div cngxPopover>
      <button
        testCloseHost
        [action]="action"
        [closeOnSuccessDelay]="delay()"
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

function setup(config?: number, delay?: number | null) {
  if (config !== undefined) {
    TestBed.configureTestingModule({ providers: [providePopoverPanel(withCloseOnSuccess(config))] });
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
});
