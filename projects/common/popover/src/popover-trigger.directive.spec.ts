import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from './popover.directive';
import { CngxPopoverTrigger } from './popover-trigger.directive';

// ── Test helpers ────────────────────────────────────────────────────────

function stubPopoverElement(el: HTMLElement): void {
  const rec = el as unknown as Record<string, unknown>;
  rec['showPopover'] ??= vi.fn();
  rec['hidePopover'] ??= vi.fn();
  rec['togglePopover'] ??= vi.fn();

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
  });

  describe('anchor registration', () => {
    it('should register the trigger element as anchor on the popover', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      TestBed.flushEffects();
      expect(host.popover().anchorElement()).toBe(triggerEl);
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
