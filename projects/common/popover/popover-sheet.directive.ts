import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import {
  type AriaLivePoliteness,
  CngxFocusTrap,
  CngxLiveAnnouncer,
  createScopedLiveRegion,
} from '@cngx/common/a11y';
import { createContainerSize, createPinnedScrollLock } from '@cngx/common/layout';
import { injectWindow } from '@cngx/core/tokens';
import { createSlotRegistry, createTransitionTracker } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';

import { CngxPopover } from './popover.directive';
import {
  CNGX_POPOVER_PRESENTATION,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationSeam,
} from './popover-presentation';
import {
  CNGX_POPOVER_SHEET_HOST,
  type CngxPopoverSheetCloseReason,
  type CngxPopoverSheetFocusHandle,
  type CngxPopoverSheetPartsHost,
  type CngxPopoverSheetTitleHandle,
} from './popover-sheet-host';

/**
 * What a consumer asks for: a fixed presentation, or `'auto'` to let the
 * breakpoint in `cngx-popover-sheet.css` decide.
 *
 * @category common/popover
 */
export type CngxPopoverPresentationRequest = 'auto' | CngxPopoverPresentation;

const BREAKPOINT_PROPERTY = '--cngx-popover-sheet-breakpoint';
const SETTLING_ATTRIBUTE = 'data-cngx-sheet-settling';
const SETTLING_FRAME_CAP = 4;
const LIVE_REGION_SELECTOR = '[aria-live], [role="status"], [role="alert"], [role="log"]';
const FOCUS_TRAP_ANCHOR_CLASS = 'cdk-focus-trap-anchor';

// Not in lib.dom yet; Chromium only (Android back gesture, Escape).
interface CloseWatcherLike {
  onclose: (() => void) | null;
  destroy(): void;
}
type CloseWatcherCtor = new () => CloseWatcherLike;

/**
 * Turns a `CngxPopover` into a modal bottom sheet or fullscreen panel on
 * coarse, narrow viewports, and leaves it anchored everywhere else.
 *
 * Place it on the `[cngxPopover]` element. With the default `'auto'` request,
 * the breakpoint written once in `cngx-popover-sheet.css`
 * (`(pointer: coarse) and (max-width: 48rem)`) picks between the anchored
 * panel and `autoPresentation` (`'sheet'` or `'fullscreen'`). Pass a fixed
 * presentation to override it.
 *
 * Both non-anchored presentations are modal: the host becomes
 * `role="dialog"` + `aria-modal="true"`, named by its
 * `CngxPopoverSheetTitle`; focus moves into the panel inside `show()` (so a
 * tap-opened sheet keeps the iOS keyboard), Tab is trapped, every page
 * sibling is `inert`, the page is pinned, and announcements go through
 * {@link announce} into a live region inside the panel, the only region
 * VoiceOver speaks under `aria-modal`. On close the page is live again and
 * focus is back on the opener before the close transition starts.
 *
 * The sheet never closes itself. Header swipes, outside taps and the Android
 * back gesture arrive as `closeRequested` with a reason; the popover hides
 * unless `closeOnRequest` is `false`, which lets a consumer apply its own
 * dismiss policy. Escape stays with `CngxPopover`'s `closeOnEscape`.
 *
 * Requires `mode="manual"` on the popover (the default): native light dismiss
 * would bypass `closeRequested`.
 *
 * ```html
 * <button type="button" (click)="pop.show()">Choose city</button>
 * <div cngxPopover #pop="cngxPopover" cngxPopoverSheet #sheet="cngxPopoverSheet">
 *   <header cngxPopoverSheetHeader cngxSwipeDismiss="down">
 *     <span cngxPopoverSheetHandle></span>
 *     <h2 cngxPopoverSheetTitle>City</h2>
 *     <button type="button" (click)="sheet.requestClose('close')">Close</button>
 *   </header>
 *   <ul>...</ul>
 * </div>
 * ```
 *
 * @category common/popover
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-sheet.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPopover, CngxSwipeDismiss, CngxFocusTrap, createPinnedScrollLock, createScopedLiveRegion
 */
@Directive({
  selector: '[cngxPopoverSheet]',
  exportAs: 'cngxPopoverSheet',
  standalone: true,
  hostDirectives: [{ directive: CngxFocusTrap, inputs: [], outputs: [] }],
  providers: [
    { provide: CNGX_POPOVER_PRESENTATION, useExisting: CngxPopoverSheet },
    { provide: CNGX_POPOVER_SHEET_HOST, useExisting: CngxPopoverSheet },
  ],
  host: {
    class: 'cngx-popover-sheet',
    '[attr.data-cngx-sheet]': 'request()',
    '[attr.data-cngx-presentation]': 'presentation()',
    '[attr.role]': 'roleAttr()',
    '[attr.aria-modal]': 'ariaModal()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.tabindex]': 'tabindexAttr()',
    '(beforetoggle)': 'handleBeforeToggle($event)',
  },
})
export class CngxPopoverSheet implements CngxPopoverPresentationSeam, CngxPopoverSheetPartsHost {
  private readonly popover = inject(CngxPopover, { self: true });
  private readonly trap = inject(CngxFocusTrap, { self: true });
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly doc = inject(DOCUMENT);
  private readonly win = injectWindow();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // Static attributes the consumer wrote are what the anchored presentation
  // keeps; the bindings below only take over while the sheet is modal.
  private readonly staticRole = this.host.getAttribute('role');
  private readonly staticLabelledBy = this.host.getAttribute('aria-labelledby');
  private readonly staticTabindex = this.host.getAttribute('tabindex');

  /**
   * Requested presentation. `'auto'` (default, also the bare attribute)
   * resolves through the stylesheet breakpoint.
   */
  readonly request = input<CngxPopoverPresentationRequest, CngxPopoverPresentationRequest | ''>(
    'auto',
    { alias: 'cngxPopoverSheet', transform: (v) => (v === '' ? 'auto' : v) },
  );

  /**
   * What `'auto'` resolves to below the breakpoint: a content-sized `'sheet'`
   * or a `'fullscreen'` panel (for panels led by a text input).
   */
  readonly autoPresentation = input<'sheet' | 'fullscreen'>('sheet');

  /** Id of the element naming the dialog. Wins over a registered `CngxPopoverSheetTitle`. */
  readonly labelledBy = input<string | undefined>(undefined);

  /**
   * Whether the sheet returns focus on close (to `restoreTarget`, else to the
   * element focused before it opened). Turn it off when a `closing` handler
   * moves focus itself.
   */
  readonly restoreFocus = input(true);

  /** Element to return focus to on close. Defaults to the element focused before open. */
  readonly restoreTarget = input<HTMLElement | undefined>(undefined);

  /**
   * Whether a close request hides the popover. `false` only emits
   * `closeRequested`, so the consumer decides.
   */
  readonly closeOnRequest = input(true);

  /** A swipe, outside tap, back gesture or close control asked the sheet to close. */
  readonly closeRequested = output<CngxPopoverSheetCloseReason>();

  /**
   * Emits synchronously inside `hide()` while the page is already live again,
   * before the close transition. The place to move focus out of the panel.
   * Fires only for a modal close.
   */
  readonly closing = output<void>();

  private readonly breakpoint = createContainerSize(
    this.doc.documentElement,
    inject(DestroyRef),
    this.win,
  ).property(BREAKPOINT_PROPERTY, this.host);

  /** Resolved presentation, reflected as `data-cngx-presentation`. */
  readonly presentation = computed<CngxPopoverPresentation>(() => {
    const request = this.request();
    if (request !== 'auto') {
      return request;
    }
    return this.breakpoint() === '1' ? this.autoPresentation() : 'anchored';
  });

  /** `true` in the sheet and fullscreen presentations. */
  readonly modal = computed(() => this.presentation() !== 'anchored');

  /** @internal */
  readonly titleRegistry = createSlotRegistry<CngxPopoverSheetTitleHandle>();
  /** @internal */
  readonly initialFocusRegistry = createSlotRegistry<CngxPopoverSheetFocusHandle>();

  protected readonly roleAttr = computed(() => (this.modal() ? 'dialog' : this.staticRole));
  protected readonly ariaModal = computed(() => (this.modal() ? 'true' : null));
  protected readonly ariaLabelledBy = computed(() =>
    this.modal()
      ? (this.labelledBy() ?? this.titleRegistry.current()?.id() ?? null)
      : this.staticLabelledBy,
  );
  // Last-resort focus target: a modal sheet with nothing tabbable inside
  // still takes focus on its host.
  protected readonly tabindexAttr = computed(() =>
    this.modal() ? (this.staticTabindex ?? '-1') : this.staticTabindex,
  );

  private readonly region = createScopedLiveRegion(this.host);

  private engaged = false;
  private savedFocus: HTMLElement | null = null;
  private inerted: HTMLElement[] = [];
  private releaseLock: (() => void) | null = null;
  private settlingFrame: number | null = null;
  private warnedTitle = false;
  private warnedMode = false;
  private closeWatcher: CloseWatcherLike | null = null;

  // Capture phase: the tap must be seen before anything under it reacts.
  // The page siblings are inert, so a tap outside the panel lands on a
  // non-inert ancestor; the popover ::backdrop does not catch taps (S7).
  private readonly outsidePointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (target instanceof Node && this.host.contains(target)) {
      return;
    }
    this.requestClose('backdrop');
  };

  constructor() {
    this.trap.setEnabledSource(computed(() => this.modal() && this.popover.isVisible()));
    this.trap.setAutoFocusOverride(false);

    // A breakpoint crossing or request flip while open. Open and close
    // themselves run through onShown() / onHide(), which engage first, so
    // this effect only sees edges nobody handled yet.
    const active = createTransitionTracker(() => this.modal() && this.popover.isVisible());
    effect(() => {
      const now = active.current();
      const previous = active.previous();
      untracked(() => {
        if (now && !previous && !this.engaged) {
          this.engage(!this.host.contains(this.doc.activeElement));
        }
        if (!now && previous && this.engaged) {
          this.release();
        }
      });
    });

    inject(DestroyRef).onDestroy(() => this.release());
  }

  /** @internal Seam call from `CngxPopover.show()`, after `showPopover()`. */
  onShown(): void {
    if (!this.modal()) {
      return;
    }
    this.engage(true);
  }

  /** @internal Seam call from `CngxPopover.hide()`, before the close transition. */
  onHide(): void {
    if (!this.engaged) {
      return;
    }
    this.restoreInert();
    this.handOffPendingAnnouncements();
    this.closing.emit();
    if (this.restoreFocus() && this.host.contains(this.doc.activeElement)) {
      const target = this.restoreTarget() ?? this.savedFocus;
      if (target?.isConnected) {
        target.focus();
      }
    }
    this.release();
  }

  /**
   * Ask the sheet to close. Emits `closeRequested` once per open (no-op
   * unless the popover is opening or open) and hides when `closeOnRequest`
   * is on.
   */
  requestClose(reason: CngxPopoverSheetCloseReason): void {
    const state = this.popover.state();
    if (state !== 'open' && state !== 'opening') {
      return;
    }
    this.closeRequested.emit(reason);
    if (this.closeOnRequest()) {
      this.popover.hide();
    }
  }

  /**
   * Speak `message` from the live region inside the panel. Use it for
   * every announcement while the sheet is modal: VoiceOver drops body-level
   * regions under `aria-modal`.
   */
  announce(message: string, politeness: AriaLivePoliteness = 'polite'): void {
    this.region.announce(message, politeness);
  }

  /**
   * Move focus to the registered `CngxPopoverSheetInitialFocus`, else the
   * first tabbable element, else the host. Runs on every modal open.
   */
  focusInitial(): void {
    const target = this.initialFocusRegistry.current()?.element;
    if (target) {
      target.focus();
      return;
    }
    if (!this.trap.focusFirstNow()) {
      this.host.focus();
    }
  }

  protected handleBeforeToggle(event: ToggleEvent): void {
    // Native close paths (light dismiss, a direct hidePopover()) skip hide().
    if (event.newState === 'closed' && this.engaged) {
      this.restoreInert();
      this.handOffPendingAnnouncements();
      this.release();
    }
  }

  // Open order: focus, then inert, then lock. Focus first so the move
  // happens while the trigger is still focusable and inside the opening
  // gesture; inert after so the page never holds focus under inert.
  private engage(moveFocus: boolean): void {
    if (this.engaged) {
      return;
    }
    this.engaged = true;
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      this.warnOnMisconfiguration();
    }
    this.savedFocus = this.popover.focusOrigin();
    this.region.ensure();
    if (moveFocus) {
      this.focusInitial();
    }
    this.applyInert();
    this.releaseLock = createPinnedScrollLock(this.doc.documentElement);
    this.startSettling();
    this.doc.addEventListener('pointerdown', this.outsidePointerDown, true);
    this.armCloseWatcher();
  }

  // Idempotent: hide(), the native toggle, a flip back to anchored and
  // destroy can all reach it.
  private release(): void {
    this.doc.removeEventListener('pointerdown', this.outsidePointerDown, true);
    this.disarmCloseWatcher();
    this.restoreInert();
    this.releaseLock?.();
    this.releaseLock = null;
    this.stopSettling();
    this.engaged = false;
  }

  // Created inside the opening call, so a tap-opened sheet creates it under
  // the tap's user activation (Chrome groups watchers created without one).
  // Without CloseWatcher (iOS Safari) the back gesture leaves the page.
  private armCloseWatcher(): void {
    const Watcher = (this.win as { CloseWatcher?: CloseWatcherCtor } | null)?.CloseWatcher;
    if (typeof Watcher !== 'function') {
      return;
    }
    const watcher = new Watcher();
    watcher.onclose = () => {
      if (this.closeWatcher === watcher) {
        this.closeWatcher = null;
      }
      this.requestClose('back');
      // A blocked request leaves the sheet open; the spent watcher would let
      // the next back gesture navigate away.
      if (this.engaged && this.closeWatcher === null) {
        this.armCloseWatcher();
      }
    };
    this.closeWatcher = watcher;
  }

  private disarmCloseWatcher(): void {
    const watcher = this.closeWatcher;
    this.closeWatcher = null;
    watcher?.destroy();
  }

  private applyInert(): void {
    const body = this.doc.body;
    let node: HTMLElement = this.host;
    while (node !== body && node.parentElement) {
      const parent: HTMLElement = node.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || !(sibling instanceof HTMLElement) || this.skipsInert(sibling)) {
          continue;
        }
        sibling.setAttribute('inert', '');
        this.inerted.push(sibling);
      }
      node = parent;
    }
  }

  private skipsInert(el: HTMLElement): boolean {
    return (
      el.hasAttribute('inert') ||
      el.classList.contains(FOCUS_TRAP_ANCHOR_CLASS) ||
      el.matches(LIVE_REGION_SELECTOR)
    );
  }

  private restoreInert(): void {
    for (const el of this.inerted) {
      el.removeAttribute('inert');
    }
    this.inerted = [];
  }

  // A message announced right before close would land in a region that is
  // about to hide; the root announcer speaks it after the close instead.
  private handOffPendingAnnouncements(): void {
    for (const pending of this.region.takePending()) {
      this.announcer.announce(pending.message, pending.politeness);
    }
  }

  // The pinned lock shifts the page for one frame on iOS. Keep the panel
  // invisible until two consecutive frames report the same rect.
  private startSettling(): void {
    const raf = this.win?.requestAnimationFrame?.bind(this.win);
    if (!raf) {
      return;
    }
    this.host.setAttribute(SETTLING_ATTRIBUTE, '');
    let previous: DOMRect | null = null;
    let frames = 0;
    const check = () => {
      frames += 1;
      const rect = this.host.getBoundingClientRect();
      const stable =
        previous !== null &&
        previous.top === rect.top &&
        previous.left === rect.left &&
        previous.width === rect.width &&
        previous.height === rect.height;
      if (stable || frames >= SETTLING_FRAME_CAP) {
        this.stopSettling();
        return;
      }
      previous = rect;
      this.settlingFrame = raf(check);
    };
    this.settlingFrame = raf(check);
  }

  private stopSettling(): void {
    if (this.settlingFrame !== null) {
      this.win?.cancelAnimationFrame?.(this.settlingFrame);
      this.settlingFrame = null;
    }
    this.host.removeAttribute(SETTLING_ATTRIBUTE);
  }

  private warnOnMisconfiguration(): void {
    const unnamed = !this.labelledBy() && !this.titleRegistry.current();
    if (typeof ngDevMode !== 'undefined' && ngDevMode && !this.warnedTitle && unnamed) {
      this.warnedTitle = true;
      cngxDevWarn(
        'CNGX1064',
        '[cngxPopoverSheet] opened as a modal sheet without a name. Add a ' +
          'cngxPopoverSheetTitle inside the panel or bind [labelledBy].',
        this.host,
      );
    }
    const mode = this.popover.mode();
    if (typeof ngDevMode !== 'undefined' && ngDevMode && !this.warnedMode && mode !== 'manual') {
      this.warnedMode = true;
      cngxDevWarn(
        'CNGX1065',
        `[cngxPopoverSheet] needs mode="manual" on the popover, got "${mode}". ` +
          'Native light dismiss and Escape bypass closeRequested in that mode.',
        this.host,
      );
    }
  }
}
