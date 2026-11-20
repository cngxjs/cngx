import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxButtonEnd, CngxButtonStart } from '@cngx/common/button';

import { CngxPopoverDismiss } from './popover-dismiss.component';
import { CngxPopoverPanel } from './popover-panel.component';
import { CngxPopoverBody, CngxPopoverFooter } from './popover-panel-slots';
import { CngxPopoverTrigger } from './popover-trigger.directive';
import { CngxPopover } from './popover.directive';

function stubPopoverElement(el: HTMLElement): void {
  const rec = el as unknown as Record<string, unknown>;
  rec['showPopover'] = vi.fn();
  rec['hidePopover'] = vi.fn();
  rec['togglePopover'] = vi.fn();

  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover">
      <button
        cngxPopoverDismiss
        [tone]="tone()"
        [disabled]="disabled()"
        [disabledReason]="reason()"
        #dismiss="cngxPopoverDismiss"
      >
        Cancel
      </button>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverDismiss],
})
class DismissHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly dismiss = viewChild.required(CngxPopoverDismiss);
  readonly tone = signal<'danger' | undefined>(undefined);
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>(undefined);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="panel.popover" id="trigger">Open</button>
    <cngx-popover-panel #panel>
      <p cngxPopoverBody>Discard the draft?</p>
      <div cngxPopoverFooter>
        <button cngxPopoverDismiss>Cancel</button>
      </div>
    </cngx-popover-panel>
  `,
  imports: [
    CngxPopoverTrigger,
    CngxPopoverPanel,
    CngxPopoverBody,
    CngxPopoverFooter,
    CngxPopoverDismiss,
  ],
})
class PanelDismissHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <div cngxPopover>
      <button id="slots" cngxPopoverDismiss>
        <span cngxButtonStart>S</span>Cancel<span cngxButtonEnd>E</span>
      </button>
      <button id="plain" cngxPopoverDismiss>Cancel</button>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverDismiss, CngxButtonStart, CngxButtonEnd],
})
class SlotDismissHost {}

function setup() {
  const fixture = TestBed.createComponent(DismissHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const root = fixture.nativeElement as HTMLElement;
  const popoverEl = root.querySelector('[cngxpopover]') as HTMLElement;
  stubPopoverElement(popoverEl);
  const button = root.querySelector('button[cngxPopoverDismiss]') as HTMLButtonElement;
  const flush = () => {
    fixture.detectChanges();
    TestBed.flushEffects();
  };
  return { fixture, popoverEl, button, flush };
}

describe('CngxPopoverDismiss', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hides the composing popover on click', () => {
    const { fixture, popoverEl, button, flush } = setup();
    fixture.componentInstance.popover().show();
    flush();

    expect(button.textContent).toContain('Cancel');
    button.click();
    flush();

    expect(popoverEl.hidePopover).toHaveBeenCalled();
    expect(fixture.componentInstance.popover().state()).toBe('closed');
  });

  it('carries no run state: no aria-busy, data-pending or data-busy after a click', () => {
    const { fixture, button, flush } = setup();
    fixture.componentInstance.popover().show();
    flush();
    button.click();
    flush();
    expect(button.hasAttribute('aria-busy')).toBe(false);
    expect(button.hasAttribute('data-pending')).toBe(false);
    expect(button.hasAttribute('data-busy')).toBe(false);
  });

  it('renders the button host contract: outline, sm, type="button"', () => {
    const { button } = setup();
    expect(button.classList).toContain('cngx-button');
    expect(button.classList).toContain('cngx-popover-dismiss');
    expect(button.getAttribute('data-variant')).toBe('outline');
    expect(button.getAttribute('data-size')).toBe('sm');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('lands tone on data-tone', () => {
    const { fixture, button, flush } = setup();
    fixture.componentInstance.tone.set('danger');
    flush();
    expect(button.getAttribute('data-tone')).toBe('danger');
  });

  it('keeps the popover open while disabled and describes why', () => {
    const { fixture, popoverEl, button, flush } = setup();
    const host = fixture.componentInstance;
    host.reason.set('Nothing to discard yet');
    flush();
    expect(button.hasAttribute('aria-describedby')).toBe(false);

    host.disabled.set(true);
    host.popover().show();
    flush();

    expect(button.getAttribute('aria-disabled')).toBe('true');
    const describedBy = button.getAttribute('aria-describedby') ?? '';
    const reason = fixture.nativeElement.querySelector('.cngx-button__reason') as HTMLElement;
    expect(reason.textContent).toBe('Nothing to discard yet');
    expect(describedBy.split(' ')).toContain(reason.id);

    button.click();
    flush();
    expect(popoverEl.hidePopover).not.toHaveBeenCalled();
    expect(host.popover().state()).not.toBe('closed');
  });

  describe('slots', () => {
    it('renders start before and end after the label, and flags both on the host', () => {
      const fixture = TestBed.createComponent(SlotDismissHost);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const slots = root.querySelector('#slots') as HTMLButtonElement;
      const label = slots.querySelector('.cngx-button__label') as HTMLElement;
      const start = slots.querySelector('[cngxButtonStart]') as HTMLElement;
      const end = slots.querySelector('[cngxButtonEnd]') as HTMLElement;

      expect(start.parentElement).toBe(slots);
      expect(end.parentElement).toBe(slots);
      expect(label.textContent?.trim()).toBe('Cancel');
      expect(start.nextElementSibling).toBe(label);
      expect(label.nextElementSibling).toBe(end);
      expect(start.classList).toContain('cngx-button__slot--start');
      expect(end.classList).toContain('cngx-button__slot--end');
      expect(slots.hasAttribute('data-start')).toBe(true);
      expect(slots.hasAttribute('data-end')).toBe(true);

      const plain = root.querySelector('#plain') as HTMLButtonElement;
      expect(plain.hasAttribute('data-start')).toBe(false);
      expect(plain.hasAttribute('data-end')).toBe(false);
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

    it('returns focus to the trigger through the panel claim', () => {
      const fixture = TestBed.createComponent(PanelDismissHost);
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
      const dismiss = root.querySelector('button[cngxPopoverDismiss]') as HTMLButtonElement;
      dismiss.focus();
      dismiss.click();
      flush();

      expect(popover.state()).toBe('closed');
      expect(document.activeElement).toBe(trigger);
      fixture.destroy();
    });
  });
});
