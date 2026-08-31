import { Component, ElementRef, Renderer2, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideDirection } from '@cngx/core';

import { CngxTooltip } from './tooltip.directive';
import {
  type ComputePositionFn,
  FLOATING_PLACEMENT,
  provideFloatingFallback,
} from './floating-fallback';
import type { PopoverPlacement, PopoverPositionTryFallback } from './popover.types';

// Test helpers

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

// Test hosts

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

@Component({
  template: `
    <button cngxTooltip="Fallback tip" [tooltipPositionTryFallbacks]="fallbacks()" id="trigger">
      Btn
    </button>
  `,
  imports: [CngxTooltip],
})
class FallbackTooltipHost {
  readonly fallbacks = signal<readonly PopoverPositionTryFallback[]>([]);
  readonly tooltip = viewChild.required(CngxTooltip);
}

@Component({
  template: `
    <button cngxTooltip="Manual tip" [triggers]="'manual'" [tooltipDelay]="0" [closeDelay]="0"
            id="trigger">Btn</button>
  `,
  imports: [CngxTooltip],
})
class ManualTooltipHost {
  readonly tooltip = viewChild.required(CngxTooltip);
}

@Component({
  template: `
    <button
      cngxTooltip="Directional tip"
      [tooltipPlacement]="placement()"
      [tooltipDelay]="0"
      [closeDelay]="0"
      id="trigger"
    >
      Btn
    </button>
  `,
  imports: [CngxTooltip],
})
class PlacementTooltipHost {
  readonly placement = signal<PopoverPlacement>('right');
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

// Tests

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

    it('removes aria-hidden while open and restores it on close', () => {
      const { fixture, triggerEl } = setup(BasicTooltipHost);
      const host = fixture.componentInstance as BasicTooltipHost;
      const tooltipEl = getTooltipEl(triggerEl)!;

      host.tooltip().show();
      fixture.detectChanges();
      expect(tooltipEl.getAttribute('aria-hidden')).toBeNull();

      host.tooltip().hide();
      fixture.detectChanges();
      expect(tooltipEl.getAttribute('aria-hidden')).toBe('true');
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

      // Default delay is 300ms - tooltip should still be closed
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

  describe('triggers="manual"', () => {
    it('should not open on mouseenter', () => {
      const { fixture, triggerEl } = setup(ManualTooltipHost);
      const host = fixture.componentInstance as ManualTooltipHost;

      triggerEl.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(host.tooltip().state()).toBe('closed');
    });

    it('should not open on focus', () => {
      const { fixture, triggerEl } = setup(ManualTooltipHost);
      const host = fixture.componentInstance as ManualTooltipHost;

      triggerEl.dispatchEvent(new FocusEvent('focus'));
      vi.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(host.tooltip().state()).toBe('closed');
    });

    it('should still open via show() and close via hide()', () => {
      const { fixture } = setup(ManualTooltipHost);
      const host = fixture.componentInstance as ManualTooltipHost;

      host.tooltip().show();
      fixture.detectChanges();
      expect(host.tooltip().state()).not.toBe('closed');

      host.tooltip().hide();
      fixture.detectChanges();
      expect(host.tooltip().state()).toBe('closed');
    });

    it('should still dismiss on Escape when open', () => {
      const { fixture, triggerEl } = setup(ManualTooltipHost);
      const host = fixture.componentInstance as ManualTooltipHost;

      host.tooltip().show();
      fixture.detectChanges();
      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

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

  describe('document-level Escape (WCAG 1.4.13)', () => {
    it('dismisses a hover-opened tooltip when Escape is pressed elsewhere', () => {
      const { fixture, triggerEl } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;

      triggerEl.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(host.tooltip().state()).not.toBe('closed');

      // Hover-opened: keyboard focus (and thus the event target) is NOT the
      // trigger - a host keydown binding would never see this event.
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(host.tooltip().state()).toBe('closed');
    });

    it('detaches the document listener after close', () => {
      const { fixture } = setup(ConfiguredTooltipHost);
      const host = fixture.componentInstance as ConfiguredTooltipHost;
      host.tooltip().show();
      host.tooltip().hide();
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      document.body.dispatchEvent(event);
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('parentless trigger', () => {
    it('appends the tooltip element to body instead of into the trigger', () => {
      installMatchMediaStub();
      installPopoverStubs();
      const orphan = document.createElement('button');
      const rendererStub = {
        createElement: (name: string) => document.createElement(name),
        insertBefore: (parent: Node, el: Node, ref: Node | null) => parent.insertBefore(el, ref),
        appendChild: (parent: Node, el: Node) => parent.appendChild(el),
      } as unknown as Renderer2;
      TestBed.configureTestingModule({
        providers: [
          { provide: ElementRef, useValue: new ElementRef(orphan) },
          { provide: Renderer2, useValue: rendererStub },
        ],
      });

      // The template harness cannot produce a parentless trigger (view nodes
      // always have a render parent), so the branch is exercised by direct
      // construction against the orphan element.
      const tooltip = TestBed.runInInjectionContext(() => new CngxTooltip());
      try {
        expect(tooltip.state()).toBe('closed');
        expect(orphan.querySelector('[role="tooltip"]')).toBeNull();
        const attached = document.body.querySelector(':scope > [role="tooltip"]');
        expect(attached).not.toBeNull();
      } finally {
        document.body.querySelector(':scope > [role="tooltip"]')?.remove();
      }
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

  describe('tooltipPositionTryFallbacks', () => {
    it('writes no position-try-fallbacks style for an empty array', () => {
      const { triggerEl } = setup(FallbackTooltipHost);
      const tooltipEl = getTooltipEl(triggerEl)!;
      expect(tooltipEl.style.getPropertyValue('position-try-fallbacks')).toBe('');
    });

    it('writes a single try-tactic value verbatim', () => {
      installMatchMediaStub();
      installPopoverStubs();
      const fixture = TestBed.createComponent(FallbackTooltipHost);
      fixture.componentInstance.fallbacks.set(['flip-inline']);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const tooltipEl = getTooltipEl(triggerEl)!;
      expect(tooltipEl.style.getPropertyValue('position-try-fallbacks')).toBe('flip-inline');
    });

    it('comma-joins multiple try-tactic values in declaration order', () => {
      installMatchMediaStub();
      installPopoverStubs();
      const fixture = TestBed.createComponent(FallbackTooltipHost);
      fixture.componentInstance.fallbacks.set([
        'flip-block',
        'flip-inline',
        'flip-block flip-inline',
      ]);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const tooltipEl = getTooltipEl(triggerEl)!;
      expect(tooltipEl.style.getPropertyValue('position-try-fallbacks')).toBe(
        'flip-block, flip-inline, flip-block flip-inline',
      );
    });

    it('removes the property when the consumer clears a previously-set list', () => {
      installMatchMediaStub();
      installPopoverStubs();
      const fixture = TestBed.createComponent(FallbackTooltipHost);
      fixture.componentInstance.fallbacks.set(['flip-inline']);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const tooltipEl = getTooltipEl(triggerEl)!;
      expect(tooltipEl.style.getPropertyValue('position-try-fallbacks')).toBe('flip-inline');

      fixture.componentInstance.fallbacks.set([]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(tooltipEl.style.getPropertyValue('position-try-fallbacks')).toBe('');
    });
  });

  describe('shared floating fallback positioner', () => {
    async function flushMicrotasks(): Promise<void> {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }

    // Runs the middleware chain like @floating-ui/dom would, so the
    // cngxOffset middleware is observable through the written coordinates.
    function middlewareRunningComputePosition() {
      return vi.fn<ComputePositionFn>(
        (
          _ref: HTMLElement,
          _fl: HTMLElement,
          opts?: { placement?: string; middleware?: unknown[] },
        ) => {
          let x = 100;
          let y = 100;
          for (const mw of opts?.middleware ?? []) {
            const entry = mw as {
              fn?: (s: { x: number; y: number; placement: string }) => { x?: number; y?: number };
            };
            const result = entry.fn?.({ x, y, placement: opts?.placement ?? 'top' });
            x = result?.x ?? x;
            y = result?.y ?? y;
          }
          return Promise.resolve({ x, y, placement: opts?.placement ?? 'top' });
        },
      );
    }

    function fallbackSetup(computePosition: ReturnType<typeof vi.fn<ComputePositionFn>>) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BasicTooltipHost],
        providers: [provideFloatingFallback(computePosition, [{ name: 'flip' }])],
      });
      const { fixture, triggerEl } = setup(BasicTooltipHost);
      const tooltip = (fixture.componentInstance as BasicTooltipHost).tooltip();
      return { fixture, triggerEl, tooltip };
    }

    it('applies the tooltip offset through middleware on the fallback path', async () => {
      const computePosition = middlewareRunningComputePosition();
      const { triggerEl, tooltip } = fallbackSetup(computePosition);
      tooltip.show();
      await flushMicrotasks();

      const tooltipEl = getTooltipEl(triggerEl)!;
      const opts = computePosition.mock.calls[0][2] as { middleware: { name?: string }[] };
      expect(opts.middleware[0]?.name).toBe('cngxOffset');
      expect(opts.middleware[1]?.name).toBe('flip');
      // default placement top, offset 8 -> y shifted up from the mock's base 100
      expect(tooltipEl.style.top).toBe('92px');
      expect(tooltipEl.style.left).toBe('100px');
      expect(tooltipEl.style.margin).toBe('');
    });

    it('re-runs positioning on scroll while open and stops after hide', () => {
      const computePosition = middlewareRunningComputePosition();
      const { tooltip } = fallbackSetup(computePosition);
      tooltip.show();
      expect(computePosition).toHaveBeenCalledTimes(1);

      document.dispatchEvent(new Event('scroll'));
      expect(computePosition).toHaveBeenCalledTimes(2);

      tooltip.hide();
      document.dispatchEvent(new Event('scroll'));
      expect(computePosition).toHaveBeenCalledTimes(2);
    });

    it('drops the stale write when the tooltip closes before computePosition resolves', async () => {
      let resolvePosition!: (v: { x: number; y: number; placement: string }) => void;
      const computePosition = vi.fn<ComputePositionFn>().mockReturnValue(
        new Promise((resolve) => {
          resolvePosition = resolve as never;
        }),
      );
      const { triggerEl, tooltip } = fallbackSetup(computePosition);
      tooltip.show();
      tooltip.hide();

      resolvePosition({ x: 42, y: 42, placement: 'top' });
      await flushMicrotasks();

      const tooltipEl = getTooltipEl(triggerEl)!;
      expect(tooltipEl.style.left).not.toBe('42px');
      expect(tooltipEl.style.top).not.toBe('42px');
    });
  });

  describe('dir=rtl placement mirror', () => {
    // jsdom reports no CSS Anchor support, so the `position-area` write is
    // gated off; the floating fallback path is the observable surface. Both
    // the anchor effect and the floating path read the same
    // `directionalPlacement` computed, so asserting the floating key proves
    // the mirror the anchor path also receives.
    function showWithFallback(
      placement: PopoverPlacement,
      direction: 'ltr' | 'rtl',
    ): { placement: string } {
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0 });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [PlacementTooltipHost],
        providers: [
          provideDirection(direction),
          provideFloatingFallback(computePosition),
        ],
      });
      const { fixture } = setup(PlacementTooltipHost);
      fixture.componentInstance.placement.set(placement);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.componentInstance.tooltip().show();
      expect(computePosition).toHaveBeenCalled();
      return computePosition.mock.calls[0][2] as { placement: string };
    }

    it('mirrors a side placement to the inline-start side under rtl (right -> left)', () => {
      expect(showWithFallback('right', 'rtl').placement).toBe(FLOATING_PLACEMENT['left']);
    });

    it('mirrors an edge-aligned side placement under rtl (right-start -> left-start)', () => {
      expect(showWithFallback('right-start', 'rtl').placement).toBe(
        FLOATING_PLACEMENT['left-start'],
      );
    });

    it('leaves the top block edge unchanged under rtl', () => {
      expect(showWithFallback('top', 'rtl').placement).toBe(FLOATING_PLACEMENT['top']);
    });

    it('does NOT pre-flip vertical-placement alignment under rtl (top-start stays top-start)', () => {
      // Guards the double-flip regression: @floating-ui/dom flips the alignment
      // of vertical placements itself under rtl, so the tooltip must mirror the
      // side only and leave top-start alignment to floating-ui.
      expect(showWithFallback('top-start', 'rtl').placement).toBe(FLOATING_PLACEMENT['top-start']);
    });

    it('side-mirrors an edge-aligned side placement under rtl (left-end -> right-end)', () => {
      expect(showWithFallback('left-end', 'rtl').placement).toBe(FLOATING_PLACEMENT['right-end']);
    });

    it('leaves the bottom block edge unchanged under rtl', () => {
      expect(showWithFallback('bottom', 'rtl').placement).toBe(FLOATING_PLACEMENT['bottom']);
    });

    it('is the identity under ltr (right stays right)', () => {
      expect(showWithFallback('right', 'ltr').placement).toBe(FLOATING_PLACEMENT['right']);
    });
  });
});
