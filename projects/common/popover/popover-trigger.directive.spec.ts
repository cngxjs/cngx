import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from './popover.directive';
import { CngxPopoverTrigger } from './popover-trigger.directive';

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
    <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class BasicTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" haspopup="menu" id="trigger">Menu</button>
    <div cngxPopover #pop="cngxPopover">Menu items</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class MenuTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" haspopup="none" id="trigger">Disclose</button>
    <div cngxPopover #pop="cngxPopover">Link list</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class NoneHaspopupHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" [restoreFocus]="true" id="trigger">Open</button>
    <div cngxPopover #pop="cngxPopover">Restorable</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class RestoreFocusHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    @if (showTrigger()) {
      <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    }
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class ConditionalTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly showTrigger = signal(true);
}

function setup<T>(hostType: new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
  const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
  stubPopoverElement(popoverEl);
  return { fixture, triggerEl, popoverEl };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxPopoverTrigger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ARIA attributes', () => {
    it('should set aria-expanded to false when popover is closed', () => {
      const { triggerEl } = setup(BasicTriggerHost);
      expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-expanded to true when popover is visible', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      host.popover().show();
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-expanded')).toBe('true');
    });

    it('should set aria-controls to the popover id', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      expect(triggerEl.getAttribute('aria-controls')).toBe(host.popover().id());
    });

    it('should set aria-haspopup to true by default', () => {
      const { triggerEl } = setup(BasicTriggerHost);
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('true');
    });

    it('should set aria-haspopup to menu when configured', () => {
      const { triggerEl } = setup(MenuTriggerHost);
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('should pick up the popover haspopup signal as default', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      host.popover().setHaspopup('dialog');
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('should let consumer haspopup override the popover hint', () => {
      const { fixture, triggerEl } = setup(MenuTriggerHost);
      const host = fixture.componentInstance as MenuTriggerHost;
      host.popover().setHaspopup('dialog');
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('should emit no aria-haspopup when configured with none', () => {
      const { triggerEl } = setup(NoneHaspopupHost);
      expect(triggerEl.hasAttribute('aria-haspopup')).toBe(false);
    });

    it('should let none cancel the popover haspopup hint', () => {
      const { fixture, triggerEl } = setup(NoneHaspopupHost);
      const host = fixture.componentInstance as NoneHaspopupHost;
      host.popover().setHaspopup('dialog');
      fixture.detectChanges();
      expect(triggerEl.hasAttribute('aria-haspopup')).toBe(false);
    });
  });

  describe('focus restoration', () => {
    let testRoot: HTMLElement;

    beforeEach(() => {
      testRoot = document.createElement('div');
      document.body.appendChild(testRoot);
    });

    afterEach(() => {
      testRoot.remove();
    });

    it('should not move focus on close by default', () => {
      const fixture = TestBed.createComponent(BasicTriggerHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      const externalBtn = document.createElement('button');
      testRoot.appendChild(externalBtn);
      externalBtn.focus();
      const host = fixture.componentInstance as BasicTriggerHost;
      host.popover().show();
      fixture.detectChanges();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).not.toBe(triggerEl);
      fixture.destroy();
    });

    it('should restore focus on close when restoreFocus is true', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      triggerEl.focus();
      const host = fixture.componentInstance as RestoreFocusHost;
      host.popover().show();
      fixture.detectChanges();
      const sneaky = document.createElement('button');
      testRoot.appendChild(sneaky);
      sneaky.focus();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).toBe(triggerEl);
      fixture.destroy();
    });

    it('should restore to the pre-show focus target even when panel content grabs focus before the capture effect runs', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      triggerEl.focus();
      const host = fixture.componentInstance as RestoreFocusHost;
      host.popover().show();
      // Simulate content autofocus landing between show() and the
      // trigger's post-CD capture effect - the effect must adopt the
      // popover's pre-show snapshot, not document.activeElement.
      const autofocused = document.createElement('button');
      testRoot.appendChild(autofocused);
      autofocused.focus();
      fixture.detectChanges();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).toBe(triggerEl);
      fixture.destroy();
    });
  });

  describe('anchor registration', () => {
    it('should register the trigger element as anchor on the popover', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      TestBed.flushEffects();
      expect(host.popover().anchorElement()).toBe(triggerEl);
    });

    it('should clear the anchor on trigger destroy', () => {
      const { fixture, triggerEl } = setup(ConditionalTriggerHost);
      const host = fixture.componentInstance as ConditionalTriggerHost;
      TestBed.flushEffects();
      expect(host.popover().anchorElement()).toBe(triggerEl);

      host.showTrigger.set(false);
      fixture.detectChanges();
      expect(host.popover().anchorElement()).toBeNull();
    });

    it('should not clear an anchor a later registration replaced', () => {
      const { fixture } = setup(ConditionalTriggerHost);
      const host = fixture.componentInstance as ConditionalTriggerHost;
      TestBed.flushEffects();

      const replacement = document.createElement('button');
      host.popover().setAnchorElement(replacement);
      host.showTrigger.set(false);
      fixture.detectChanges();
      expect(host.popover().anchorElement()).toBe(replacement);
    });
  });

  describe('no event handling', () => {
    it('should not toggle popover on click (consumer responsibility)', () => {
      const { fixture, triggerEl, popoverEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      triggerEl.click();
      fixture.detectChanges();
      expect(host.popover().state()).toBe('closed');
      expect(popoverEl.showPopover).not.toHaveBeenCalled();
    });
  });
});
