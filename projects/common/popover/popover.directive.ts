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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

import { hasTransition, nextUid, onTransitionDone } from '@cngx/core/utils';

import { ANCHOR_AREA_PROPERTY, POSITION_AREA, SUPPORTS_ANCHOR } from './anchor-positioning';
import { CNGX_FLOATING_FALLBACK, FLOATING_PLACEMENT } from './floating-fallback';
import type {
  PopoverHaspopup,
  PopoverMode,
  PopoverPlacement,
  PopoverPositionTryFallback,
  PopoverState,
} from './popover.types';

/** Module-level registry of open popovers (insertion-ordered). */
const openPopovers = new Set<CngxPopover>();

/** Primary axis edges the arrow can land on. */
type ArrowEdge = 'top' | 'bottom' | 'left' | 'right';

/**
 * Derive the panel's actual placement relative to the trigger from the live
 * rects. The arrow always sits on the panel edge that *faces* the trigger,
 * so a `position-try-fallbacks` flip (e.g. requested `bottom`, browser
 * resolved to `top` because there is no room below) routes the arrow to the
 * opposite edge without the consumer touching anything.
 *
 * Returns the requested placement's primary edge when the rects overlap —
 * the only case where no clean side is geometrically correct.
 */
function resolveActualEdge(trigger: DOMRect, panel: DOMRect, requested: PopoverPlacement): ArrowEdge {
  const tolerance = 4;
  if (panel.top >= trigger.bottom - tolerance) {
    return 'bottom';
  }
  if (panel.bottom <= trigger.top + tolerance) {
    return 'top';
  }
  if (panel.right <= trigger.left + tolerance) {
    return 'left';
  }
  if (panel.left >= trigger.right - tolerance) {
    return 'right';
  }
  return requested.split('-')[0] as ArrowEdge;
}

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

/** Tracks which Documents have already warned about missing Floating-UI middleware. */
const floatingMiddlewareWarnedDocs = new WeakSet<Document>();

/**
 * @internal — test hook. Resets the per-Document warning suppression so
 * specs can exercise the warning path against a shared jsdom Document.
 * Do not call from production code.
 */
export function __resetFloatingMiddlewareWarnings(doc: Document): void {
  floatingMiddlewareWarnedDocs.delete(doc);
}
function warnMissingFloatingMiddleware(doc: Document): void {
  if (floatingMiddlewareWarnedDocs.has(doc) || !isDevMode()) {
    return;
  }
  floatingMiddlewareWarnedDocs.add(doc);
  console.warn(
    'CngxPopover: provideFloatingFallback(computePosition) was registered without middleware. ' +
      'Popovers in browsers without CSS Anchor Positioning will clip against the viewport edge ' +
      'because no flip/shift recovery is configured. Pass middleware on registration:\n\n' +
      "  import { computePosition, flip, offset, shift } from '@floating-ui/dom';\n\n" +
      '  providers: [\n' +
      '    provideFloatingFallback(computePosition, [offset(8), flip(), shift()]),\n' +
      '  ],\n',
  );
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
 * <example-url>http://localhost:4200/#/common/interactive/listbox/trigger/select-dropdown</example-url>
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
    '[attr.data-arrow-placement]': 'resolvedEdge()',
    '[class.cngx-popover--opening]': 'isOpening()',
    '[class.cngx-popover--open]': 'isOpen()',
    '[class.cngx-popover--closing]': 'isClosing()',
    '[style.position-anchor]': 'cssAnchorRef()',
    '[style.position-try-fallbacks]': 'cssPositionTryFallbacks()',
    '[style.margin]': 'cssMargin()',
    '[style.--cngx-popover-arrow-offset]': 'arrowOffsetSignal()',
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

  /**
   * Inline-axis position the arrow ornament should sit at, expressed as
   * a CSS length pinned to the trigger's centre. Computed from
   * `anchorElement()` + the panel's own bounding box on every show /
   * reposition / window resize.
   *
   * Why a JS-computed CSS variable instead of `anchor(center)` in the
   * arrow's stylesheet: CSS Anchor Positioning's `anchor()` function does
   * not resolve from descendants of a top-layer element back to anchors
   * in the regular document flow. The panel itself can anchor to the
   * trigger, but the arrow inside the panel cannot. Writing the offset
   * from JS sidesteps that limitation and works identically in the
   * CSS-Anchor path and the Floating-UI fallback path.
   */
  protected readonly arrowOffsetSignal = signal<string | null>(null);

  /**
   * Hint for the `CngxPopoverTrigger`'s `aria-haspopup` value. Composers
   * such as `CngxPopoverPanel` write this signal so any trigger pointing
   * at the popover defaults to the right role without the consumer
   * having to set `haspopup` on every trigger element. Consumer-supplied
   * `haspopup` on the trigger still wins.
   */
  readonly haspopup = signal<PopoverHaspopup | undefined>(undefined);

  protected readonly isOpening = computed(() => this.stateSignal() === 'opening');
  protected readonly isOpen = computed(() => this.stateSignal() === 'open');
  protected readonly isClosing = computed(() => this.stateSignal() === 'closing');
  readonly isVisible = computed(() => this.stateSignal() !== 'closed');

  protected readonly cssAnchorRef = computed(() =>
    SUPPORTS_ANCHOR ? `--cngx-pop-${this.idSignal()}` : null,
  );

  /**
   * Primary edge of the placement, written from the live trigger and panel
   * rects so the arrow lands on the side that actually faces the trigger.
   * Falls back to the requested placement's edge before the first geometry
   * read so the arrow CSS rules still match on the very first paint.
   * Browsers normalise compound `position-area` values to a
   * non-deterministic keyword order; an explicit attribute is the stable
   * hook for the arrow stylesheet.
   */
  private readonly resolvedEdgeSignal = signal<ArrowEdge | null>(null);
  protected readonly resolvedEdge = computed<ArrowEdge>(
    () => this.resolvedEdgeSignal() ?? (this.placement().split('-')[0] as ArrowEdge),
  );

  protected readonly cssMargin = computed(() => (SUPPORTS_ANCHOR ? `${this.offset()}px` : null));

  /**
   * Comma-joined `position-try-fallbacks` value, or `null` to skip the
   * style write. Bound via host binding so empty / cleared lists drop the
   * property cleanly. Unsupported browsers ignore the unknown property —
   * gating on `SUPPORTS_ANCHOR` would only suppress a harmless write.
   */
  protected readonly cssPositionTryFallbacks = computed(() => {
    const list = this.positionTryFallbacks();
    return list.length > 0 ? list.join(', ') : null;
  });

  constructor() {
    // Host binding needs a static property name; position-area/inset-area name flips per browser.
    if (SUPPORTS_ANCHOR) {
      effect(() => {
        this.elRef.nativeElement.style.setProperty(
          ANCHOR_AREA_PROPERTY,
          POSITION_AREA[this.placement()],
        );
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

    // Recompute arrow offset on viewport resize while the popover is open.
    // takeUntilDestroyed handles teardown so finalize() does not need an
    // explicit removeEventListener pair.
    const view = this.doc.defaultView;
    if (view) {
      fromEvent(view, 'resize')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.stateSignal() !== 'closed') {
            this.updateArrowOffset();
          }
        });
    }
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
      // After layout settles the browser's anchor / shift recovery has
      // already placed the panel; reading its rect now reflects the
      // final position the arrow needs to point at.
      this.updateArrowOffset();
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
    if (middleware.length === 0) {
      warnMissingFloatingMiddleware(el.ownerDocument);
    }

    void fb.computePosition(anchor, el, { placement, middleware }).then(({ x, y }) => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.margin = `${offsetVal}px`;
      this.updateArrowOffset();
    });
  }

  /**
   * Recompute the arrow's edge and inline offset from the live trigger and
   * panel rects. The resolved edge captures any browser-driven flip; the
   * offset is clamped inside the panel's rounded-corner bounds so the
   * arrow's base stays flush with the panel's straight edge even when the
   * trigger sits outside the panel's inline extent.
   */
  private updateArrowOffset(): void {
    const anchor = this.anchorElement();
    if (!anchor) {
      this.arrowOffsetSignal.set(null);
      this.resolvedEdgeSignal.set(null);
      return;
    }
    const panel = this.elRef.nativeElement;
    const panelRect = panel.getBoundingClientRect();
    if (panelRect.width === 0 || panelRect.height === 0) {
      this.arrowOffsetSignal.set(null);
      this.resolvedEdgeSignal.set(null);
      return;
    }
    const triggerRect = anchor.getBoundingClientRect();
    const edge = resolveActualEdge(triggerRect, panelRect, this.placement());
    this.resolvedEdgeSignal.set(edge);
    const horizontal = edge === 'top' || edge === 'bottom';
    const triggerCentre = horizontal
      ? triggerRect.left + triggerRect.width / 2
      : triggerRect.top + triggerRect.height / 2;
    const panelStart = horizontal ? panelRect.left : panelRect.top;
    const panelDim = horizontal ? panelRect.width : panelRect.height;
    const radiusRaw = getComputedStyle(panel).getPropertyValue('--cngx-popover-panel-border-radius');
    const radius = Number.parseFloat(radiusRaw) || 12;
    const raw = triggerCentre - panelStart;
    const clamped = Math.max(radius, Math.min(raw, panelDim - radius));
    this.arrowOffsetSignal.set(`${clamped}px`);
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
    this.arrowOffsetSignal.set(null);
    this.resolvedEdgeSignal.set(null);
    const el = this.popoverElement;
    try {
      el.hidePopover();
    } catch {
      // Element may already be hidden or disconnected
    }
    this.stateSignal.set('closed');
  }
}
