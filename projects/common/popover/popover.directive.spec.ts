import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { provideDirection } from '@cngx/core';

import { CngxPopover, __resetFloatingMiddlewareWarnings } from './popover.directive';
import {
  CNGX_FLOATING_FALLBACK,
  FLOATING_PLACEMENT,
  provideFloatingFallback,
} from './floating-fallback';
import {
  CNGX_POPOVER_ARROW_BOUNDS,
  type CngxPopoverArrowBounds,
} from './popover-arrow-bounds';
import type { PopoverPositionTryFallback } from './popover.types';

// Test helpers

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

// Test hosts

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

@Component({
  template: `
    <button type="button">trigger</button>
    <div cngxPopover #pop="cngxPopover" [closeOnOutsideClick]="enabled()">Dismissible</div>
  `,
  imports: [CngxPopover],
})
class OutsideClickHost {
  readonly enabled = signal(true);
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    <div cngxPopover #pop="cngxPopover" [positionTryFallbacks]="fallbacks()">Fallback host</div>
  `,
  imports: [CngxPopover],
})
class FallbackHost {
  readonly fallbacks = signal<readonly PopoverPositionTryFallback[]>([]);
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    <div cngxPopover #outer="cngxPopover">
      Outer
      <div cngxPopover #inner="cngxPopover">Inner</div>
    </div>
    <div cngxPopover #sibling="cngxPopover">Sibling</div>
  `,
  imports: [CngxPopover],
})
class NestedHost {
  readonly outer = viewChild.required('outer', { read: CngxPopover });
  readonly inner = viewChild.required('inner', { read: CngxPopover });
  readonly sibling = viewChild.required('sibling', { read: CngxPopover });
}

@Component({
  template: `
    <div cngxPopover #outer="cngxPopover">
      Outer
      <div cngxPopover #inner="cngxPopover" [exclusive]="false">Inner</div>
    </div>
  `,
  imports: [CngxPopover],
})
class NestedOptOutHost {
  readonly outer = viewChild.required('outer', { read: CngxPopover });
  readonly inner = viewChild.required('inner', { read: CngxPopover });
}

@Component({
  template: `
    <div cngxPopover #a="cngxPopover" [exclusive]="aExclusive()">A</div>
    <div cngxPopover #b="cngxPopover" [exclusive]="bExclusive()">B</div>
  `,
  imports: [CngxPopover],
})
class OverrideHost {
  readonly aExclusive = signal(true);
  readonly bExclusive = signal(true);
  readonly a = viewChild.required('a', { read: CngxPopover });
  readonly b = viewChild.required('b', { read: CngxPopover });
}

function setup<T>(hostType: new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
  stubPopoverElement(popoverEl);
  return { fixture, popoverEl };
}

// Tests

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

  describe('closeOnOutsideClick', () => {
    function outsideClickSetup() {
      const { fixture, popoverEl } = setup(OutsideClickHost);
      const host = fixture.componentInstance as OutsideClickHost;
      const trigger = fixture.nativeElement.querySelector('button') as HTMLElement;
      // The trigger directive wires this in real use; set it directly here so
      // the anchor-exclusion path is exercised without a CngxPopoverTrigger.
      host.popover().anchorElement.set(trigger);
      return { fixture, host, popoverEl, trigger };
    }

    it('hides on pointerdown outside both popover and anchor when enabled', () => {
      const { fixture, host } = outsideClickSetup();
      host.popover().show();
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.popover().state()).toBe('closed');
    });

    it('stays open on pointerdown inside the popover', () => {
      const { fixture, host, popoverEl } = outsideClickSetup();
      host.popover().show();
      popoverEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.popover().state()).not.toBe('closed');
    });

    it('stays open on pointerdown on the anchor (trigger toggles instead)', () => {
      const { fixture, host, trigger } = outsideClickSetup();
      host.popover().show();
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.popover().state()).not.toBe('closed');
    });

    it('does not hide on outside pointerdown when disabled (default)', () => {
      const { fixture, host } = outsideClickSetup();
      host.enabled.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      host.popover().show();
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.popover().state()).not.toBe('closed');
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

  describe('positionTryFallbacks', () => {
    it('writes no position-try-fallbacks style for an empty array', () => {
      const { popoverEl } = setup(FallbackHost);
      expect(popoverEl.style.getPropertyValue('position-try-fallbacks')).toBe('');
    });

    it('writes a single try-tactic value verbatim', () => {
      const fixture = TestBed.createComponent(FallbackHost);
      fixture.componentInstance.fallbacks.set(['flip-inline']);
      fixture.detectChanges();
      TestBed.flushEffects();
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      expect(popoverEl.style.getPropertyValue('position-try-fallbacks')).toBe('flip-inline');
    });

    it('comma-joins multiple try-tactic values in declaration order', () => {
      const fixture = TestBed.createComponent(FallbackHost);
      fixture.componentInstance.fallbacks.set([
        'flip-block',
        'flip-inline',
        'flip-block flip-inline',
      ]);
      fixture.detectChanges();
      TestBed.flushEffects();
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      expect(popoverEl.style.getPropertyValue('position-try-fallbacks')).toBe(
        'flip-block, flip-inline, flip-block flip-inline',
      );
    });

    it('removes the property when the consumer clears a previously-set list', () => {
      const fixture = TestBed.createComponent(FallbackHost);
      fixture.componentInstance.fallbacks.set(['flip-inline']);
      fixture.detectChanges();
      TestBed.flushEffects();
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      expect(popoverEl.style.getPropertyValue('position-try-fallbacks')).toBe('flip-inline');

      fixture.componentInstance.fallbacks.set([]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(popoverEl.style.getPropertyValue('position-try-fallbacks')).toBe('');
    });
  });

  describe('floating fallback middleware warning', () => {
    it('warns once when provideFloatingFallback ships without middleware', () => {
      __resetFloatingMiddlewareWarnings(document);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0, placement: 'bottom' });
      try {
        TestBed.configureTestingModule({
          imports: [BasicHost],
          providers: [provideFloatingFallback(computePosition)],
        });
        const { fixture, popoverEl } = setup(BasicHost);
        const host = fixture.componentInstance as BasicHost;
        host.popover().anchorElement.set(popoverEl);
        host.popover().show();
        const middlewareWarn = warnSpy.mock.calls.find((call) =>
          String(call[0]).includes('provideFloatingFallback'),
        );
        expect(middlewareWarn).toBeDefined();
        expect(middlewareWarn![0]).toContain('flip()');
        expect(middlewareWarn![0]).toContain('shift()');
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not warn when middleware is provided on registration', () => {
      __resetFloatingMiddlewareWarnings(document);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0, placement: 'bottom' });
      const fakeFlip = { name: 'flip' };
      const fakeShift = { name: 'shift' };
      try {
        TestBed.configureTestingModule({
          imports: [BasicHost],
          providers: [provideFloatingFallback(computePosition, [fakeFlip, fakeShift])],
        });
        const { fixture, popoverEl } = setup(BasicHost);
        const host = fixture.componentInstance as BasicHost;
        host.popover().anchorElement.set(popoverEl);
        host.popover().show();
        const middlewareWarn = warnSpy.mock.calls.find((call) =>
          String(call[0]).includes('provideFloatingFallback'),
        );
        expect(middlewareWarn).toBeUndefined();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not re-warn for the same Document on subsequent shows', () => {
      __resetFloatingMiddlewareWarnings(document);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0, placement: 'bottom' });
      try {
        TestBed.configureTestingModule({
          imports: [BasicHost],
          providers: [provideFloatingFallback(computePosition)],
        });
        const first = setup(BasicHost);
        (first.fixture.componentInstance as BasicHost).popover().anchorElement.set(first.popoverEl);
        (first.fixture.componentInstance as BasicHost).popover().show();

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [BasicHost],
          providers: [provideFloatingFallback(computePosition)],
        });
        const second = setup(BasicHost);
        (second.fixture.componentInstance as BasicHost)
          .popover()
          .anchorElement.set(second.popoverEl);
        (second.fixture.componentInstance as BasicHost).popover().show();

        const middlewareWarns = warnSpy.mock.calls.filter((call) =>
          String(call[0]).includes('provideFloatingFallback'),
        );
        expect(middlewareWarns.length).toBe(1);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('compiles against the typed CNGX_FLOATING_FALLBACK token shape', () => {
      expect(CNGX_FLOATING_FALLBACK).toBeDefined();
    });

    it('honours placementOverride on the floating-ui fallback path', () => {
      __resetFloatingMiddlewareWarnings(document);
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0, placement: 'right-start' });
      TestBed.configureTestingModule({
        imports: [BasicHost],
        providers: [
          provideFloatingFallback(computePosition, [{ name: 'flip' }, { name: 'shift' }]),
        ],
      });
      const { fixture, popoverEl } = setup(BasicHost);
      const popover = (fixture.componentInstance as BasicHost).popover();
      popover.anchorElement.set(popoverEl);
      // The override must reach the Floating-UI path, not just the CSS-Anchor
      // path: a submenu using the fallback would otherwise open at the default
      // placement="bottom" instead of the flanking right-start.
      popover.placementOverride.set('right-start');
      popover.show();

      expect(computePosition).toHaveBeenCalled();
      const opts = computePosition.mock.calls[0][2] as { placement: string };
      expect(opts.placement).toBe(FLOATING_PLACEMENT['right-start']);
    });
  });

  describe('arrow bounds contract', () => {
    it('runs show() without reading --cngx-popover-panel-* via getComputedStyle', async () => {
      // The pre-inversion code read the panel's border-radius from the
      // directive side via getComputedStyle inside the show() rAF
      // callback. After the bounds-contract inversion the directive must
      // not reach into the panel's CSS custom properties — the panel
      // provides them through CNGX_POPOVER_ARROW_BOUNDS instead.
      const propertySpy = vi.fn().mockReturnValue('');
      vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
        transitionDuration: '0s',
        getPropertyValue: propertySpy,
      } as unknown as CSSStyleDeclaration);

      const fakeBounds: CngxPopoverArrowBounds = { borderRadius: 16 };
      TestBed.configureTestingModule({
        imports: [BasicHost],
        providers: [{ provide: CNGX_POPOVER_ARROW_BOUNDS, useValue: fakeBounds }],
      });
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      const rec = popoverEl as unknown as Record<string, unknown>;
      rec['showPopover'] = vi.fn();
      rec['hidePopover'] = vi.fn();
      rec['togglePopover'] = vi.fn();

      const host = fixture.componentInstance as BasicHost;
      host.popover().show();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const panelPrefixCalls = propertySpy.mock.calls.filter((call) =>
        String(call[0]).startsWith('--cngx-popover-panel-'),
      );
      expect(panelPrefixCalls).toEqual([]);
    });

    it('show() runs without throwing when CNGX_POPOVER_ARROW_BOUNDS is absent', async () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      expect(() => host.popover().show()).not.toThrow();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      expect(host.popover().state()).toBe('open');
    });
  });

  describe('exclusive eviction', () => {
    function nestedSetup<T>(hostType: new () => T) {
      const fixture = TestBed.createComponent(hostType);
      fixture.detectChanges();
      TestBed.flushEffects();
      const els = fixture.nativeElement.querySelectorAll('[cngxpopover]');
      for (const el of els) {
        stubPopoverElement(el as HTMLElement);
      }
      return { fixture, host: fixture.componentInstance as T };
    }

    it('opening a popover nested inside another leaves the outer open', () => {
      const { host } = nestedSetup(NestedHost);
      host.outer().show();
      host.inner().show();
      expect(host.outer().state()).not.toBe('closed');
      expect(host.inner().state()).not.toBe('closed');
    });

    it('two sibling popovers still evict each other', () => {
      const { host } = nestedSetup(NestedHost);
      host.outer().show();
      host.sibling().show();
      expect(host.outer().state()).toBe('closed');
      expect(host.sibling().state()).not.toBe('closed');
    });

    it('a nested popover with an explicit [exclusive]="false" behaves identically', () => {
      const { host } = nestedSetup(NestedOptOutHost);
      host.outer().show();
      host.inner().show();
      expect(host.outer().state()).not.toBe('closed');
      expect(host.inner().state()).not.toBe('closed');
    });

    it('hiding an ancestor cascades to its open descendant', () => {
      const { host } = nestedSetup(NestedHost);
      host.outer().show();
      host.inner().show();
      host.outer().hide();
      expect(host.outer().state()).toBe('closed');
      expect(host.inner().state()).toBe('closed');
    });

    it('Escape after an ancestor close finds no stranded descendant', () => {
      const { fixture, host } = nestedSetup(NestedHost);
      host.outer().show();
      host.inner().show();
      host.outer().hide();
      // A stranded descendant would consume this Escape as the last-opened
      // entry; a clean registry leaves the sibling untouched.
      host.sibling().show();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(host.inner().state()).toBe('closed');
      expect(host.sibling().state()).toBe('closed');
    });

    it('exclusiveOverride(false) opens non-exclusively even when [exclusive] is true', () => {
      const { host } = nestedSetup(OverrideHost);
      host.b().exclusiveOverride.set(false);
      host.a().show();
      host.b().show();
      expect(host.a().state()).not.toBe('closed');
      expect(host.b().state()).not.toBe('closed');
    });

    it('exclusiveOverride(true) forces eviction even when [exclusive] is false', () => {
      const { fixture, host } = nestedSetup(OverrideHost);
      host.bExclusive.set(false);
      fixture.detectChanges();
      host.b().exclusiveOverride.set(true);
      host.a().show();
      host.b().show();
      expect(host.a().state()).toBe('closed');
      expect(host.b().state()).not.toBe('closed');
    });

    it('a null exclusiveOverride defers to the [exclusive] input', () => {
      const { fixture, host } = nestedSetup(OverrideHost);
      host.bExclusive.set(false);
      fixture.detectChanges();
      host.a().show();
      host.b().show();
      expect(host.a().state()).not.toBe('closed');
      expect(host.b().state()).not.toBe('closed');
    });
  });

  describe('public arrowOffset and resolvedEdge mirrors', () => {
    it('exposes arrowOffset as a readonly Signal', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      const popover = host.popover();
      expect(popover.arrowOffset).toBeDefined();
      expect(typeof popover.arrowOffset).toBe('function');
      expect(popover.arrowOffset()).toBeNull();
    });

    it('exposes resolvedEdge defaulting to the requested placement before the first geometry read', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      const popover = host.popover();
      expect(popover.resolvedEdge()).toBe('bottom');
    });

    it('placementOverride wins over the [placement] input, and null defers back', () => {
      const { fixture } = setup(BasicHost);
      const host = fixture.componentInstance as BasicHost;
      const popover = host.popover();
      expect(popover.resolvedEdge()).toBe('bottom');

      popover.placementOverride.set('right-start');
      fixture.detectChanges();
      expect(popover.resolvedEdge()).toBe('right');

      popover.placementOverride.set(null);
      fixture.detectChanges();
      expect(popover.resolvedEdge()).toBe('bottom');
    });
  });

  describe('dir=rtl placement mirror', () => {
    it('mirrors the inline-axis arrow edge under rtl (right-start -> left)', () => {
      TestBed.configureTestingModule({
        imports: [BasicHost],
        providers: [provideDirection('rtl')],
      });
      const { fixture } = setup(BasicHost);
      const popover = (fixture.componentInstance as BasicHost).popover();

      popover.placementOverride.set('right-start');
      fixture.detectChanges();
      // Under rtl `right-start` resolves to `left-start`; the arrow edge (the
      // token-split consumer) follows the mirrored source and points left.
      expect(popover.resolvedEdge()).toBe('left');
    });

    it('leaves the block edge invariant under rtl (top-start stays top)', () => {
      TestBed.configureTestingModule({
        imports: [BasicHost],
        providers: [provideDirection('rtl')],
      });
      const { fixture } = setup(BasicHost);
      const popover = (fixture.componentInstance as BasicHost).popover();

      popover.placementOverride.set('top-start');
      fixture.detectChanges();
      expect(popover.resolvedEdge()).toBe('top');
    });

    it('mirrors the FLOATING_PLACEMENT token under rtl (right-start -> left-start)', () => {
      __resetFloatingMiddlewareWarnings(document);
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0, placement: 'left-start' });
      TestBed.configureTestingModule({
        imports: [BasicHost],
        providers: [
          provideDirection('rtl'),
          provideFloatingFallback(computePosition, [{ name: 'flip' }, { name: 'shift' }]),
        ],
      });
      const { fixture, popoverEl } = setup(BasicHost);
      const popover = (fixture.componentInstance as BasicHost).popover();
      popover.anchorElement.set(popoverEl);

      popover.placementOverride.set('right-start');
      popover.show();

      expect(computePosition).toHaveBeenCalled();
      const opts = computePosition.mock.calls[0][2] as { placement: string };
      // The mirror is applied at the effectivePlacement source, so the
      // floating path sees the mirrored key - the CSS-anchor and floating
      // paths cannot diverge under rtl.
      expect(opts.placement).toBe(FLOATING_PLACEMENT['left-start']);
    });

    it('does NOT pre-flip vertical-placement alignment on the floating path (top-start stays top-start)', () => {
      // @floating-ui/dom flips the alignment of vertical placements under rtl
      // itself; pre-flipping to top-end here would double-flip back to the ltr
      // position. The floating path mirrors the side only and defers alignment.
      __resetFloatingMiddlewareWarnings(document);
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0, placement: 'top-start' });
      TestBed.configureTestingModule({
        imports: [BasicHost],
        providers: [
          provideDirection('rtl'),
          provideFloatingFallback(computePosition, [{ name: 'flip' }, { name: 'shift' }]),
        ],
      });
      const { fixture, popoverEl } = setup(BasicHost);
      const popover = (fixture.componentInstance as BasicHost).popover();
      popover.anchorElement.set(popoverEl);

      popover.placementOverride.set('top-start');
      popover.show();

      const opts = computePosition.mock.calls[0][2] as { placement: string };
      expect(opts.placement).toBe(FLOATING_PLACEMENT['top-start']);
    });

    it('is the identity under ltr (right-start stays right-start on the floating path)', () => {
      __resetFloatingMiddlewareWarnings(document);
      const computePosition = vi.fn().mockResolvedValue({ x: 0, y: 0, placement: 'right-start' });
      TestBed.configureTestingModule({
        imports: [BasicHost],
        providers: [
          provideDirection('ltr'),
          provideFloatingFallback(computePosition, [{ name: 'flip' }, { name: 'shift' }]),
        ],
      });
      const { fixture, popoverEl } = setup(BasicHost);
      const popover = (fixture.componentInstance as BasicHost).popover();
      popover.anchorElement.set(popoverEl);

      popover.placementOverride.set('right-start');
      popover.show();

      const opts = computePosition.mock.calls[0][2] as { placement: string };
      expect(opts.placement).toBe(FLOATING_PLACEMENT['right-start']);
    });
  });
});
