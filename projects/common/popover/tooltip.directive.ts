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
import { nextUid } from '@cngx/core/utils';

import { ANCHOR_AREA_PROPERTY, POSITION_AREA, SUPPORTS_ANCHOR } from './anchor-positioning';
import { CNGX_FLOATING_FALLBACK, FLOATING_PLACEMENT } from './floating-fallback';
import type {
  PopoverPlacement,
  PopoverPositionTryFallback,
  PopoverState,
} from './popover.types';

/** Small debounce to prevent SR announcement storms during rapid Tab navigation. */
const FOCUS_DEBOUNCE_MS = 50;

/**
 * String-input tooltip directive applied to the trigger element.
 *
 * Creates the tooltip popover element internally via `Renderer2` and manages
 * the full lifecycle: hover/focus triggers, open/close delays, Escape dismiss,
 * CSS Anchor Positioning, and ARIA wiring (`aria-describedby` + `role="tooltip"`).
 *
 * The consumer sees only the attribute — no extra elements in the template.
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
    '(keydown.escape)': 'handleEscape($event)',
  },
})
export class CngxTooltip {
  private readonly renderer = inject(Renderer2);
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly floatingFallback = inject(CNGX_FLOATING_FALLBACK, { optional: true });

  /** Tooltip text content. */
  readonly text = input.required<string>({ alias: 'cngxTooltip' });

  /** Anchor-relative placement. */
  readonly placement = input<PopoverPlacement>('top', { alias: 'tooltipPlacement' });

  /** Gap between trigger and tooltip in px. */
  readonly offset = input(8, { alias: 'tooltipOffset' });

  /** Delay in ms before opening on mouseenter. */
  readonly openDelay = input(300, { alias: 'tooltipDelay' });

  /** Delay in ms before closing on mouseleave. */
  readonly closeDelay = input(100);

  /** Whether the tooltip is active. When `false`, no tooltip appears and ARIA is cleared. */
  readonly enabled = input(true);

  /**
   * CSS `<try-tactic>` fallbacks for `position-try-fallbacks`. Empty array
   * (default) means no fallback CSS is written; the tooltip stays at the
   * declared `tooltipPlacement` regardless of viewport clipping. Tooltips
   * are decorative — collision recovery is opt-in per-tooltip.
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
      const placement = this.placement();
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

    // position-try-fallbacks is written unconditionally — unsupported
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
      this.tooltipEl?.remove();
    });
  }

  /** Show the tooltip immediately (bypassing delay). */
  show(): void {
    if (!this.enabled() || this.stateSignal() !== 'closed') {
      return;
    }
    this.stateSignal.set('opening');
    this.tooltipEl!.showPopover();
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
    if (!this.enabled()) {
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
    this.clearOpenTimer();
    const delay = this.closeDelay();
    if (delay > 0) {
      this.closeTimer = setTimeout(() => this.hide(), delay);
    } else {
      this.hide();
    }
  }

  protected handleFocus(): void {
    if (!this.enabled()) {
      return;
    }
    // Debounce prevents SR announcement storm when user rapidly Tabs
    // through a toolbar of tooltipped buttons.
    this.clearTimers();
    this.openTimer = setTimeout(() => this.show(), FOCUS_DEBOUNCE_MS);
  }

  protected handleBlur(): void {
    this.clearTimers();
    this.hide();
  }

  protected handleEscape(event: Event): void {
    if (this.stateSignal() !== 'closed') {
      // Prevent Escape from bubbling to parent overlays (e.g. dialog)
      event.stopPropagation();
      this.hide();
    }
  }

  private applyFloatingPosition(): void {
    if (SUPPORTS_ANCHOR || !this.floatingFallback || !this.tooltipEl) {
      return;
    }

    const fb = this.floatingFallback;
    const trigger = this.elRef.nativeElement;
    const tooltip = this.tooltipEl;
    const placement = FLOATING_PLACEMENT[this.placement()];
    const middleware = fb.middleware ?? [];

    void fb.computePosition(trigger, tooltip, { placement, middleware }).then(({ x, y }) => {
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });
  }

  private createTooltipElement(): void {
    const el = this.renderer.createElement('div') as HTMLElement;
    el.setAttribute('popover', 'manual');
    el.setAttribute('role', 'tooltip');
    el.id = this.idSignal();
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('cngx-tooltip');

    // Insert as next sibling of the trigger for DOM proximity
    const trigger = this.elRef.nativeElement;
    if (trigger.parentElement) {
      this.renderer.insertBefore(trigger.parentElement, el, trigger.nextSibling);
    } else {
      this.renderer.appendChild(trigger, el);
    }

    this.tooltipEl = el;
  }

  private finalize(): void {
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
