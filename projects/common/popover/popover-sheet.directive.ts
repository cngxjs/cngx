import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  untracked,
} from '@angular/core';
import {
  type AriaLivePoliteness,
  CNGX_FOCUS_TRAP_DRIVER,
  CngxFocusTrap,
  type CngxFocusTrapDriver,
  CngxLiveAnnouncer,
  injectScopedLiveRegion,
} from '@cngx/common/a11y';
import { createPinnedScrollLock } from '@cngx/common/layout';
import { injectWindow } from '@cngx/core/tokens';
import { createKeyedRegistry, createSlotRegistry, createTransitionTracker } from '@cngx/core/utils';
import { cngxDevWarn, CngxRuntimeError } from '@cngx/utils';

import { CngxPopover } from './popover.directive';
import {
  CNGX_POPOVER_PRESENTATION,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationSeam,
} from './popover-presentation';
import { CNGX_POPOVER_SHEET_BREAKPOINT } from './popover-sheet-breakpoint';
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

const SETTLING_ATTRIBUTE = 'data-cngx-sheet-settling';
const SETTLING_FRAME_CAP = 4;
const LIVE_REGION_SELECTOR = '[aria-live], [role="status"], [role="alert"], [role="log"]';
const FOCUS_TRAP_ANCHOR_CLASS = 'cdk-focus-trap-anchor';
// Longer than a tap's pointerdown-to-click gap, shorter than a second tap.
const CLICK_SWALLOW_MS = 600;

// Not in lib.dom yet; Chromium only (Android back gesture, Escape).
interface CloseWatcherLike {
  onclose: (() => void) | null;
  destroy(): void;
}
type CloseWatcherCtor = new () => CloseWatcherLike;

// Engaged modal sheets, oldest first. Only the topmost answers an outside
// tap: a tap on a later sheet is outside an earlier one that is not its
// DOM ancestor, and must not close both.
const engagedSheets: CngxPopoverSheet[] = [];

// How many engaged sheets want each element inert. Several sheets can be
// open at once (`[exclusive]="false"`), so an element stays inert until the
// last sheet that claimed it lets go, and one sheet's release never makes
// the page live under another. Elements inert before any sheet are never
// claimed and never touched.
const inertClaims = new WeakMap<HTMLElement, number>();

// The sheet is a presentation of the popover on its own element; without
// one there is nothing to present.
function injectSheetPopover(): CngxPopover {
  const popover = inject(CngxPopover, { self: true, optional: true });
  if (!popover) {
    throw new CngxRuntimeError(
      'CNGX1067',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngxPopoverSheet] must be placed on an element with [cngxPopover].',
    );
  }
  return popover;
}

// Once per sheet instance and per flag: a nameless modal sheet, and a popover
// mode that lets native light dismiss and Escape bypass closeRequested.
function warnSheetMisconfiguration(
  host: HTMLElement,
  unnamed: boolean,
  mode: string,
  warned: { title: boolean; mode: boolean },
): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  if (!warned.title && unnamed) {
    warned.title = true;
    cngxDevWarn(
      'CNGX1064',
      '[cngxPopoverSheet] opened as a modal sheet without a name. Add a ' +
        'cngxPopoverSheetTitle inside the panel or bind [labelledBy].',
      host,
    );
  }
  if (!warned.mode && mode !== 'manual') {
    warned.mode = true;
    cngxDevWarn(
      'CNGX1065',
      `[cngxPopoverSheet] needs mode="manual" on the popover, got "${mode}". ` +
        'Native light dismiss and Escape bypass closeRequested in that mode.',
      host,
    );
  }
}

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
 * `CngxPopoverSheetTitle`; focus moves into the panel inside `show()`, onto
 * the first enabled `CngxPopoverSheetInitialFocus` (a marked search input
 * focused there keeps the iOS keyboard of a tap open), Tab is trapped, every page
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
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-sheet.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPopover, CngxSwipeDismiss, CngxFocusTrap, createPinnedScrollLock, injectScopedLiveRegion
 * <example-url>http://localhost:4200/#/common/popover/sheet/bottom-sheet</example-url>
 * <example-url>http://localhost:4200/#/common/popover/sheet/fullscreen-search</example-url>
 */
@Directive({
  selector: '[cngxPopoverSheet]',
  exportAs: 'cngxPopoverSheet',
  standalone: true,
  hostDirectives: [{ directive: CngxFocusTrap, inputs: [], outputs: [] }],
  providers: [
    { provide: CNGX_POPOVER_PRESENTATION, useExisting: CngxPopoverSheet },
    { provide: CNGX_POPOVER_SHEET_HOST, useExisting: CngxPopoverSheet },
    { provide: CNGX_FOCUS_TRAP_DRIVER, useExisting: CngxPopoverSheet },
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
export class CngxPopoverSheet
  implements CngxPopoverPresentationSeam, CngxPopoverSheetPartsHost, CngxFocusTrapDriver
{
  private readonly popover = injectSheetPopover();
  private readonly trap = inject(CngxFocusTrap, { self: true });
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
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

  private readonly breakpoint = inject(CNGX_POPOVER_SHEET_BREAKPOINT);

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

  /** @internal Drives the composed `CngxFocusTrap`: Tab stays inside while modal and visible. */
  readonly focusTrapEnabled = computed(() => this.modal() && this.popover.isVisible());
  /** @internal The sheet moves focus itself, inside `show()`. */
  readonly focusTrapAutoFocus = false;

  /** @internal */
  readonly titleRegistry = createSlotRegistry<CngxPopoverSheetTitleHandle>();
  /** @internal */
  readonly initialFocusRegistry = createKeyedRegistry<CngxPopoverSheetFocusHandle>({
    name: 'CngxPopoverSheet',
  });

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

  private readonly region = injectScopedLiveRegion(this.host);

  private engaged = false;
  private savedFocus: HTMLElement | null = null;
  private inerted: HTMLElement[] = [];
  // Own host and ancestors an earlier sheet made inert, lifted while this
  // sheet is engaged so it stays reachable.
  private lifted: HTMLElement[] = [];
  private releaseLock: (() => void) | null = null;
  private settlingFrame: number | null = null;
  private readonly devWarned = { title: false, mode: false };
  private closeWatcher: CloseWatcherLike | null = null;

  // Capture phase: the tap must be seen before anything under it reacts.
  // The page siblings are inert, so a tap outside the panel lands on a
  // non-inert ancestor; the popover ::backdrop does not catch taps on iOS
  // or Android.
  private readonly outsidePointerDown = (event: PointerEvent): void => {
    this.disarmClickSwallow();
    if (engagedSheets.at(-1) !== this) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && this.host.contains(target)) {
      return;
    }
    this.armClickSwallow();
    this.requestClose('backdrop');
  };

  // Closing on pointerdown releases inert before the gesture's click lands,
  // so that click would hit the page element under the tap. Swallow the
  // one click that belongs to this gesture; the next pointerdown or a short
  // timeout disarms it, so a later tap is never eaten.
  private clickSwallowTimer: ReturnType<typeof setTimeout> | null = null;

  // Chromium also turns an unhandled Escape keydown into a CloseWatcher close
  // request. Escape belongs to CngxPopover (gated by closeOnEscape, topmost
  // popover only), so a watcher close that comes from the same keypress is
  // not a back gesture. The flag lives for the keydown task only.
  private escapeKeyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly escapeKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    if (this.escapeKeyTimer !== null) {
      clearTimeout(this.escapeKeyTimer);
    }
    this.escapeKeyTimer = setTimeout(() => {
      this.escapeKeyTimer = null;
    });
  };
  private readonly swallowClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.disarmClickSwallow();
  };

  constructor() {
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
          const opener = this.savedFocus;
          this.release();
          if (this.popover.isVisible()) {
            this.rehomeFocusAfterFlip(opener);
          }
        }
      });
    });

    // Destroyed while open: the host leaves the DOM, so focus would drop to
    // body. Restore it like a close, without emitting from a dying directive.
    inject(DestroyRef).onDestroy(() => {
      this.disengage(false);
      this.release();
      this.disarmClickSwallow();
    });
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
    this.disengage(true);
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
   * Move focus to the first enabled `CngxPopoverSheetInitialFocus` in
   * document order, else the first tabbable element, else the host. Runs on
   * every modal open.
   */
  focusInitial(): void {
    const target = this.initialFocusTarget();
    if (target) {
      target.focus();
      return;
    }
    if (!this.trap.focusFirstNow()) {
      this.host.focus();
    }
  }

  private initialFocusTarget(): HTMLElement | null {
    let first: HTMLElement | null = null;
    for (const handle of this.initialFocusRegistry.values()) {
      const enabled = handle.enabled?.() ?? true;
      const precedes =
        first === null ||
        (first.compareDocumentPosition(handle.element) & first.DOCUMENT_POSITION_PRECEDING) !== 0;
      if (enabled && precedes) {
        first = handle.element;
      }
    }
    return first;
  }

  protected handleBeforeToggle(event: ToggleEvent): void {
    // Native close paths (light dismiss, a direct hidePopover()) skip hide()
    // but owe the same page release and focus return.
    if (event.newState === 'closed') {
      this.disengage(true);
    }
  }

  // Close order: page live again, pending messages handed over, consumers
  // told, focus back on the opener, lock released. Idempotent through
  // `engaged`.
  private disengage(emitClosing: boolean): void {
    if (!this.engaged) {
      return;
    }
    this.restoreInert();
    this.handOffPendingAnnouncements();
    if (emitClosing) {
      this.closing.emit();
    }
    // On body counts as lost: CngxPopover's own teardown blurs the panel
    // before this one runs when both are destroyed together.
    const active = this.doc.activeElement;
    const focusLost = !active || active === this.doc.body || this.host.contains(active);
    if (this.restoreFocus() && focusLost) {
      this.focusFirstTaker([this.restoreTarget(), this.savedFocus, this.focusableAnchor()]);
    }
    this.release();
  }

  // Open order: focus, then inert, then lock. Focus first so the move
  // happens while the trigger is still focusable and inside the opening
  // gesture; inert after so the page never holds focus under inert.
  private engage(moveFocus: boolean): void {
    if (this.engaged) {
      return;
    }
    this.engaged = true;
    engagedSheets.push(this);
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      warnSheetMisconfiguration(
        this.host,
        !this.labelledBy() && !this.titleRegistry.current(),
        this.popover.mode(),
        this.devWarned,
      );
    }
    this.savedFocus = this.openerToRestore();
    this.region.ensure();
    this.liftOwnInert();
    if (moveFocus) {
      this.focusInitial();
    }
    this.applyInert();
    this.releaseLock = createPinnedScrollLock(this.doc.documentElement);
    this.startSettling();
    this.doc.addEventListener('pointerdown', this.outsidePointerDown, true);
    this.doc.addEventListener('keydown', this.escapeKeydown, true);
    this.armCloseWatcher();
  }

  // A flip back to anchored while open strips the modal focus targets (the
  // listbox loses its tabindex), so focus would drop to body. Independent of
  // `restoreFocus`, which governs a close, not a flip.
  private rehomeFocusAfterFlip(opener: HTMLElement | null): void {
    afterNextRender(
      () => {
        const active = this.doc.activeElement;
        const lost = !active || active === this.doc.body || this.host.contains(active);
        if (lost) {
          this.focusFirstTaker([this.focusableAnchor(), opener]);
        }
      },
      { injector: this.injector },
    );
  }

  // A target can refuse focus: the opener of a sheet chain sits inside the
  // sheet the exclusive eviction just hid. Take the first one that holds it.
  private focusFirstTaker(candidates: readonly (HTMLElement | null | undefined)[]): void {
    for (const target of candidates) {
      if (!target?.isConnected) {
        continue;
      }
      target.focus();
      if (this.doc.activeElement === target) {
        return;
      }
    }
  }

  private focusableAnchor(): HTMLElement | null {
    const anchor = this.popover.anchorElement();
    return anchor && anchor.tabIndex >= 0 ? anchor : null;
  }

  // iOS Safari does not focus a button on tap (with or without VoiceOver),
  // so the pre-open snapshot is often body. Fall back to the popover's
  // anchor when it can take focus, so the close lands back on the opener.
  private openerToRestore(): HTMLElement | null {
    const origin = this.popover.focusOrigin();
    if (origin && origin !== this.doc.body) {
      return origin;
    }
    return this.focusableAnchor();
  }

  // Idempotent: hide(), the native toggle, a flip back to anchored and
  // destroy can all reach it. A flip back to anchored skips disengage(), so
  // the pending hand-off runs here too before the scoped regions go; the next
  // engage() recreates them.
  private release(): void {
    this.doc.removeEventListener('pointerdown', this.outsidePointerDown, true);
    this.doc.removeEventListener('keydown', this.escapeKeydown, true);
    if (this.escapeKeyTimer !== null) {
      clearTimeout(this.escapeKeyTimer);
      this.escapeKeyTimer = null;
    }
    this.disarmCloseWatcher();
    this.restoreInert();
    this.releaseLock?.();
    this.releaseLock = null;
    this.stopSettling();
    this.handOffPendingAnnouncements();
    this.region.destroy();
    this.engaged = false;
    this.savedFocus = null;
    const index = engagedSheets.indexOf(this);
    if (index !== -1) {
      engagedSheets.splice(index, 1);
    }
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
      if (this.escapeKeyTimer !== null) {
        if (this.engaged) {
          this.armCloseWatcher();
        }
        return;
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

  private armClickSwallow(): void {
    this.doc.addEventListener('click', this.swallowClick, true);
    this.clickSwallowTimer = setTimeout(() => this.disarmClickSwallow(), CLICK_SWALLOW_MS);
  }

  private disarmClickSwallow(): void {
    this.doc.removeEventListener('click', this.swallowClick, true);
    if (this.clickSwallowTimer !== null) {
      clearTimeout(this.clickSwallowTimer);
      this.clickSwallowTimer = null;
    }
  }

  private disarmCloseWatcher(): void {
    const watcher = this.closeWatcher;
    this.closeWatcher = null;
    watcher?.destroy();
  }

  private liftOwnInert(): void {
    let node: HTMLElement | null = this.host;
    while (node && node !== this.doc.body) {
      if ((inertClaims.get(node) ?? 0) > 0 && node.hasAttribute('inert')) {
        node.removeAttribute('inert');
        this.lifted.push(node);
      }
      node = node.parentElement;
    }
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
        inertClaims.set(sibling, (inertClaims.get(sibling) ?? 0) + 1);
        sibling.setAttribute('inert', '');
        this.inerted.push(sibling);
      }
      node = parent;
    }
  }

  private skipsInert(el: HTMLElement): boolean {
    const preExisting = el.hasAttribute('inert') && !inertClaims.get(el);
    return (
      preExisting ||
      el.classList.contains(FOCUS_TRAP_ANCHOR_CLASS) ||
      el.matches(LIVE_REGION_SELECTOR)
    );
  }

  private restoreInert(): void {
    for (const el of this.inerted) {
      const claims = (inertClaims.get(el) ?? 1) - 1;
      if (claims > 0) {
        inertClaims.set(el, claims);
        continue;
      }
      inertClaims.delete(el);
      el.removeAttribute('inert');
    }
    this.inerted = [];
    for (const el of this.lifted) {
      if ((inertClaims.get(el) ?? 0) > 0) {
        el.setAttribute('inert', '');
      }
    }
    this.lifted = [];
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
}
