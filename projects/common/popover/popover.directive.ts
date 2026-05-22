import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  signal,
  untracked,
} from '@angular/core';

import { hasTransition, nextUid, onTransitionDone } from '@cngx/core/utils';

import { ANCHOR_AREA_PROPERTY, POSITION_AREA, SUPPORTS_ANCHOR } from './anchor-positioning';
import { CNGX_FLOATING_FALLBACK, FLOATING_PLACEMENT } from './floating-fallback';
import type {
  PopoverMode,
  PopoverPlacement,
  PopoverPositionTryFallback,
  PopoverState,
} from './popover.types';

/** Module-level registry of open popovers (insertion-ordered). */
const openPopovers = new Set<CngxPopover>();

/** Tracks which Documents already have the global Escape listener. */
const escapeListenerDocs = new WeakSet<Document>();
function installGlobalEscapeListener(doc: Document): void {
  if (escapeListenerDocs.has(doc)) {
    return;
  }
  escapeListenerDocs.add(doc);
  doc.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || openPopovers.size === 0) {
      return;
    }
    // Route to the most recently opened (last in Set iteration order)
    const last = [...openPopovers].at(-1);
    if (last?.closeOnEscape()) {
      e.stopPropagation();
      last.hide();
    }
  });
}

/** Tracks which Documents have already warned about missing Popover API. */
const popoverApiWarnedDocs = new WeakSet<Document>();
function warnMissingPopoverApi(el: HTMLElement): void {
  const doc = el.ownerDocument;
  if (popoverApiWarnedDocs.has(doc) || !isDevMode()) {
    return;
  }
  if (typeof el.showPopover !== 'function') {
    popoverApiWarnedDocs.add(doc);
    console.warn(
      'CngxPopover: The native Popover API is not supported in this browser. ' +
        'Install @oddbird/popover-polyfill and import it in your polyfills:\n\n' +
        '  npm install @oddbird/popover-polyfill\n' +
        '  // polyfills.ts\n' +
        "  import '@oddbird/popover-polyfill';\n",
    );
  }
}

/**
 * Signal-driven state machine for the native Popover API.
 *
 * Wraps the browser's `popover` attribute with reactive state,
 * CSS-transition-aware lifecycle, and CSS Anchor Positioning.
 * Pure state machine — contains no trigger logic, no delays.
 *
 * State lifecycle: `closed` → `opening` → `open` → `closing` → `closed`.
 * CSS classes `cngx-popover--opening`, `cngx-popover--open`, and
 * `cngx-popover--closing` are applied to the host for transition hooks.
 *
 * ### Declarative click popover
 * ```html
 * <button [cngxPopoverTrigger]="pop" (click)="pop.toggle()">Menu</button>
 * <div cngxPopover #pop="cngxPopover" placement="bottom-start">
 *   <menu><li>Edit</li><li>Delete</li></menu>
 * </div>
 * ```
 *
 * ### Controlled open state
 * ```html
 * <div cngxPopover [cngxPopoverOpen]="showErrors()" role="alert">
 *   {{ errorSummary() }}
 * </div>
 * ```
 * <example-url>http://localhost:4200/#/common/interactive/listbox-trigger/select-dropdown</example-url>
 * <example-url>http://localhost:4200/#/common/popover/click-popover</example-url>
 * <example-url>http://localhost:4200/#/common/popover/controlled-open</example-url>
 * <example-url>http://localhost:4200/#/common/popover/escape-mode</example-url>
 * <example-url>http://localhost:4200/#/common/popover/placement-variants</example-url>
 *
 * ### Collision recovery with `<try-tactic>` fallbacks
 * Apply CSS Anchor Positioning's `position-try-fallbacks` declaratively
 * by binding the new `positionTryFallbacks` input. Each entry is a CSS
 * `<try-tactic>` keyword (or composed pair) written verbatim into the
 * host's `position-try-fallbacks` property. Mirrors the precedent in
 * `@cngx/forms/select` panels.
 *
 * ```html
 * <div cngxPopover
 *      placement="right-start"
 *      [positionTryFallbacks]="['flip-inline', 'flip-block', 'flip-block flip-inline']">
 *   <!-- popover content -->
 * </div>
 * ```
 *
 * When the array is empty (default), the host does not write a
 * `position-try-fallbacks` style — the browser positions the popover at
 * the declared `placement` regardless of viewport clipping.
 */
@Directive({
  selector: '[cngxPopover]',
  exportAs: 'cngxPopover',
  standalone: true,
  host: {
    '[attr.popover]': 'mode()',
    '[id]': 'id()',
    '[attr.aria-hidden]': '!isVisible()',
    '[class.cngx-popover--opening]': 'isOpening()',
    '[class.cngx-popover--open]': 'isOpen()',
    '[class.cngx-popover--closing]': 'isClosing()',
    '[style.position-anchor]': 'cssAnchorRef()',
    '[style.margin]': 'cssMargin()',
    '(toggle)': 'handleToggle($event)',
  },
})
export class CngxPopover {
  /**
   * Host ElementRef. Public for consumers that need to pass the
   * popover's native element to APIs expecting an `ElementRef`
   * (scroll observers, intersection observers, focus managers, …).
   * Notable consumer: `injectRecycler({ scrollElement: pop.elementRef })`
   * for `@cngx/forms/select` virtualisation — the popover IS the
   * scroll container when `select-base.css`'s `max-height + overflow-y`
   * rules apply.
   */
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly elRef = this.elementRef;
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly floatingFallback = inject(CNGX_FLOATING_FALLBACK, { optional: true });

  /** Anchor-relative placement. */
  readonly placement = input<PopoverPlacement>('bottom');

  /**
   * CSS `<try-tactic>` fallbacks for `position-try-fallbacks`. Empty
   * array (default) means the host does not write the property at all.
   * Non-empty entries are written verbatim, comma-joined, in declaration
   * order. Spec-compatible vocabulary only (no cngx placement tokens).
   */
  readonly positionTryFallbacks = input<readonly PopoverPositionTryFallback[]>([]);

  /** Gap between anchor and popover in px. */
  readonly offset = input(8);

  /** Whether Escape key dismisses the popover. */
  readonly closeOnEscape = input(true);

  /** Native popover mode. `'manual'` for full control, `'auto'` for browser light dismiss. */
  readonly mode = input<PopoverMode>('manual');

  /**
   * Controlled open state. When set, drives the popover reactively.
   * `undefined` = uncontrolled (default).
   */
  readonly controlledOpen = input<boolean | undefined>(undefined, {
    alias: 'cngxPopoverOpen',
  });

  /**
   * When `true` (default), opening this popover closes any other open
   * `CngxPopover` instance. Set to `false` to allow multiple popovers
   * open simultaneously.
   */
  readonly exclusive = input(true);

  private readonly stateSignal = signal<PopoverState>('closed');
  private readonly idSignal = signal(nextUid('cngx-popover'));

  /** Current lifecycle state. */
  readonly state = this.stateSignal.asReadonly();

  /** Unique auto-generated ID for this popover instance. */
  readonly id = this.idSignal.asReadonly();

  /**
   * The anchor element for Floating UI fallback positioning.
   * Set by `CngxPopoverTrigger` or `CngxTooltip`.
   */
  readonly anchorElement = signal<HTMLElement | null>(null);

  protected readonly isOpening = computed(() => this.stateSignal() === 'opening');
  protected readonly isOpen = computed(() => this.stateSignal() === 'open');
  protected readonly isClosing = computed(() => this.stateSignal() === 'closing');
  readonly isVisible = computed(() => this.stateSignal() !== 'closed');

  protected readonly cssAnchorRef = computed(() =>
    SUPPORTS_ANCHOR ? `--cngx-pop-${this.idSignal()}` : null,
  );

  protected readonly cssMargin = computed(() => (SUPPORTS_ANCHOR ? `${this.offset()}px` : null));

  constructor() {
    // Host binding needs a static property name; position-area/inset-area name flips per browser.
    if (SUPPORTS_ANCHOR) {
      effect(() => {
        const el = this.elRef.nativeElement;
        el.style.setProperty(ANCHOR_AREA_PROPERTY, POSITION_AREA[this.placement()]);
        const fallbacks = this.positionTryFallbacks();
        if (fallbacks.length > 0) {
          el.style.setProperty('position-try-fallbacks', fallbacks.join(', '));
        } else {
          el.style.removeProperty('position-try-fallbacks');
        }
      });
    }
    effect(() => {
      const desired = this.controlledOpen();
      if (desired === undefined) {
        return;
      }
      const current = untracked(() => this.stateSignal());
      if (desired && current === 'closed') {
        this.show();
      }
      if (!desired && (current === 'open' || current === 'opening')) {
        this.hide();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.stateSignal() !== 'closed') {
        this.finalize();
      }
    });
  }

  /** Open the popover. No-op if not `closed`. */
  show(): void {
    warnMissingPopoverApi(this.elRef.nativeElement);
    if (this.stateSignal() !== 'closed') {
      return;
    }
    if (this.exclusive()) {
      for (const other of openPopovers) {
        if (other !== this) {
          other.hide();
        }
      }
    }
    openPopovers.add(this);
    this.stateSignal.set('opening');
    this.elRef.nativeElement.showPopover();
    installGlobalEscapeListener(this.doc);
    this.applyFloatingPosition();
    requestAnimationFrame(() => {
      if (this.stateSignal() === 'opening') {
        this.stateSignal.set('open');
      }
    });
  }

  /** Close the popover. No-op if already `closed` or `closing`. */
  hide(): void {
    if (this.stateSignal() === 'closed' || this.stateSignal() === 'closing') {
      return;
    }
    this.startClosing();
  }

  /** Toggle between open and closed. */
  toggle(): void {
    if (this.stateSignal() === 'closed') {
      this.show();
    } else {
      this.hide();
    }
  }

  protected handleToggle(e: ToggleEvent): void {
    // Sync with browser when it closes the popover (e.g. popover="auto" light dismiss)
    if (e.newState === 'closed' && this.stateSignal() !== 'closed') {
      this.stateSignal.set('closed');
    }
  }

  /**
   * Apply Floating UI positioning when CSS Anchor is not supported
   * and the consumer has provided the fallback via `provideFloatingFallback()`.
   */
  private applyFloatingPosition(): void {
    if (SUPPORTS_ANCHOR || !this.floatingFallback) {
      return;
    }
    const anchor = this.anchorElement();
    if (!anchor) {
      return;
    }

    const fb = this.floatingFallback;
    const el = this.popoverElement;
    const placement = FLOATING_PLACEMENT[this.placement()];
    const offsetVal = this.offset();

    const middleware = fb.middleware ?? [];

    void fb.computePosition(anchor, el, { placement, middleware }).then(({ x, y }) => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.margin = `${offsetVal}px`;
    });
  }

  private get popoverElement(): HTMLElement {
    return this.elRef.nativeElement;
  }

  private startClosing(): void {
    if (hasTransition(this.popoverElement)) {
      this.stateSignal.set('closing');
      onTransitionDone(this.popoverElement, () => this.finalize());
    } else {
      this.finalize();
    }
  }

  private finalize(): void {
    openPopovers.delete(this);
    const el = this.popoverElement;
    try {
      el.hidePopover();
    } catch {
      // Element may already be hidden or disconnected
    }
    this.stateSignal.set('closed');
  }
}
