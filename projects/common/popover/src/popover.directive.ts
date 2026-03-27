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
import type { PopoverMode, PopoverPlacement, PopoverState } from './popover.types';

/** Module-level registry of open popovers (insertion-ordered). */
const openPopovers = new Set<CngxPopover>();

/** Single document-level Escape listener shared by all popover instances. */
let escapeListenerInstalled = false;
function installGlobalEscapeListener(doc: Document): void {
  if (escapeListenerInstalled) {
    return;
  }
  escapeListenerInstalled = true;
  doc.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || openPopovers.size === 0) {
      return;
    }
    // Route to the most recently opened (last in Set iteration order)
    let last: CngxPopover | undefined;
    for (const p of openPopovers) {
      last = p;
    }
    if (last?.closeOnEscape()) {
      e.stopPropagation();
      last.hide();
    }
  });
}

/** Warns once when the Popover API is missing. */
let popoverApiWarned = false;
function warnMissingPopoverApi(el: HTMLElement): void {
  if (popoverApiWarned || !isDevMode()) {
    return;
  }
  if (typeof el.showPopover !== 'function') {
    popoverApiWarned = true;
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
 * @usageNotes
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
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly floatingFallback = inject(CNGX_FLOATING_FALLBACK, { optional: true });

  // ── Inputs ────────────────────────────────────────────────────────

  /** Anchor-relative placement. */
  readonly placement = input<PopoverPlacement>('bottom');

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

  // ── State ─────────────────────────────────────────────────────────

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

  // ── Computed (protected — for host bindings) ──────────────────────

  protected readonly isOpening = computed(() => this.stateSignal() === 'opening');
  protected readonly isOpen = computed(() => this.stateSignal() === 'open');
  protected readonly isClosing = computed(() => this.stateSignal() === 'closing');
  readonly isVisible = computed(() => this.stateSignal() !== 'closed');

  protected readonly cssAnchorRef = computed(() =>
    SUPPORTS_ANCHOR ? `--cngx-pop-${this.idSignal()}` : null,
  );

  protected readonly cssMargin = computed(() => (SUPPORTS_ANCHOR ? `${this.offset()}px` : null));

  constructor() {
    // Sync position-area / inset-area using the correct property name for this browser.
    // Cannot use a host binding because the CSS property name is dynamic.
    if (SUPPORTS_ANCHOR) {
      effect(() => {
        this.elRef.nativeElement.style.setProperty(
          ANCHOR_AREA_PROPERTY,
          POSITION_AREA[this.placement()],
        );
      });
    }
    // Controlled open: react to input changes
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

  // ── Public API ────────────────────────────────────────────────────

  /** Open the popover. No-op if not `closed`. */
  show(): void {
    warnMissingPopoverApi(this.elRef.nativeElement);
    if (this.stateSignal() !== 'closed') {
      return;
    }
    // Close other open popovers when exclusive (default)
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

  // ── Event handlers ────────────────────────────────────────────────

  protected handleToggle(e: ToggleEvent): void {
    // Sync with browser when it closes the popover (e.g. popover="auto" light dismiss)
    if (e.newState === 'closed' && this.stateSignal() !== 'closed') {
      this.stateSignal.set('closed');
    }
  }

  // ── Private ───────────────────────────────────────────────────────

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

    // Build middleware: prepend offset if not already in the consumer's list
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
