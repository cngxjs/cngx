import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxFailed, CngxPending, CngxSucceeded } from '@cngx/common/interactive';

import { CngxPopoverAction } from './popover-action.component';
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
