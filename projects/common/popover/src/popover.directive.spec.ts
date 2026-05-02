import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from './popover.directive';

// ── Test helpers ────────────────────────────────────────────────────────

// JSDOM Popover API support varies by version. Always install own-property
// stubs that shadow whatever sits on the prototype — `??=` would skip the
// assignment when JSDOM (or cross-file pollution) provides a real
// `showPopover`/`hidePopover`/`togglePopover`, leaving us with the native
// function instead of a vi.fn() spy and failing every `toHaveBeenCalled`
// assertion. Unconditional `=` is the only assignment that survives both
// "JSDOM has Popover" and "JSDOM does not have Popover" runtimes.
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
  template: `<div cngxPopover #pop="cngxPopover">Content</div>`,
  imports: [CngxPopover],
})
class BasicHost {
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover" [cngxPopoverOpen]="controlledOpen()" placement="top">
      Controlled
    </div>
  `,
  imports: [CngxPopover],
})
class ControlledHost {
  readonly controlledOpen = signal<boolean | undefined>(undefined);
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `<div cngxPopover #pop="cngxPopover" [closeOnEscape]="false">No Escape</div>`,
  imports: [CngxPopover],
})
class NoEscapeHost {
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `<div cngxPopover #pop="cngxPopover" mode="auto">Auto mode</div>`,
  imports: [CngxPopover],
})
class AutoModeHost {
  readonly popover = viewChild.required(CngxPopover);
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

describe('CngxPopover', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start in closed state', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      expect(host.popover().state()).toBe('closed');
    });

    it('should have a unique id', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      expect(host.popover().id()).toMatch(/^cngx-popover-\d+$/);
    });

    it('should set popover attribute to manual by default', () => {
      const { popoverEl } = setup(BasicHost);
      expect(popoverEl.getAttribute('popover')).toBe('manual');
    });

    it('should set aria-hidden to true when closed', () => {
      const { popoverEl } = setup(BasicHost);
      expect(popoverEl.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('show/hide/toggle', () => {
    it('should transition to opening on show()', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      expect(host.popover().state()).toBe('opening');
    });

    it('should call showPopover() on the native element', () => {
      const { fixture, popoverEl } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      expect(popoverEl.showPopover).toHaveBeenCalled();
    });

    it('should hide and transition to closed', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      host.popover().hide();
      expect(host.popover().state()).toBe('closed');
    });

    it('should no-op show() when already open', () => {
      const { fixture, popoverEl } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      host.popover().show(); // second call
      expect(popoverEl.showPopover).toHaveBeenCalledTimes(1);
    });

    it('should toggle between open and closed', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().toggle();
      expect(host.popover().state()).not.toBe('closed');
      host.popover().toggle();
      expect(host.popover().state()).toBe('closed');
    });
  });

  describe('Escape key', () => {
    it('should hide on Escape when closeOnEscape is true', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(host.popover().state()).toBe('closed');
    });

    it('should not hide on Escape when closeOnEscape is false', () => {
      const { fixture } = setup(NoEscapeHost);
      const host = fixture.componentInstance as NoEscapeHost;
      host.popover().show();
      const stateBefore = host.popover().state();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(host.popover().state()).toBe(stateBefore);
    });
  });

  describe('controlled open', () => {
    it('should open when controlledOpen becomes true', () => {
      const { fixture, popoverEl } = setup(ControlledHost);
      const host = fixture.componentInstance as ControlledHost;
      expect(host.popover().state()).toBe('closed');

      host.controlledOpen.set(true);
      TestBed.flushEffects();
      expect(popoverEl.showPopover).toHaveBeenCalled();
    });

    it('should close when controlledOpen becomes false', () => {
      const { fixture } = setup(ControlledHost);
      const host = fixture.componentInstance as ControlledHost;

      host.controlledOpen.set(true);
      TestBed.flushEffects();

      host.controlledOpen.set(false);
      TestBed.flushEffects();
      expect(host.popover().state()).toBe('closed');
    });

    it('should not react when controlledOpen is undefined', () => {
      const { fixture, popoverEl } = setup(ControlledHost);
      const host = fixture.componentInstance as ControlledHost;
      host.controlledOpen.set(undefined);
      TestBed.flushEffects();
      expect(host.popover().state()).toBe('closed');
      expect(popoverEl.showPopover).not.toHaveBeenCalled();
    });
  });

  describe('mode input', () => {
    it('should set popover attribute to auto when mode is auto', () => {
      const { popoverEl } = setup(AutoModeHost);
      expect(popoverEl.getAttribute('popover')).toBe('auto');
    });
  });

  describe('host classes', () => {
    it('should apply cngx-popover--opening during opening', () => {
      const { fixture, popoverEl } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      fixture.detectChanges();
      expect(popoverEl.classList.contains('cngx-popover--opening')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should finalize on destroy if still open', () => {
      const { fixture, popoverEl } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      fixture.destroy();
      expect(popoverEl.hidePopover).toHaveBeenCalled();
    });
  });
});
