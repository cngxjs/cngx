import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxFailed, CngxPending, CngxSucceeded } from '@cngx/common/interactive';

import { CngxPopoverAction } from './popover-action.component';
import { providePopoverPanel, withCloseOnSuccess } from './popover-panel.config';
import { CngxPopover } from './popover.directive';

// ── Test helpers ────────────────────────────────────────────────────────

function stubPopoverElement(el: HTMLElement): void {
  const rec = el as unknown as Record<string, unknown>;
  rec['showPopover'] = vi.fn();
  rec['hidePopover'] = vi.fn();
  rec['togglePopover'] = vi.fn();

  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <cngx-popover-action role="dismiss" #act="cngxPopoverAction">Cancel</cngx-popover-action>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction],
})
class DismissHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly action = viewChild.required(CngxPopoverAction);
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <cngx-popover-action
        role="confirm"
        [action]="saveAction"
        [feedbackDuration]="500"
        #act="cngxPopoverAction"
      >
        Save
        <ng-template cngxPending>Saving...</ng-template>
        <ng-template cngxSucceeded>Saved!</ng-template>
        <ng-template cngxFailed let-err>Failed: {{ err }}</ng-template>
      </cngx-popover-action>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction, CngxPending, CngxSucceeded, CngxFailed],
})
class ConfirmHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly action = viewChild.required(CngxPopoverAction);

  resolveFn!: () => void;
  rejectFn!: (err: unknown) => void;

  readonly saveAction = () =>
    new Promise<void>((resolve, reject) => {
      this.resolveFn = resolve;
      this.rejectFn = reject;
    });
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <cngx-popover-action role="confirm" #act="cngxPopoverAction">Broken</cngx-popover-action>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction],
})
class ActionlessConfirmHost {
  readonly action = viewChild.required(CngxPopoverAction);
}

function setup<T>(hostType: new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
  stubPopoverElement(popoverEl);
  return { fixture, popoverEl };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxPopoverAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should render dismiss button that closes popover on click', () => {
    const { fixture, popoverEl } = setup(DismissHost);

    fixture.componentInstance.popover().show();

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-popover-action',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Cancel');

    btn.click();
    fixture.detectChanges();

    expect(popoverEl.hidePopover).toHaveBeenCalled();
  });

  it('should render confirm button with async click', async () => {
    const { fixture } = setup(ConfirmHost);

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-popover-action',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();

    btn.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(btn.textContent).toContain('Saving...');
  });

  it('should show pending template during async action', async () => {
    const { fixture } = setup(ConfirmHost);

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-popover-action',
    ) as HTMLButtonElement;

    btn.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(btn.textContent).toContain('Saving...');
    expect(btn.textContent).not.toContain('Save');
  });

  it('should show succeeded template after success', async () => {
    const { fixture } = setup(ConfirmHost);
    const host = fixture.componentInstance;

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-popover-action',
    ) as HTMLButtonElement;

    btn.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);

    host.resolveFn();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(btn.textContent).toContain('Saved!');
  });

  describe('status passthrough', () => {
    it('mirrors the confirm lifecycle on the exported status()', async () => {
      const { fixture } = setup(ConfirmHost);
      const host = fixture.componentInstance;
      const act = host.action();
      expect(act.status()).toBe('idle');

      const btn = (fixture.nativeElement as HTMLElement).querySelector(
        '.cngx-popover-action',
      ) as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      expect(act.status()).toBe('pending');

      host.resolveFn();
      await vi.advanceTimersByTimeAsync(0);
      expect(act.status()).toBe('success');

      // feedbackDuration=500 resets the async-click state back to idle
      await vi.advanceTimersByTimeAsync(500);
      expect(act.status()).toBe('idle');
    });

    it('reports error status after a failed action', async () => {
      const { fixture } = setup(ConfirmHost);
      const host = fixture.componentInstance;

      const btn = (fixture.nativeElement as HTMLElement).querySelector(
        '.cngx-popover-action',
      ) as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      host.rejectFn('boom');
      await vi.advanceTimersByTimeAsync(0);
      expect(host.action().status()).toBe('error');
    });

    it('stays idle for role="dismiss"', () => {
      const { fixture } = setup(DismissHost);
      expect(fixture.componentInstance.action().status()).toBe('idle');
    });
  });

  describe('withCloseOnSuccess', () => {
    function closeOnSuccessSetup(delay?: number) {
      if (delay !== undefined) {
        TestBed.configureTestingModule({
          imports: [ConfirmHost],
          providers: [providePopoverPanel(withCloseOnSuccess(delay))],
        });
      }
      const { fixture, popoverEl } = setup(ConfirmHost);
      const host = fixture.componentInstance;
      host.popover().show();
      fixture.detectChanges();
      return { fixture, host, popoverEl };
    }

    function clickConfirm(fixture: { nativeElement: HTMLElement }): void {
      const btn = fixture.nativeElement.querySelector('.cngx-popover-action') as HTMLButtonElement;
      btn.click();
    }

    async function settle(fixture: {
      detectChanges(): void;
    }): Promise<void> {
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      TestBed.flushEffects();
    }

    it('closes the composing popover after the configured delay', async () => {
      const { fixture, host, popoverEl } = closeOnSuccessSetup(300);
      clickConfirm(fixture);
      await settle(fixture);
      host.resolveFn();
      await settle(fixture);

      await vi.advanceTimersByTimeAsync(299);
      expect(popoverEl.hidePopover).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(popoverEl.hidePopover).toHaveBeenCalled();
      expect(host.popover().state()).toBe('closed');
    });

    it('closes immediately with delay 0', async () => {
      const { fixture, host, popoverEl } = closeOnSuccessSetup(0);
      clickConfirm(fixture);
      await settle(fixture);
      host.resolveFn();
      await settle(fixture);

      await vi.runOnlyPendingTimersAsync();
      expect(popoverEl.hidePopover).toHaveBeenCalled();
      expect(host.popover().state()).toBe('closed');
    });

    it('does not auto-close without the feature', async () => {
      const { fixture, host, popoverEl } = closeOnSuccessSetup();
      clickConfirm(fixture);
      await settle(fixture);
      host.resolveFn();
      await settle(fixture);

      await vi.advanceTimersByTimeAsync(5000);
      expect(popoverEl.hidePopover).not.toHaveBeenCalled();
      expect(host.popover().state()).not.toBe('closed');
    });

    it('cancels the scheduled close when the action is re-triggered', async () => {
      const { fixture, host, popoverEl } = closeOnSuccessSetup(1000);
      clickConfirm(fixture);
      await settle(fixture);
      host.resolveFn();
      await settle(fixture);

      // Re-run before the close fires; the new pending run must cancel it.
      await vi.advanceTimersByTimeAsync(100);
      clickConfirm(fixture);
      await settle(fixture);

      await vi.advanceTimersByTimeAsync(5000);
      expect(popoverEl.hidePopover).not.toHaveBeenCalled();
      expect(host.popover().state()).not.toBe('closed');
    });
  });

  describe('confirm without [action] dev warning', () => {
    it('warns when role="confirm" has no bound action', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        setup(ActionlessConfirmHost);
        const actionWarn = warnSpy.mock.calls.find((call) =>
          String(call[0]).includes('CngxPopoverAction'),
        );
        expect(actionWarn).toBeDefined();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not warn when [action] is bound', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        setup(ConfirmHost);
        const actionWarn = warnSpy.mock.calls.find((call) =>
          String(call[0]).includes('CngxPopoverAction'),
        );
        expect(actionWarn).toBeUndefined();
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  it('should show failed template with error context after failure', async () => {
    const { fixture } = setup(ConfirmHost);
    const host = fixture.componentInstance;

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-popover-action',
    ) as HTMLButtonElement;

    btn.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);

    host.rejectFn('Network error');
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(btn.textContent).toContain('Network error');
  });
});
