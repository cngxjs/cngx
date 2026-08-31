import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
  signal,
  untracked,
} from '@angular/core';

import { CngxReducedMotion } from '@cngx/common/a11y';
import { injectDirection } from '@cngx/core';
import { nextUid } from '@cngx/core/utils';

import {
  ANCHOR_AREA_PROPERTY,
  POSITION_AREA,
  resolveDirectionalPlacement,
  resolveFloatingPlacement,
  SUPPORTS_ANCHOR,
} from './anchor-positioning';
import {
  CNGX_FLOATING_FALLBACK,
  createFloatingPositioner,
  FLOATING_PLACEMENT,
} from './floating-fallback';
import type {
  PopoverPlacement,
  PopoverPositionTryFallback,
  PopoverState,
  TooltipTriggerMode,
} from './popover.types';

/** @internal Small debounce to prevent SR announcement storms during rapid Tab navigation. */
const FOCUS_DEBOUNCE_MS = 50;

/**
 * String-input tooltip directive applied to the trigger element.
 *
 * Creates the tooltip popover element internally via `Renderer2` and manages
 * the full lifecycle: hover/focus triggers, open/close delays, Escape dismiss,
 * CSS Anchor Positioning, and ARIA wiring (`aria-describedby` + `role="tooltip"`).
 *
 * The consumer sees only the attribute - no extra elements in the template.
 *
 * ### Basic
 * ```html
 * <button cngxTooltip="Ctrl+S">Save</button>
 * ```
 *
 * ### With configuration
 * ```html
 * <button cngxTooltip="Ctrl+S" tooltipPlacement="top" [tooltipDelay]="500">
 *   Save
 * </button>
 * ```
 *
 * @category common/popover
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/tooltip.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPopover, CngxPopoverTrigger
 * <example-url>http://localhost:4200/#/common/popover/tooltip/basic-tooltip</example-url>
 * <example-url>http://localhost:4200/#/common/popover/tooltip/custom-delay</example-url>
 * <example-url>http://localhost:4200/#/common/popover/tooltip/disabled-state</example-url>
 * <example-url>http://localhost:4200/#/common/popover/tooltip/keyboard-navigation</example-url>
 * <example-url>http://localhost:4200/#/common/popover/tooltip/placement</example-url>
 * <example-url>http://localhost:4200/#/common/popover/tooltip/programmatic-control</example-url>
 */
@Directive({
  selector: '[cngxTooltip]',
  exportAs: 'cngxTooltip',
  standalone: true,
  hostDirectives: [CngxReducedMotion],
  host: {
    '[attr.aria-describedby]': 'ariaDescribedBy()',
    '[style.anchor-name]': 'cssAnchorName()',
    '(mouseenter)': 'handleMouseEnter()',
    '(mouseleave)': 'handleMouseLeave()',
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
  },
})
export class CngxTooltip {
  private readonly renderer = inject(Renderer2);
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly floatingFallback = inject(CNGX_FLOATING_FALLBACK, { optional: true });
  private readonly direction = injectDirection();

  /** Tooltip text content. */
  readonly text = input.required<string>({ alias: 'cngxTooltip' });

  /** Anchor-relative placement. */
  readonly placement = input<PopoverPlacement>('top', { alias: 'tooltipPlacement' });

  /**
   * @internal
   * `placement` fully mirrored against the ambient writing direction, for the
   * CSS-anchor path (`POSITION_AREA`, physical keywords, no direction
   * awareness).
   */
  private readonly directionalPlacement = computed(() =>
    resolveDirectionalPlacement(this.placement(), this.direction()),
  );

  /**
   * @internal
   * `placement` mirrored side-only, for the floating-ui fallback path.
   * `@floating-ui/dom` flips the inline alignment of vertical placements under
   * `rtl` itself, so a full mirror would double-flip `top-start` / `bottom-end`
   * here. This path mirrors the side and defers alignment to floating-ui.
   */
  private readonly floatingPlacement = computed(() =>
    resolveFloatingPlacement(this.placement(), this.direction()),
  );

  /** Gap between trigger and tooltip in px. */
  readonly offset = input(8, { alias: 'tooltipOffset' });

  /** Delay in ms before opening on mouseenter. */
  readonly openDelay = input(300, { alias: 'tooltipDelay' });

  /** Delay in ms before closing on mouseleave. */
  readonly closeDelay = input(100);

  /** Whether the tooltip is active. When `false`, no tooltip appears and ARIA is cleared. */
  readonly enabled = input(true);

  /**
   * Trigger mode. `'auto'` (default) opens on hover/focus with the
   * configured delays; `'manual'` opts the host out of the hover/focus
   * listeners so only `show()` / `hide()` open or close the tooltip.
   * Escape still dismisses an open tooltip in either mode.
   */
  readonly triggers = input<TooltipTriggerMode>('auto');

  /**
   * CSS `<try-tactic>` fallbacks for `position-try-fallbacks`. Empty array
   * (default) means no fallback CSS is written; the tooltip stays at the
   * declared `tooltipPlacement` regardless of viewport clipping. Tooltips
   * are decorative - collision recovery is opt-in per-tooltip.
   */
  readonly positionTryFallbacks = input<readonly PopoverPositionTryFallback[]>([], {
    alias: 'tooltipPositionTryFallbacks',
  });

  private readonly stateSignal = signal<PopoverState>('closed');
  private readonly idSignal = signal(nextUid('cngx-tooltip'));

  /** Current lifecycle state. */
  readonly state = this.stateSignal.asReadonly();

  private tooltipEl: HTMLElement | null = null;
  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly ariaDescribedBy = computed(() => (this.enabled() ? this.idSignal() : null));

  protected readonly cssAnchorName = computed(() =>
    SUPPORTS_ANCHOR ? `--cngx-tip-${this.idSignal()}` : null,
  );

  constructor() {
    this.createTooltipElement();

    effect(() => {
      const text = this.text();
      const el = untracked(() => this.tooltipEl);
      if (el) {
        el.textContent = text;
      }
    });

    effect(() => {
      const placement = this.directionalPlacement();
      const offset = this.offset();
      const el = untracked(() => this.tooltipEl);
      if (!el) {
        return;
      }

      if (SUPPORTS_ANCHOR) {
        el.style.setProperty('position-anchor', `--cngx-tip-${this.idSignal()}`);
        el.style.setProperty(ANCHOR_AREA_PROPERTY, POSITION_AREA[placement]);
        el.style.setProperty('margin', `${offset}px`);
      }
    });

    // position-try-fallbacks is written unconditionally - unsupported
    // browsers ignore the unknown property, and the write keeps a uniform
    // test surface across jsdom + real browsers.
    effect(() => {
      const fallbacks = this.positionTryFallbacks();
      const el = untracked(() => this.tooltipEl);
      if (!el) {
        return;
      }
      if (fallbacks.length > 0) {
        el.style.setProperty('position-try-fallbacks', fallbacks.join(', '));
      } else {
        el.style.removeProperty('position-try-fallbacks');
      }
    });

    effect(() => {
      const enabled = this.enabled();
      if (!enabled) {
        const current = untracked(() => this.stateSignal());
        if (current !== 'closed') {
          this.hide();
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearTimers();
      this.floatingPositioner?.stop();
      this.elRef.nativeElement.ownerDocument.removeEventListener(
        'keydown',
        this.handleDocumentEscape,
        true,
      );
      this.tooltipEl?.remove();
    });
  }

  /** Show the tooltip immediately (bypassing delay). */
  show(): void {
    if (!this.enabled() || this.stateSignal() !== 'closed') {
      return;
    }
    this.stateSignal.set('opening');
    // The element ships aria-hidden while closed; an open tooltip must be
    // exposed - it is the live target of the trigger's aria-describedby.
    this.tooltipEl!.removeAttribute('aria-hidden');
    this.tooltipEl!.showPopover();
    this.elRef.nativeElement.ownerDocument.addEventListener(
      'keydown',
      this.handleDocumentEscape,
      true,
    );
    this.applyFloatingPosition();
    requestAnimationFrame(() => {
      if (this.stateSignal() === 'opening') {
        this.stateSignal.set('open');
      }
    });
  }

  /** Hide the tooltip immediately (bypassing delay). */
  hide(): void {
    if (this.stateSignal() === 'closed' || this.stateSignal() === 'closing') {
      return;
    }
    this.clearTimers();
    this.finalize();
  }

  protected handleMouseEnter(): void {
    if (this.triggers() !== 'auto' || !this.enabled()) {
      return;
    }
    this.clearCloseTimer();
    const delay = this.openDelay();
    if (delay > 0) {
      this.openTimer = setTimeout(() => this.show(), delay);
    } else {
      this.show();
    }
  }

  protected handleMouseLeave(): void {
    if (this.triggers() !== 'auto') {
      return;
    }
    this.clearOpenTimer();
    const delay = this.closeDelay();
    if (delay > 0) {
      this.closeTimer = setTimeout(() => this.hide(), delay);
    } else {
      this.hide();
    }
  }

  protected handleFocus(): void {
    if (this.triggers() !== 'auto' || !this.enabled()) {
      return;
    }
    // Debounce prevents SR announcement storm when user rapidly Tabs
    // through a toolbar of tooltipped buttons.
    this.clearTimers();
    this.openTimer = setTimeout(() => this.show(), FOCUS_DEBOUNCE_MS);
  }

  protected handleBlur(): void {
    if (this.triggers() !== 'auto') {
      return;
    }
    this.clearTimers();
    this.hide();
  }

  /**
   * Document-level Escape while open (capture phase). A hover-opened tooltip
   * has no focus relationship with its trigger, so a host keydown binding
   * never fires - WCAG 1.4.13 requires Escape to dismiss regardless of where
   * the keyboard focus sits. stopPropagation keeps parent overlays (dialog,
   * popover) open: Escape dismisses the innermost surface only.
   */
  private readonly handleDocumentEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || this.stateSignal() === 'closed') {
      return;
    }
    event.stopPropagation();
    this.hide();
  };

  /**
   * Shared fallback engine (same as `CngxPopover`) - offset middleware,
   * scroll/resize re-run while open, state-guarded writes. First step of
   * folding the tooltip onto the popover state machine. `null` when no
   * fallback is provided.
   */
  private readonly floatingPositioner = this.floatingFallback
    ? createFloatingPositioner({
        fallback: this.floatingFallback,
        getAnchor: () => this.elRef.nativeElement,
        getElement: () => this.tooltipEl,
        getPlacement: () => FLOATING_PLACEMENT[this.floatingPlacement()],
        getOffset: () => this.offset(),
        isOpen: () => this.stateSignal() !== 'closed',
      })
    : null;

  private applyFloatingPosition(): void {
    if (SUPPORTS_ANCHOR || !this.floatingPositioner) {
      return;
    }
    this.floatingPositioner.start();
  }

  private createTooltipElement(): void {
    const el = this.renderer.createElement('div') as HTMLElement;
    el.setAttribute('popover', 'manual');
    el.setAttribute('role', 'tooltip');
    el.id = this.idSignal();
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('cngx-tooltip');

    const trigger = this.elRef.nativeElement;
    if (trigger.parentElement) {
      this.renderer.insertBefore(trigger.parentElement, el, trigger.nextSibling);
    } else {
      // A parentless trigger cannot host the tooltip inside itself: void and
      // replaced elements drop the child silently. The tooltip renders in the
      // top layer anyway, so body is the correct fallback host.
      this.renderer.appendChild(trigger.ownerDocument.body, el);
    }

    this.tooltipEl = el;
  }

  private finalize(): void {
    this.floatingPositioner?.stop();
    this.elRef.nativeElement.ownerDocument.removeEventListener(
      'keydown',
      this.handleDocumentEscape,
      true,
    );
    if (this.tooltipEl) {
      try {
        this.tooltipEl.hidePopover();
      } catch {
        // May already be hidden or disconnected
      }
      this.tooltipEl.setAttribute('aria-hidden', 'true');
    }
    this.stateSignal.set('closed');
  }

  private clearTimers(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
  }

  private clearOpenTimer(): void {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
