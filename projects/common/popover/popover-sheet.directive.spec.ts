import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, effect, Injector, signal, untracked, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxSwipeDismiss } from '@cngx/common/interactive';
import { WINDOW } from '@cngx/core/tokens';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from './popover.directive';
import type { CngxPopoverPresentationRequest } from './popover-sheet.directive';
import { CngxPopoverSheet } from './popover-sheet.directive';
import type { CngxPopoverSheetCloseReason } from './popover-sheet-host';
import {
  CngxPopoverSheetHandle,
  CngxPopoverSheetHeader,
  CngxPopoverSheetInitialFocus,
  CngxPopoverSheetTitle,
} from './popover-sheet-parts';
import type { PopoverMode } from './popover.types';

const CLEAR_DELAY_MS = 16;

// The sheet reads its breakpoint and runs its settling check through the
// WINDOW token, so a fake window drives both without touching jsdom globals.
let breakpoint = '0';
let resizeCallback: ((entries: unknown[]) => void) | null = null;
let rafQueue: FrameRequestCallback[] = [];

const fakeWindow: Record<string, unknown> = {
  ResizeObserver: class {
    constructor(cb: (entries: unknown[]) => void) {
      resizeCallback = cb;
    }
    observe(): void {
      /* driven by resize() */
    }
    disconnect(): void {
      /* no-op */
    }
  },
  getComputedStyle: () => ({
    getPropertyValue: (name: string) =>
      name === '--cngx-popover-sheet-breakpoint' ? breakpoint : '',
  }),
  requestAnimationFrame: (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  },
  cancelAnimationFrame: () => {
    rafQueue = [];
  },
};

function resize(): void {
  resizeCallback?.([{}]);
  TestBed.flushEffects();
}

function runFrame(): void {
  const queue = rafQueue;
  rafQueue = [];
  for (const cb of queue) {
    cb(0);
  }
}

function stubTransition(duration: string): void {
  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: duration,
    transitionProperty: 'opacity',
    transitionDelay: '0s',
  } as unknown as CSSStyleDeclaration);
}

@Component({
  template: `
    <button type="button" class="opener" (click)="handleOpenerClick()">Open</button>
    <input type="checkbox" class="page-check" aria-label="Page check" />
    <div role="status" class="page-status"></div>
    <div class="pre-inert" inert></div>
    <div
      cngxPopover
      #pop="cngxPopover"
      [mode]="mode()"
      [closeOnEscape]="closeOnEscape()"
      [positionTryFallbacks]="['flip-block']"
      [cngxPopoverSheet]="request()"
      #sheet="cngxPopoverSheet"
      [autoPresentation]="autoPresentation()"
      [labelledBy]="labelledBy()"
      [restoreFocus]="restoreFocus()"
      [restoreTarget]="restoreTarget()"
      [closeOnRequest]="closeOnRequest()"
      (closeRequested)="reasons.push($event)"
      (closing)="handleClosing()"
    >
      <header class="header" cngxPopoverSheetHeader cngxSwipeDismiss="down">
        <span cngxPopoverSheetHandle></span>
        @if (withTitle()) {
          <h2 class="title" cngxPopoverSheetTitle>Cities</h2>
        }
        <button type="button" class="close">Close</button>
      </header>
      @if (withInitialFocus()) {
        <input class="search" cngxPopoverSheetInitialFocus aria-label="Search" />
      }
      <ul>
        <li><button type="button" class="item">Vienna</button></li>
      </ul>
      <div cngxPopover #inner="cngxPopover" class="inner-pop">Inner</div>
    </div>
  `,
  imports: [
    CngxPopover,
    CngxPopoverSheet,
    CngxPopoverSheetHeader,
    CngxPopoverSheetTitle,
    CngxPopoverSheetHandle,
    CngxPopoverSheetInitialFocus,
    CngxSwipeDismiss,
  ],
})
class SheetHost {
  readonly request = signal<CngxPopoverPresentationRequest>('sheet');
  readonly autoPresentation = signal<'sheet' | 'fullscreen'>('sheet');
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly restoreFocus = signal(true);
  readonly restoreTarget = signal<HTMLElement | undefined>(undefined);
  readonly closeOnRequest = signal(true);
  readonly mode = signal<PopoverMode>('manual');
  readonly closeOnEscape = signal(true);
  readonly withTitle = signal(true);
  readonly withInitialFocus = signal(false);
  readonly reasons: CngxPopoverSheetCloseReason[] = [];
  closingHandler: (() => void) | null = null;
  openerHandler: (() => void) | null = null;

  readonly popover = viewChild.required('pop', { read: CngxPopover });
  readonly inner = viewChild.required('inner', { read: CngxPopover });
  readonly sheet = viewChild.required(CngxPopoverSheet);
  readonly swipe = viewChild.required(CngxSwipeDismiss);

  handleOpenerClick(): void {
    this.popover().show();
    this.openerHandler?.();
  }

  handleClosing(): void {
    this.closingHandler?.();
  }
}

@Component({
  template: `
    <button type="button" class="outer-opener">Open</button>
    <div cngxPopover #outer="cngxPopover" cngxPopoverSheet="sheet">
      <h2 cngxPopoverSheetTitle>Outer</h2>
      <button type="button" class="outer-item">Outer item</button>
      <div cngxPopover #inner="cngxPopover" cngxPopoverSheet="sheet">
        <h2 cngxPopoverSheetTitle>Inner</h2>
        <button type="button" class="inner-item">Inner item</button>
      </div>
    </div>
  `,
  imports: [CngxPopover, CngxPopoverSheet, CngxPopoverSheetTitle],
})
class NestedSheetHost {
  readonly outer = viewChild.required('outer', { read: CngxPopover });
  readonly inner = viewChild.required('inner', { read: CngxPopover });
}

describe('CngxPopoverSheet', () => {
  beforeEach(() => {
    breakpoint = '0';
    resizeCallback = null;
    rafQueue = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: WINDOW, useValue: fakeWindow },
        // jsdom reports every element as zero-sized; the CDK checker would
        // treat every control as invisible.
        {
          provide: InteractivityChecker,
          useValue: {
            isFocusable: (el: Element) => ['BUTTON', 'INPUT'].includes(el.tagName),
            isTabbable: (el: Element) => ['BUTTON', 'INPUT'].includes(el.tagName),
            isVisible: () => true,
            isDisabled: () => false,
          },
        },
      ],
    });
    stubTransition('0s');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete fakeWindow['CloseWatcher'];
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
  });

  function setup(configure?: (host: SheetHost) => void) {
    const fixture = TestBed.createComponent(SheetHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const panel = host.popover().elementRef.nativeElement;
    const rec = panel as unknown as Record<string, unknown>;
    rec['showPopover'] = vi.fn();
    rec['hidePopover'] = vi.fn();
    const q = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
    const flush = () => {
      fixture.detectChanges();
      TestBed.flushEffects();
    };
    return { fixture, host, root, panel, q, flush };
  }

  function openFromOpener(ctx: ReturnType<typeof setup>): void {
    const opener = ctx.q<HTMLButtonElement>('.opener');
    opener.focus();
    opener.click();
    ctx.flush();
  }

  describe('presentation', () => {
    it('carries the host class and the request and presentation attributes', () => {
      const { panel } = setup();
      expect(panel.classList.contains('cngx-popover-sheet')).toBe(true);
      expect(panel.getAttribute('data-cngx-sheet')).toBe('sheet');
      expect(panel.getAttribute('data-cngx-presentation')).toBe('sheet');
    });

    it('resolves auto through the stylesheet breakpoint', () => {
      const { host, panel, flush } = setup((h) => h.request.set('auto'));
      resize();
      flush();
      expect(panel.getAttribute('data-cngx-presentation')).toBe('anchored');

      breakpoint = '1';
      resize();
      flush();
      expect(panel.getAttribute('data-cngx-presentation')).toBe('sheet');

      host.autoPresentation.set('fullscreen');
      flush();
      expect(panel.getAttribute('data-cngx-presentation')).toBe('fullscreen');
    });

    it('stays anchored while the breakpoint cannot be read', () => {
      const { panel } = setup((h) => h.request.set('auto'));
      expect(panel.getAttribute('data-cngx-presentation')).toBe('anchored');
    });

    it('follows a request flip on an open popover with ARIA, trap and anchor gate', () => {
      const ctx = setup((h) => h.request.set('anchored'));
      const { host, panel, flush, q } = ctx;
      host.popover().show();
      flush();
      expect(panel.getAttribute('role')).toBeNull();
      expect(panel.getAttribute('aria-modal')).toBeNull();
      expect(panel.style.getPropertyValue('position-try-fallbacks')).toBe('flip-block');

      host.request.set('fullscreen');
      flush();
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getAttribute('aria-modal')).toBe('true');
      expect(panel.getAttribute('aria-labelledby')).toBe(q('.title').id);
      expect(panel.style.getPropertyValue('position-try-fallbacks')).toBe('');
      expect(panel.parentElement?.querySelectorAll('.cdk-focus-trap-anchor')).toHaveLength(2);

      host.request.set('sheet');
      flush();
      expect(panel.getAttribute('data-cngx-presentation')).toBe('sheet');
      expect(panel.getAttribute('role')).toBe('dialog');

      host.request.set('auto');
      flush();
      expect(panel.getAttribute('role')).toBeNull();
      expect(panel.getAttribute('aria-modal')).toBeNull();
      expect(panel.getAttribute('aria-labelledby')).toBeNull();
      expect(panel.style.getPropertyValue('position-try-fallbacks')).toBe('flip-block');
    });

    it('engages when a flip makes an open popover modal and releases on the flip back', () => {
      const ctx = setup((h) => h.request.set('anchored'));
      const { host, flush, q, panel } = ctx;
      openFromOpener(ctx);
      expect(q('.page-check').hasAttribute('inert')).toBe(false);

      host.request.set('sheet');
      flush();
      expect(q('.page-check').hasAttribute('inert')).toBe(true);
      expect(panel.contains(document.activeElement)).toBe(true);
      expect(document.body.style.position).toBe('fixed');

      host.request.set('anchored');
      flush();
      expect(q('.page-check').hasAttribute('inert')).toBe(false);
      expect(document.body.style.position).toBe('');
    });
  });

  describe('accessible name', () => {
    it('points aria-labelledby at the title, never at the header', () => {
      const ctx = setup();
      openFromOpener(ctx);
      const labelledBy = ctx.panel.getAttribute('aria-labelledby');
      expect(document.getElementById(labelledBy ?? '')).toBe(ctx.q('.title'));
      expect(ctx.q('.header').contains(ctx.q('.close'))).toBe(true);
      expect(document.getElementById(labelledBy ?? '')?.contains(ctx.q('.close'))).toBe(false);
      expect(ctx.q('.title').id).toMatch(/^cngx-popover-sheet-title-/);
    });

    it('lets labelledBy win over the registered title', () => {
      const ctx = setup((h) => h.labelledBy.set('external-label'));
      expect(ctx.panel.getAttribute('aria-labelledby')).toBe('external-label');
    });

    it('warns CNGX1064 once when a modal sheet opens without a name', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const ctx = setup((h) => h.withTitle.set(false));
      openFromOpener(ctx);
      ctx.host.popover().hide();
      openFromOpener(ctx);
      const calls = warn.mock.calls.filter(([m]) => String(m).startsWith('CNGX1064'));
      expect(calls).toHaveLength(1);
    });

    it('warns CNGX1065 once when the popover is not manual', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const ctx = setup((h) => h.mode.set('auto'));
      openFromOpener(ctx);
      ctx.host.popover().hide();
      openFromOpener(ctx);
      const calls = warn.mock.calls.filter(([m]) => String(m).startsWith('CNGX1065'));
      expect(calls).toHaveLength(1);
    });
  });

  describe('open', () => {
    it('moves focus to the initial-focus part inside show(), under aria-hidden="false"', () => {
      const ctx = setup((h) => h.withInitialFocus.set(true));
      let focusedInHandler: Element | null = null;
      let ariaHiddenInHandler: string | null = null;
      ctx.host.openerHandler = () => {
        focusedInHandler = document.activeElement;
        ariaHiddenInHandler = ctx.panel.getAttribute('aria-hidden');
      };
      ctx.q<HTMLButtonElement>('.opener').click();
      expect(focusedInHandler).toBe(ctx.q('.search'));
      expect(ariaHiddenInHandler).toBe('false');
    });

    it('moves focus within an effect run when show() is called from an effect', () => {
      const ctx = setup((h) => h.withInitialFocus.set(true));
      const trigger = signal(false);
      let focusedInEffect: Element | null = null;
      effect(
        () => {
          if (trigger()) {
            untracked(() => ctx.host.popover().show());
            focusedInEffect = document.activeElement;
          }
        },
        { injector: TestBed.inject(Injector) },
      );
      trigger.set(true);
      TestBed.flushEffects();
      expect(focusedInEffect).toBe(ctx.q('.search'));
    });

    it('falls back to the first tabbable element without an initial-focus part', () => {
      const ctx = setup();
      openFromOpener(ctx);
      expect(document.activeElement).toBe(ctx.q('.close'));
    });

    it('has focus inside the panel when the page goes inert', () => {
      const ctx = setup();
      const check = ctx.q<HTMLInputElement>('.page-check');
      let activeAtInert: Element | null = null;
      const setAttribute = check.setAttribute.bind(check);
      vi.spyOn(check, 'setAttribute').mockImplementation((name: string, value: string) => {
        if (name === 'inert') {
          activeAtInert = document.activeElement;
        }
        setAttribute(name, value);
      });
      openFromOpener(ctx);
      expect(ctx.panel.contains(activeAtInert)).toBe(true);
    });

    it('inerts page siblings but skips live regions and elements already inert', () => {
      const ctx = setup();
      openFromOpener(ctx);
      expect(ctx.q('.opener').hasAttribute('inert')).toBe(true);
      expect(ctx.q('.page-check').hasAttribute('inert')).toBe(true);
      expect(ctx.q('.page-status').hasAttribute('inert')).toBe(false);
      expect(ctx.panel.hasAttribute('inert')).toBe(false);

      ctx.host.popover().hide();
      expect(ctx.q('.opener').hasAttribute('inert')).toBe(false);
      expect(ctx.q('.page-check').hasAttribute('inert')).toBe(false);
      expect(ctx.q('.pre-inert').hasAttribute('inert')).toBe(true);
    });

    it('creates both scoped live regions on open', () => {
      const ctx = setup();
      openFromOpener(ctx);
      expect(ctx.panel.querySelector('span[aria-live="polite"]')).not.toBeNull();
      expect(ctx.panel.querySelector('span[aria-live="assertive"]')).not.toBeNull();
    });

    it('pins the page while open and releases on close and on destroy', () => {
      const ctx = setup();
      openFromOpener(ctx);
      expect(document.body.style.position).toBe('fixed');
      ctx.host.popover().hide();
      expect(document.body.style.position).toBe('');

      openFromOpener(ctx);
      expect(document.body.style.position).toBe('fixed');
      ctx.fixture.destroy();
      expect(document.body.style.position).toBe('');
    });

    it('keeps the panel settling until two frames report the same rect', () => {
      const ctx = setup();
      vi.spyOn(ctx.panel, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 400, 390, 300));
      openFromOpener(ctx);
      expect(ctx.panel.hasAttribute('data-cngx-sheet-settling')).toBe(true);
      runFrame();
      expect(ctx.panel.hasAttribute('data-cngx-sheet-settling')).toBe(true);
      runFrame();
      expect(ctx.panel.hasAttribute('data-cngx-sheet-settling')).toBe(false);
    });

    it('ends settling at the frame cap when the rect keeps moving', () => {
      const ctx = setup();
      let top = 0;
      vi.spyOn(ctx.panel, 'getBoundingClientRect').mockImplementation(
        () => new DOMRect(0, (top += 10), 390, 300),
      );
      openFromOpener(ctx);
      for (let frame = 0; frame < 3; frame++) {
        runFrame();
        expect(ctx.panel.hasAttribute('data-cngx-sheet-settling')).toBe(true);
      }
      runFrame();
      expect(ctx.panel.hasAttribute('data-cngx-sheet-settling')).toBe(false);
    });
  });

  describe('anchored', () => {
    it('adds no sentinels, no inert, no lock and no ARIA while anchored', () => {
      const ctx = setup((h) => h.request.set('anchored'));
      openFromOpener(ctx);
      expect(ctx.root.querySelectorAll('.cdk-focus-trap-anchor')).toHaveLength(0);
      expect(ctx.q('.page-check').hasAttribute('inert')).toBe(false);
      expect(document.body.style.position).toBe('');
      expect(ctx.panel.getAttribute('role')).toBeNull();
      expect(document.activeElement).toBe(ctx.q('.opener'));
      expect(ctx.panel.querySelector('span[aria-live]')).toBeNull();
    });
  });

  describe('close', () => {
    it('releases the page and restores focus before the close transition finishes', () => {
      vi.useFakeTimers();
      const ctx = setup();
      openFromOpener(ctx);
      const opener = ctx.q<HTMLButtonElement>('.opener');
      const focusLog: Element[] = [];
      const log = () => focusLog.push(document.activeElement ?? document.body);
      document.addEventListener('focusin', log);
      document.addEventListener('focusout', log);

      stubTransition('0.2s');
      ctx.host.popover().hide();
      expect(ctx.host.popover().state()).toBe('closing');
      expect(opener.hasAttribute('inert')).toBe(false);
      expect(document.activeElement).toBe(opener);

      vi.advanceTimersByTime(500);
      expect(ctx.host.popover().state()).toBe('closed');
      expect(document.activeElement).toBe(opener);
      expect(focusLog.some((el) => el === document.body && document.activeElement !== opener)).toBe(
        false,
      );
      document.removeEventListener('focusin', log);
      document.removeEventListener('focusout', log);
    });

    it('restores focus without a close transition too', () => {
      const ctx = setup();
      openFromOpener(ctx);
      ctx.host.popover().hide();
      expect(document.activeElement).toBe(ctx.q('.opener'));
    });

    it('lets a closing handler move focus while the page is live and skips its own restore', () => {
      const ctx = setup((h) => h.restoreFocus.set(false));
      const check = ctx.q<HTMLInputElement>('.page-check');
      let inertInHandler: boolean | null = null;
      ctx.host.closingHandler = () => {
        inertInHandler = check.hasAttribute('inert');
        check.focus();
      };
      openFromOpener(ctx);
      ctx.host.popover().hide();
      expect(inertInHandler).toBe(false);
      expect(document.activeElement).toBe(check);
    });

    it('restores focus and emits closing on a native close that skips hide()', () => {
      const ctx = setup();
      const closing = vi.fn();
      ctx.host.closingHandler = closing;
      openFromOpener(ctx);
      const event = new Event('beforetoggle') as Event & { newState: string };
      Object.defineProperty(event, 'newState', { value: 'closed' });
      ctx.panel.dispatchEvent(event);

      expect(closing).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(ctx.q('.opener'));
      expect(ctx.q('.opener').hasAttribute('inert')).toBe(false);
    });

    it('restores focus when destroyed while open', () => {
      // The restore target lives outside the fixture, so it survives the
      // destroy that removes the sheet.
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      const ctx = setup((h) => h.restoreTarget.set(outside));
      openFromOpener(ctx);
      expect(ctx.panel.contains(document.activeElement)).toBe(true);

      ctx.fixture.destroy();
      expect(document.activeElement).toBe(outside);
      outside.remove();
    });

    it('does not emit closing for an anchored close', () => {
      const ctx = setup((h) => h.request.set('anchored'));
      const closing = vi.fn();
      ctx.host.closingHandler = closing;
      openFromOpener(ctx);
      ctx.host.popover().hide();
      expect(closing).not.toHaveBeenCalled();
    });

    it('hands a message still pending at close to the root announcer', () => {
      vi.useFakeTimers();
      const ctx = setup();
      const root = vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce');
      openFromOpener(ctx);
      ctx.host.sheet().announce('Picked Vienna');
      ctx.host.sheet().announce('Save failed', 'assertive');
      ctx.host.popover().hide();
      vi.advanceTimersByTime(CLEAR_DELAY_MS);

      expect(root).toHaveBeenCalledWith('Picked Vienna', 'polite');
      expect(root).toHaveBeenCalledWith('Save failed', 'assertive');
      expect(ctx.panel.querySelector('span[aria-live="polite"]')?.textContent).toBe('');
    });
  });

  describe('focus trap', () => {
    it('keeps the sentinels non-inert on every open and wraps Tab', () => {
      const ctx = setup();
      openFromOpener(ctx);
      ctx.host.popover().hide();
      ctx.flush();
      openFromOpener(ctx);

      const anchors = Array.from(
        ctx.panel.parentElement!.querySelectorAll<HTMLElement>('.cdk-focus-trap-anchor'),
      );
      expect(anchors).toHaveLength(2);
      expect(anchors.every((a) => !a.hasAttribute('inert'))).toBe(true);

      ctx.q<HTMLButtonElement>('.item').focus();
      anchors[1].focus();
      expect(document.activeElement).toBe(ctx.q('.close'));
    });
  });

  describe('nested sheets', () => {
    it('restores only its own inert set', () => {
      const fixture = TestBed.createComponent(NestedSheetHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const root = fixture.nativeElement as HTMLElement;
      for (const pop of [fixture.componentInstance.outer(), fixture.componentInstance.inner()]) {
        const rec = pop.elementRef.nativeElement as unknown as Record<string, unknown>;
        rec['showPopover'] = vi.fn();
        rec['hidePopover'] = vi.fn();
      }
      const outerOpener = root.querySelector<HTMLElement>('.outer-opener')!;
      const outerItem = root.querySelector<HTMLElement>('.outer-item')!;

      fixture.componentInstance.outer().show();
      expect(outerOpener.hasAttribute('inert')).toBe(true);
      fixture.componentInstance.inner().show();
      expect(outerItem.hasAttribute('inert')).toBe(true);

      fixture.componentInstance.inner().hide();
      expect(outerItem.hasAttribute('inert')).toBe(false);
      expect(outerOpener.hasAttribute('inert')).toBe(true);

      fixture.componentInstance.outer().hide();
      expect(outerOpener.hasAttribute('inert')).toBe(false);
    });
  });

  describe('announce', () => {
    it('speaks into the scoped regions and never through the root announcer', () => {
      vi.useFakeTimers();
      const ctx = setup();
      const root = vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce');
      openFromOpener(ctx);
      ctx.host.sheet().announce('3 results');
      ctx.host.sheet().announce('Save failed', 'assertive');
      vi.advanceTimersByTime(CLEAR_DELAY_MS);
      expect(ctx.panel.querySelector('span[aria-live="polite"]')?.textContent).toBe('3 results');
      expect(ctx.panel.querySelector('span[aria-live="assertive"]')?.textContent).toBe(
        'Save failed',
      );
      expect(root).not.toHaveBeenCalled();
    });
  });

  describe('close requests', () => {
    it('emits and hides once; a second request after the hide is a no-op', () => {
      const ctx = setup();
      openFromOpener(ctx);
      ctx.host.sheet().requestClose('close');
      ctx.host.sheet().requestClose('close');
      expect(ctx.host.reasons).toEqual(['close']);
      expect(ctx.host.popover().state()).toBe('closed');
    });

    it('only emits while closeOnRequest is off', () => {
      const ctx = setup((h) => h.closeOnRequest.set(false));
      openFromOpener(ctx);
      ctx.host.sheet().requestClose('back');
      expect(ctx.host.reasons).toEqual(['back']);
      expect(ctx.host.popover().state()).not.toBe('closed');
    });

    it('ignores requests while closed', () => {
      const ctx = setup();
      ctx.host.sheet().requestClose('backdrop');
      expect(ctx.host.reasons).toEqual([]);
    });

    it('routes a header swipe to closeRequested', () => {
      const ctx = setup();
      openFromOpener(ctx);
      ctx.host.swipe().swiped.emit();
      expect(ctx.host.reasons).toEqual(['swipe']);
    });
  });

  describe('handle', () => {
    it('is decorative', () => {
      const ctx = setup();
      const handle = ctx.q('.cngx-popover-sheet-handle');
      expect(handle.getAttribute('aria-hidden')).toBe('true');
    });
  });
  describe('outside tap', () => {
    it('requests a backdrop close for a pointerdown outside the panel only', () => {
      const ctx = setup((h) => h.closeOnRequest.set(false));
      openFromOpener(ctx);
      ctx.q('.item').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      expect(ctx.host.reasons).toEqual([]);

      ctx.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      expect(ctx.host.reasons).toEqual(['backdrop']);
    });

    it('swallows the click that follows an outside-tap close', () => {
      const ctx = setup();
      openFromOpener(ctx);
      const check = ctx.q<HTMLInputElement>('.page-check');
      check.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      expect(ctx.host.popover().state()).toBe('closed');
      expect(check.hasAttribute('inert')).toBe(false);

      check.click();
      expect(check.checked).toBe(false);
      check.click();
      expect(check.checked).toBe(true);
    });

    it('never swallows a click after the next pointerdown or after the timeout', () => {
      vi.useFakeTimers();
      const ctx = setup((h) => h.closeOnRequest.set(false));
      openFromOpener(ctx);
      const item = ctx.q<HTMLButtonElement>('.item');
      const clicked = vi.fn();
      item.addEventListener('click', clicked);

      ctx.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      item.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      item.click();
      expect(clicked).toHaveBeenCalledTimes(1);

      ctx.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      vi.advanceTimersByTime(600);
      item.click();
      expect(clicked).toHaveBeenCalledTimes(2);
    });

    it('detaches the listener after close and never listens while anchored', () => {
      const ctx = setup();
      openFromOpener(ctx);
      ctx.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      expect(ctx.host.reasons).toEqual(['backdrop']);
      expect(ctx.host.popover().state()).toBe('closed');

      ctx.host.request.set('anchored');
      ctx.flush();
      openFromOpener(ctx);
      ctx.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      expect(ctx.host.reasons).toEqual(['backdrop']);
    });
  });

  describe('back gesture', () => {
    let watchers: { onclose: (() => void) | null; destroy: ReturnType<typeof vi.fn> }[];

    beforeEach(() => {
      watchers = [];
      fakeWindow['CloseWatcher'] = class {
        onclose: (() => void) | null = null;
        destroy = vi.fn();
        constructor() {
          watchers.push(this);
        }
      };
    });

    it('creates a watcher on open, closes on back and destroys it on close', () => {
      const ctx = setup();
      openFromOpener(ctx);
      expect(watchers).toHaveLength(1);

      watchers[0].onclose?.();
      expect(ctx.host.reasons).toEqual(['back']);
      expect(ctx.host.popover().state()).toBe('closed');
      expect(watchers).toHaveLength(1);
    });

    it('destroys the watcher when the sheet closes another way', () => {
      const ctx = setup();
      openFromOpener(ctx);
      ctx.host.popover().hide();
      expect(watchers[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('re-arms a fresh watcher after a blocked back and intercepts the next one', () => {
      const ctx = setup((h) => h.closeOnRequest.set(false));
      openFromOpener(ctx);
      watchers[0].onclose?.();
      expect(ctx.host.popover().state()).not.toBe('closed');
      expect(watchers).toHaveLength(2);

      watchers[1].onclose?.();
      expect(ctx.host.reasons).toEqual(['back', 'back']);
      expect(watchers).toHaveLength(3);
    });

    it('lets Escape close through CngxPopover and drops a back fired in the same keypress', () => {
      const ctx = setup();
      openFromOpener(ctx);
      const watcher = watchers[0];
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(ctx.host.popover().state()).toBe('closed');
      expect(ctx.host.reasons).toEqual([]);
      expect(watcher.destroy).toHaveBeenCalledTimes(1);

      watcher.onclose?.();
      expect(ctx.host.reasons).toEqual([]);
      expect(watchers).toHaveLength(1);
    });

    it('ignores a watcher close from an Escape that closeOnEscape=false keeps out', () => {
      const ctx = setup((h) => h.closeOnEscape.set(false));
      openFromOpener(ctx);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      watchers[0].onclose?.();

      expect(ctx.host.popover().state()).not.toBe('closed');
      expect(ctx.host.reasons).toEqual([]);
      expect(watchers).toHaveLength(2);
    });

    it('closes only the nested popover on Escape, not the sheet around it', () => {
      const ctx = setup();
      openFromOpener(ctx);
      const inner = ctx.host.inner();
      const rec = inner.elementRef.nativeElement as unknown as Record<string, unknown>;
      rec['showPopover'] = vi.fn();
      rec['hidePopover'] = vi.fn();
      inner.show();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      watchers[0].onclose?.();

      expect(inner.state()).toBe('closed');
      expect(ctx.host.popover().state()).not.toBe('closed');
      expect(ctx.host.reasons).toEqual([]);
    });

    it('treats a watcher close after the Escape task as the back gesture again', async () => {
      const ctx = setup((h) => h.closeOnEscape.set(false));
      openFromOpener(ctx);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      watchers[0].onclose?.();
      await new Promise((resolve) => setTimeout(resolve));

      watchers[1].onclose?.();
      expect(ctx.host.reasons).toEqual(['back']);
    });

    it('runs onHide() once for an Escape close', () => {
      const ctx = setup();
      const closing = vi.fn();
      ctx.host.closingHandler = closing;
      openFromOpener(ctx);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(closing).toHaveBeenCalledTimes(1);
    });

    it('creates no watcher without CloseWatcher (iOS)', () => {
      delete fakeWindow['CloseWatcher'];
      const ctx = setup();
      openFromOpener(ctx);
      ctx.host.popover().hide();
      expect(watchers).toHaveLength(0);
    });
  });
});
