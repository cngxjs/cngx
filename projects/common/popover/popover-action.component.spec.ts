import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxFailed, CngxPending, CngxSucceeded } from '@cngx/common/interactive';
import {
  CNGX_LOADING_DEFAULTS,
  provideLoadingConfig,
  withMinDwell,
  withShowDelay,
} from '@cngx/core/utils';

import { CngxPopoverAction } from './popover-action.component';
import { CngxPopoverDismiss } from './popover-dismiss.component';
import { CngxPopoverPanel } from './popover-panel.component';
import { providePopoverPanel, withCloseOnSuccess } from './popover-panel.config';
import { CngxPopoverBody, CngxPopoverFooter } from './popover-panel-slots';
import { CngxPopoverTrigger } from './popover-trigger.directive';
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
      <button cngxPopoverAction [action]="saveAction" [feedbackDuration]="500" #act="cngxPopoverAction">
        Save
        <ng-template cngxPending>Saving...</ng-template>
        <ng-template cngxSucceeded>Saved!</ng-template>
        <ng-template cngxFailed let-err>Failed: {{ err }}</ng-template>
      </button>
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

// A confirm without [action] no longer compiles (`[action]` is the required
// input of the co-hosted CngxAsyncClick), so CNGX1035 is retired. Closing
// without a run is the dismiss host's job; a confirm that must not run yet is
// disabled with a reason.
@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <button cngxPopoverDismiss>Not now</button>
      <button
        cngxPopoverAction
        [action]="saveAction"
        [disabled]="true"
        disabledReason="Fill in the name first"
        #act="cngxPopoverAction"
      >
        Broken
      </button>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction, CngxPopoverDismiss],
})
class ActionlessConfirmHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly action = viewChild.required(CngxPopoverAction);
  runs = 0;
  readonly saveAction = () => {
    this.runs += 1;
    return Promise.resolve();
  };
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <button
        cngxPopoverAction
        [action]="saveAction"
        [feedbackDuration]="500"
        [showDelay]="0"
        [minDwell]="0"
        #act="cngxPopoverAction"
      >
        Save
      </button>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction],
})
class ForwardConfirmHost {
  readonly action = viewChild.required(CngxPopoverAction);

  resolveFn!: () => void;

  readonly saveAction = () =>
    new Promise<void>((resolve) => {
      this.resolveFn = resolve;
    });
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <button cngxPopoverAction [action]="saveAction">
        Save
        <ng-template cngxFailed><span aria-hidden="true">!</span> Permission denied</ng-template>
      </button>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction, CngxFailed],
})
class GlyphFailedHost {
  readonly popover = viewChild.required(CngxPopover);
  outcome: 'success' | 'error' = 'error';
  readonly saveAction = () =>
    this.outcome === 'success' ? Promise.resolve() : Promise.reject(new Error('403'));
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <button cngxPopoverAction [action]="saveAction">Save</button>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction],
})
class PlainConfirmHost {
  readonly popover = viewChild.required(CngxPopover);
  outcome: 'success' | 'error' = 'error';
  readonly saveAction = () =>
    this.outcome === 'success' ? Promise.resolve() : Promise.reject(new Error('nope'));
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <button
        [cngxPopoverAction]="variant()"
        [tone]="tone()"
        [action]="saveAction"
        [feedbackDuration]="feedback()"
        [disabled]="disabled()"
        [disabledReason]="reason()"
        [succeededAnnouncement]="succeeded()"
        [failedAnnouncement]="failed()"
        [autoAnnounce]="auto()"
        #act="cngxPopoverAction"
      >
        Save
        <ng-template cngxSucceeded>Saved!</ng-template>
        <ng-template cngxFailed>Could not save</ng-template>
      </button>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverAction, CngxSucceeded, CngxFailed],
})
class ConfigurableHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly action = viewChild.required(CngxPopoverAction);
  readonly variant = signal<'solid' | undefined>(undefined);
  readonly tone = signal<'primary' | undefined>(undefined);
  readonly feedback = signal(2000);
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>(undefined);
  readonly succeeded = signal<string | undefined>(undefined);
  readonly failed = signal<string | undefined>(undefined);
  readonly auto = signal<boolean | undefined>(undefined);
  outcome: 'success' | 'error' = 'success';
  runs = 0;
  readonly saveAction = () => {
    this.runs += 1;
    return this.outcome === 'success' ? Promise.resolve() : Promise.reject(new Error('nope'));
  };
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="panel.popover" id="trigger">Open</button>
    <cngx-popover-panel #panel>
      <p cngxPopoverBody>Save the draft?</p>
      <div cngxPopoverFooter>
        <button cngxPopoverDismiss>Cancel</button>
        <button cngxPopoverAction [action]="saveAction">Save</button>
      </div>
    </cngx-popover-panel>
  `,
  imports: [
    CngxPopoverTrigger,
    CngxPopoverPanel,
    CngxPopoverBody,
    CngxPopoverFooter,
    CngxPopoverDismiss,
    CngxPopoverAction,
  ],
})
class PanelConfirmHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
  readonly saveAction = () => Promise.resolve();
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

  it('should render confirm button with async click', async () => {
    const { fixture } = setup(ConfirmHost);

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-popover-action',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();

    btn.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
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
    await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
    fixture.detectChanges();

    expect(btn.textContent).toContain('Saving...');
    expect(btn.textContent).not.toContain('Save');
  });

  it('keeps the idle label for a run that settles before the show delay', async () => {
    const { fixture } = setup(ConfirmHost);
    const host = fixture.componentInstance;
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-popover-action',
    ) as HTMLButtonElement;

    btn.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay - 1);
    fixture.detectChanges();
    expect(host.action().busyVisible()).toBe(false);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.textContent).not.toContain('Saving...');

    host.resolveFn();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(btn.textContent).toContain('Saved!');
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

    async function settle(fixture: { detectChanges(): void }): Promise<void> {
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

  describe('confirm without [action] (CNGX1035 retired)', () => {
    it('never warns CNGX1035: a confirm always has a bound action', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        setup(ConfirmHost);
        setup(ActionlessConfirmHost);
        const actionWarns = warnSpy.mock.calls.filter((call) =>
          /^CNGX1035: /.test(String(call[0])),
        );
        expect(actionWarns).toHaveLength(0);
        expect(
          warnSpy.mock.calls.find((call) => /cngx-popover-action/.test(String(call[0]))),
        ).toBeUndefined();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('makes the click of a disabled confirm a no-op: no run, no failed state, popover open', async () => {
      const { fixture, popoverEl } = setup(ActionlessConfirmHost);
      const host = fixture.componentInstance;
      host.popover().show();
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.cngx-popover-action') as HTMLButtonElement;
      button.click();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      expect(host.runs).toBe(0);
      expect(host.action().status()).toBe('idle');
      expect(button.querySelector('.cngx-button__label')?.textContent?.trim()).toBe('Broken');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(popoverEl.hidePopover).not.toHaveBeenCalled();
    });

    it('closes through the dismiss host, the replacement for an actionless confirm', () => {
      const { fixture, popoverEl } = setup(ActionlessConfirmHost);
      const host = fixture.componentInstance;
      host.popover().show();
      fixture.detectChanges();
      const dismiss = fixture.nativeElement.querySelector('.cngx-popover-dismiss') as HTMLButtonElement;
      dismiss.click();
      fixture.detectChanges();
      expect(host.runs).toBe(0);
      expect(popoverEl.hidePopover).toHaveBeenCalled();
    });
  });

  describe('busy-gate DOM contract', () => {
    const SHOW = CNGX_LOADING_DEFAULTS.showDelay;
    const DWELL = CNGX_LOADING_DEFAULTS.minDwell;

    // The confirm button never paints as the disabled field during a run: the
    // gated busy flags keep the host out of the disabled rules of
    // button.component.css, keyed on this selector.
    const DISABLED_PAINT = "[aria-disabled='true']:not([data-busy], [data-pending])";
    function paintsDisabled(btn: HTMLElement): boolean {
      return (
        btn.getAttribute('aria-disabled') === 'true' &&
        !btn.hasAttribute('data-busy') &&
        !btn.hasAttribute('data-pending') &&
        btn.matches(DISABLED_PAINT)
      );
    }

    function confirmButton(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
      return fixture.nativeElement.querySelector('.cngx-popover-action') as HTMLButtonElement;
    }

    it('sets data-pending at click and data-busy only after the show delay', async () => {
      const { fixture } = setup(ConfirmHost);
      const btn = confirmButton(fixture);

      btn.click();
      fixture.detectChanges();
      expect(btn.getAttribute('data-pending')).toBe('true');
      expect(btn.hasAttribute('data-busy')).toBe(false);

      await vi.advanceTimersByTimeAsync(SHOW);
      fixture.detectChanges();
      expect(btn.getAttribute('data-busy')).toBe('true');
    });

    it('never paints disabled in the delay window (data-pending set)', async () => {
      const { fixture } = setup(ConfirmHost);
      const btn = confirmButton(fixture);

      btn.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(SHOW - 1);
      fixture.detectChanges();

      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.getAttribute('data-pending')).toBe('true');
      expect(paintsDisabled(btn)).toBe(false);
    });

    it('never paints disabled in the post-settle dwell (data-busy held)', async () => {
      const { fixture } = setup(ConfirmHost);
      const host = fixture.componentInstance;
      const btn = confirmButton(fixture);

      btn.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(SHOW);
      fixture.detectChanges();

      host.resolveFn();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();

      // Inside the held dwell: the run settled (pending() false) but the busy
      // visual is still held, so data-busy is set, data-pending is cleared, and
      // the co-hosted CngxAsyncClick still refuses with aria-disabled - which the
      // data-busy flag keeps out of the disabled paint.
      expect(host.action().busyVisible()).toBe(true);
      expect(btn.hasAttribute('data-pending')).toBe(false);
      expect(btn.getAttribute('data-busy')).toBe('true');
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      expect(paintsDisabled(btn)).toBe(false);

      await vi.advanceTimersByTimeAsync(DWELL);
      fixture.detectChanges();
      expect(btn.hasAttribute('data-busy')).toBe(false);
    });

    it('shows the cngxPending template instead of the spinner once busy', async () => {
      const { fixture } = setup(ConfirmHost);
      const btn = confirmButton(fixture);

      btn.click();
      fixture.detectChanges();
      expect(btn.hasAttribute('data-status-label')).toBe(false);

      await vi.advanceTimersByTimeAsync(SHOW);
      fixture.detectChanges();
      expect(btn.getAttribute('data-busy')).toBe('true');
      expect(btn.hasAttribute('data-status-label')).toBe(true);
      expect(btn.querySelector('.cngx-button__busy')).toBeNull();
      expect(btn.querySelector('.cngx-button__label')?.textContent).toContain('Saving...');
    });

    it('shows the spinner and no status label without a cngxPending template', async () => {
      const { fixture } = setup(ForwardConfirmHost);
      const btn = confirmButton(fixture);

      btn.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      expect(btn.getAttribute('data-busy')).toBe('true');
      expect(btn.hasAttribute('data-status-label')).toBe(false);
      expect(btn.querySelector('.cngx-button__busy')).not.toBeNull();
    });

    it('forwards [showDelay] / [minDwell] to the co-hosted CngxAsyncClick', async () => {
      const { fixture } = setup(ForwardConfirmHost);
      const host = fixture.componentInstance;
      const btn = confirmButton(fixture);

      btn.click();
      fixture.detectChanges();
      // showDelay 0: the busy visual opens one task later, well before the
      // default 120ms delay would.
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      expect(host.action().busyVisible()).toBe(true);

      host.resolveFn();
      await vi.advanceTimersByTimeAsync(10);
      fixture.detectChanges();
      // minDwell 0: the visual releases right after the run ends - far short of
      // the default 400ms dwell, which would still hold it here.
      expect(host.action().busyVisible()).toBe(false);
    });

    it('holds the busy visual for a config-scoped dwell (provideLoadingConfig)', async () => {
      TestBed.configureTestingModule({
        imports: [ConfirmHost],
        providers: [provideLoadingConfig(withShowDelay(60), withMinDwell(300))],
      });
      const { fixture } = setup(ConfirmHost);
      const host = fixture.componentInstance;
      const btn = confirmButton(fixture);

      btn.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(60);
      fixture.detectChanges();
      expect(btn.getAttribute('data-busy')).toBe('true');

      host.resolveFn();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      expect(btn.getAttribute('data-busy')).toBe('true');

      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();
      expect(btn.hasAttribute('data-busy')).toBe(false);
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
  describe('settle announcement', () => {
    // The co-hosted CngxAsyncClick region, rendered as the host's sibling.
    const region = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
      fixture.nativeElement.querySelector(
        '.cngx-popover-action + [role="status"][aria-live="polite"]',
      ) as HTMLElement;
    const button = (fixture: { nativeElement: HTMLElement }): HTMLButtonElement =>
      fixture.nativeElement.querySelector('.cngx-popover-action') as HTMLButtonElement;

    async function settleRender(fixture: { detectChanges(): void }): Promise<void> {
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('speaks the rendered result template after success and after failure', async () => {
      const { fixture } = setup(ConfirmHost);
      const host = fixture.componentInstance;
      button(fixture).click();
      await settleRender(fixture);
      host.resolveFn();
      await settleRender(fixture);
      expect(region(fixture).textContent).toBe('Saved!');

      await vi.advanceTimersByTimeAsync(500);
      button(fixture).click();
      await settleRender(fixture);
      host.rejectFn('Network error');
      await settleRender(fixture);
      expect(region(fixture).textContent).toBe('Failed: Network error');
    });

    it('skips an aria-hidden glyph in the failed template', async () => {
      const { fixture } = setup(GlyphFailedHost);
      button(fixture).click();
      await settleRender(fixture);
      expect(region(fixture).textContent).toBe('Permission denied');
    });

    it('speaks the cngxAsyncClick announcement without result templates', async () => {
      const { fixture } = setup(PlainConfirmHost);
      button(fixture).click();
      await settleRender(fixture);
      expect(region(fixture).textContent).toBe('Action failed');
    });

    it('writes the region once per settle', async () => {
      const { fixture } = setup(PlainConfirmHost);
      const writes: string[] = [];
      const observer = new MutationObserver((records) => {
        for (const r of records) {
          const text = Array.from(r.addedNodes, (n) => n.textContent ?? '').join('');
          if (text) {
            writes.push(text);
          }
        }
      });
      observer.observe(region(fixture), { childList: true });
      button(fixture).click();
      await vi.advanceTimersByTimeAsync(0);
      button(fixture).click();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      await Promise.resolve();
      observer.disconnect();
      expect(writes).toEqual(['Action failed', 'Action failed']);
    });

    it('closes once per success under withCloseOnSuccess', async () => {
      TestBed.configureTestingModule({
        imports: [PlainConfirmHost],
        providers: [providePopoverPanel(withCloseOnSuccess(100))],
      });
      const { fixture, popoverEl } = setup(PlainConfirmHost);
      const host = fixture.componentInstance;
      host.outcome = 'success';
      for (let run = 1; run <= 2; run++) {
        host.popover().show();
        fixture.detectChanges();
        button(fixture).click();
        await settleRender(fixture);
        await vi.advanceTimersByTimeAsync(100);
        expect(popoverEl.hidePopover).toHaveBeenCalledTimes(run);
      }
    });

    it('leaves no close timer and no write when destroyed mid-run', async () => {
      TestBed.configureTestingModule({
        imports: [ConfirmHost],
        providers: [providePopoverPanel(withCloseOnSuccess(100))],
      });
      const { fixture, popoverEl } = setup(ConfirmHost);
      const host = fixture.componentInstance;
      host.popover().show();
      fixture.detectChanges();
      const live = region(fixture);
      button(fixture).click();
      await settleRender(fixture);
      fixture.destroy();
      // Destroying the popover itself may hide it; only later hides count.
      const hidesAtDestroy = (popoverEl.hidePopover as ReturnType<typeof vi.fn>).mock.calls.length;
      host.resolveFn();
      await vi.advanceTimersByTimeAsync(1000);
      expect(vi.getTimerCount()).toBe(0);
      expect(live.textContent).toBe('');
      expect(popoverEl.hidePopover).toHaveBeenCalledTimes(hidesAtDestroy);
    });
  });

  describe('button host contract', () => {
    const button = (fixture: { nativeElement: HTMLElement }): HTMLButtonElement =>
      fixture.nativeElement.querySelector('.cngx-popover-action') as HTMLButtonElement;

    it('renders outline, sm and type="button" on the host, painted by the button sheet', () => {
      const { fixture } = setup(ConfigurableHost);
      const btn = button(fixture);
      expect(btn.tagName).toBe('BUTTON');
      expect(btn.classList).toContain('cngx-button');
      expect(btn.getAttribute('data-variant')).toBe('outline');
      expect(btn.getAttribute('data-size')).toBe('sm');
      expect(btn.getAttribute('type')).toBe('button');
      expect(btn.querySelector('button')).toBeNull();
    });

    it('lands the selector variant and tone="primary" on data-variant / data-tone', () => {
      const { fixture } = setup(ConfigurableHost);
      fixture.componentInstance.variant.set('solid');
      fixture.componentInstance.tone.set('primary');
      fixture.detectChanges();
      expect(button(fixture).getAttribute('data-variant')).toBe('solid');
      expect(button(fixture).getAttribute('data-tone')).toBe('primary');
    });

    it('blocks the run while disabled and references the reason only then', async () => {
      const { fixture } = setup(ConfigurableHost);
      const host = fixture.componentInstance;
      host.reason.set('Fill in the name first');
      fixture.detectChanges();
      expect(button(fixture).hasAttribute('aria-describedby')).toBe(false);

      host.disabled.set(true);
      fixture.detectChanges();
      const btn = button(fixture);
      const reason = btn.querySelector('.cngx-button__reason') as HTMLElement;
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      expect(reason.textContent).toBe('Fill in the name first');
      expect((btn.getAttribute('aria-describedby') ?? '').split(' ')).toContain(reason.id);

      btn.click();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      expect(host.runs).toBe(0);
      expect(host.action().status()).toBe('idle');
    });

    it('forwards [feedbackDuration] to the co-hosted runner', async () => {
      const { fixture } = setup(ConfigurableHost);
      const host = fixture.componentInstance;
      host.feedback.set(700);
      fixture.detectChanges();
      button(fixture).click();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      expect(host.action().status()).toBe('success');

      await vi.advanceTimersByTimeAsync(699);
      expect(host.action().status()).toBe('success');
      await vi.advanceTimersByTimeAsync(1);
      expect(host.action().status()).toBe('idle');
    });

    it('re-exposes the run as a CngxAsyncState view', async () => {
      const { fixture } = setup(ConfigurableHost);
      const host = fixture.componentInstance;
      expect(host.action().state.status()).toBe('idle');
      host.outcome = 'error';
      button(fixture).click();
      await vi.advanceTimersByTimeAsync(0);
      expect(host.action().state.status()).toBe('error');
      expect(host.action().state.error()).toBeInstanceOf(Error);
    });
  });

  describe('announcement overrides', () => {
    const region = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
      fixture.nativeElement.querySelector(
        '.cngx-popover-action + [role="status"][aria-live="polite"]',
      ) as HTMLElement;
    const button = (fixture: { nativeElement: HTMLElement }): HTMLButtonElement =>
      fixture.nativeElement.querySelector('.cngx-popover-action') as HTMLButtonElement;

    async function settleRender(fixture: { detectChanges(): void }): Promise<void> {
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('lets [succeededAnnouncement] / [failedAnnouncement] win over the rendered template', async () => {
      const { fixture } = setup(ConfigurableHost);
      const host = fixture.componentInstance;
      host.succeeded.set('Draft stored');
      host.failed.set('Draft not stored');
      host.feedback.set(100);
      fixture.detectChanges();

      button(fixture).click();
      await settleRender(fixture);
      expect(button(fixture).textContent).toContain('Saved!');
      expect(region(fixture).textContent).toBe('Draft stored');

      await vi.advanceTimersByTimeAsync(100);
      host.outcome = 'error';
      button(fixture).click();
      await settleRender(fixture);
      expect(button(fixture).textContent).toContain('Could not save');
      expect(region(fixture).textContent).toBe('Draft not stored');
    });

    it('keeps the region empty with [autoAnnounce]="false"', async () => {
      const { fixture } = setup(ConfigurableHost);
      fixture.componentInstance.auto.set(false);
      fixture.detectChanges();
      const live = region(fixture);
      expect(live).toBeTruthy();

      button(fixture).click();
      await settleRender(fixture);
      expect(fixture.componentInstance.action().status()).toBe('success');
      expect(live.textContent).toBe('');
    });
  });

  describe('inside a CngxPopoverPanel', () => {
    let testRoot: HTMLElement;

    beforeEach(() => {
      testRoot = document.createElement('div');
      document.body.appendChild(testRoot);
    });

    afterEach(() => {
      testRoot.remove();
    });

    it('returns focus to the trigger after close-on-success through the panel claim', async () => {
      TestBed.configureTestingModule({
        imports: [PanelConfirmHost],
        providers: [providePopoverPanel(withCloseOnSuccess(100))],
      });
      const fixture = TestBed.createComponent(PanelConfirmHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const root = fixture.nativeElement as HTMLElement;
      stubPopoverElement(root.querySelector('cngx-popover-panel') as HTMLElement);
      const trigger = root.querySelector('#trigger') as HTMLButtonElement;
      const popover = fixture.componentInstance.panel().popover;
      const flush = () => {
        fixture.detectChanges();
        TestBed.flushEffects();
      };

      trigger.focus();
      popover.show();
      flush();
      const confirm = root.querySelector('.cngx-popover-action') as HTMLButtonElement;
      confirm.focus();
      confirm.click();
      await vi.advanceTimersByTimeAsync(0);
      flush();
      await vi.advanceTimersByTimeAsync(100);
      flush();

      expect(popover.state()).toBe('closed');
      expect(document.activeElement).toBe(trigger);
      fixture.destroy();
    });
  });
});
