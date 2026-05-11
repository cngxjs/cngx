import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxTooltip } from './tooltip.directive';

// ── Test helpers ────────────────────────────────────────────────────────

/** Stubs matchMedia for CngxReducedMotion hostDirective. */
function installMatchMediaStub(): void {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  }
}

/** Stubs the Popover API on dynamically created elements. */
function installPopoverStubs(): void {
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(
    (tag: string, options?: ElementCreationOptions) => {
      const el = origCreate(tag, options);
      const rec = el as unknown as Record<string, unknown>;
      rec['showPopover'] = vi.fn();
      rec['hidePopover'] = vi.fn();
      return el;
    },
  );
  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `<button cngxTooltip="Save shortcut" id="trigger">Save</button>`,
  imports: [CngxTooltip],
})
class BasicTooltipHost {
  readonly tooltip = viewChild.required(CngxTooltip);
}

@Component({
  template: `
    <button
      [cngxTooltip]="text()"
      tooltipPlacement="bottom"
      [tooltipDelay]="0"
      [closeDelay]="0"
      id="trigger"
    >
      Dynamic
    </button>
  `,
  imports: [CngxTooltip],
})
class ConfiguredTooltipHost {
  readonly text = signal('Initial text');
  readonly tooltip = viewChild.required(CngxTooltip);
}

@Component({
  template: `<button cngxTooltip="Disabled tip" [enabled]="enabled()" id="trigger">Btn</button>`,
  imports: [CngxTooltip],
})
class DisabledTooltipHost {
  readonly enabled = signal(true);
  readonly tooltip = viewChild.required(CngxTooltip);
}

function setup<T>(hostType: new () => T) {
  installMatchMediaStub();
  installPopoverStubs();
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
  return { fixture, triggerEl };
}

function getTooltipEl(triggerEl: HTMLElement): HTMLElement | null {
  return triggerEl.parentElement?.querySelector('[role="tooltip"]') ?? null;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('tooltip element creation', () => {
    it('should create a tooltip element as sibling', () => {
      const { triggerEl } = setup(BasicTooltipHost);
      const tooltipEl = getTooltipEl(triggerEl);
      expect(tooltipEl).not.toBeNull();
      expect(tooltipEl!.getAttribute('role')).toBe('tooltip');
      expect(tooltipEl!.getAttribute('popover')).toBe('manual');
    });

    it('should set the text content', () => {
      const { triggerEl } = setup(BasicTooltipHost);
      const tooltipEl = getTooltipEl(triggerEl);
      expect(tooltipEl!.textContent).toBe('Save shortcut');
    });

    it('should set aria-hidden to true initially', () => {
      const { triggerEl } = setup(BasicTooltipHost);
      const tooltipEl = getTooltipEl(triggerEl);
      expect(tooltipEl!.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('ARIA on trigger', () => {
    it('should set aria-describedby to the tooltip id', () => {
      const { triggerEl } = setup(BasicTooltipHost);
      const tooltipEl = getTooltipEl(triggerEl);
      expect(triggerEl.getAttribute('aria-describedby')).toBe(tooltipEl!.id);
    });

    it('should clear aria-describedby when disabled', () => {
      const { fixture, triggerEl } = setup(DisabledTooltipHost);
      const host = fixture.componentInstance as DisabledTooltipHost;
      expect(triggerEl.getAttribute('aria-describedby')).not.toBeNull();

      host.enabled.set(false);
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('hover interaction', () => {
    it('should show tooltip after openDelay on mouseenter', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;

      triggerEl.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // With delay=0, should show immediately
      expect(host.tooltip().state()).not.toBe('closed');
    });

    it('should hide tooltip on mouseleave', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;

      triggerEl.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      triggerEl.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();

      expect(host.tooltip().state()).toBe('closed');
    });

    it('should respect openDelay', () => {
      const { fixture, triggerEl } = setup(BasicTooltipHost);
      const host = fixture.componentInstance as BasicTooltipHost;

      triggerEl.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Default delay is 300ms — tooltip should still be closed
      expect(host.tooltip().state()).toBe('closed');

      vi.advanceTimersByTime(300);
      expect(host.tooltip().state()).not.toBe('closed');
    });
  });

  describe('focus interaction', () => {
    it('should show after focus debounce', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;

      triggerEl.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();

      // Focus has a 50ms debounce to prevent SR storm during rapid Tab
      expect(host.tooltip().state()).toBe('closed');
      vi.advanceTimersByTime(50);
      expect(host.tooltip().state()).not.toBe('closed');
    });

    it('should hide on blur', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;

      triggerEl.dispatchEvent(new FocusEvent('focus'));
      vi.advanceTimersByTime(50);
      fixture.detectChanges();

      triggerEl.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();

      expect(host.tooltip().state()).toBe('closed');
    });

    it('should cancel pending show on rapid Tab (blur before debounce)', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;

      triggerEl.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      // Blur before the 50ms debounce fires
      triggerEl.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      vi.advanceTimersByTime(50);

      expect(host.tooltip().state()).toBe('closed');
    });
  });

  describe('Escape key', () => {
    it('should hide on Escape', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;

      triggerEl.dispatchEvent(new FocusEvent('focus'));
      vi.advanceTimersByTime(50);
      fixture.detectChanges();

      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(host.tooltip().state()).toBe('closed');
    });

    it('should stop Escape propagation when tooltip is open', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);

      triggerEl.dispatchEvent(new FocusEvent('focus'));
      vi.advanceTimersByTime(50);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      triggerEl.dispatchEvent(event);
      fixture.detectChanges();

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should not stop Escape propagation when tooltip is already closed', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      triggerEl.dispatchEvent(event);
      fixture.detectChanges();

      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('dynamic text', () => {
    it('should update tooltip text when input changes', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;
      const tooltipEl = getTooltipEl(triggerEl);

      host.text.set('Updated text');
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(tooltipEl!.textContent).toBe('Updated text');
    });
  });

  describe('enabled/disabled', () => {
    it('should not show when disabled', () => {
      const { fixture, triggerEl } = setup(DisabledTooltipHost);
      const host = fixture.componentInstance as DisabledTooltipHost;

      host.enabled.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();

      triggerEl.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();

      expect(host.tooltip().state()).toBe('closed');
    });

    it('should close if disabled while open', () => {
      const { fixture } = setup(DisabledTooltipHost);
      const host = fixture.componentInstance as DisabledTooltipHost;

      host.tooltip().show();
      expect(host.tooltip().state()).not.toBe('closed');

      host.enabled.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(host.tooltip().state()).toBe('closed');
    });
  });

  describe('cleanup', () => {
    it('should remove tooltip element on destroy', () => {
      const { fixture, triggerEl } = setup(BasicTooltipHost);
      const tooltipEl = getTooltipEl(triggerEl);
      expect(tooltipEl).not.toBeNull();

      const parent = triggerEl.parentElement!;
      fixture.destroy();

      expect(parent.querySelector('[role="tooltip"]')).toBeNull();
    });
  });
});
