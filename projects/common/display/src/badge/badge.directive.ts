import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';

/** Color palette options for the badge. */
export type CngxBadgeColor = 'primary' | 'error' | 'warning' | 'neutral';

/** Positioning anchors relative to the host element. */
export type CngxBadgePosition =
  | 'inline'
  | 'above-start'
  | 'above-end'
  | 'below-start'
  | 'below-end';

/**
 * Generic counter / dot indicator that attaches a small floating element to
 * any host. Purely presentational (`aria-hidden="true"`) — semantic meaning
 * must live on the host (`aria-label`).
 *
 * Supports:
 * - Numeric values (capped by `max` with "N+" fallback)
 * - String values (rendered verbatim)
 * - Boolean `true` (dot mode, no text)
 *
 * @category display
 */
@Directive({
  selector: '[cngxBadge]',
  exportAs: 'cngxBadge',
  standalone: true,
  host: {
    '[class.cngx-badge-host]': 'true',
  },
})
export class CngxBadge {
  /** Raw value. Numbers show as text (respecting `max`); booleans flip dot mode; strings render verbatim. */
  readonly cngxBadge = input.required<number | string | boolean>();
  /** Color variant. */
  readonly color = input<CngxBadgeColor>('primary');
  /** Anchor position relative to the host. */
  readonly position = input<CngxBadgePosition>('above-end');
  /** Whether the indicator is hidden regardless of value. */
  readonly hidden = input<boolean>(false);
  /** Cap for numeric values — anything over renders as `"{max}+"`. */
  readonly max = input<number>(99);

  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private badgeEl: HTMLElement | null = null;

  /** Whether the badge shows as a solid dot (no text). */
  readonly isDotMode = computed<boolean>(() => this.cngxBadge() === true);

  /** Whether the badge is empty (no value, 0, empty string, or false). */
  readonly isEmpty = computed<boolean>(() => {
    const v = this.cngxBadge();
    if (typeof v === 'number') {
      return v === 0;
    }
    if (typeof v === 'boolean') {
      return v === false;
    }
    return v === '';
  });

  /** Displayed text, or `null` when in dot mode or empty. */
  readonly displayValue = computed<string | null>(() => {
    const v = this.cngxBadge();
    if (typeof v === 'boolean') {
      return null;
    }
    if (typeof v === 'number') {
      const m = this.max();
      return v > m ? `${m}+` : String(v);
    }
    return v;
  });

  constructor() {
    effect(() => {
      const shouldShow = !this.hidden() && (this.isDotMode() || !this.isEmpty());
      if (!shouldShow) {
        this.removeBadge();
        return;
      }
      this.ensureBadge();
      this.applyClasses();
      this.applyContent();
    });

    inject(DestroyRef).onDestroy(() => this.removeBadge());
  }

  private ensureBadge(): void {
    if (this.badgeEl) {
      return;
    }
    this.badgeEl = this.renderer.createElement('span') as HTMLElement;
    this.renderer.setAttribute(this.badgeEl, 'aria-hidden', 'true');
    this.renderer.addClass(this.badgeEl, 'cngx-badge-indicator');
    this.ensureHostPositioning();
    this.renderer.appendChild(this.hostEl.nativeElement, this.badgeEl);
  }

  private ensureHostPositioning(): void {
    const host = this.hostEl.nativeElement as HTMLElement;
    const pos = this.position();
    if (pos !== 'inline') {
      const current = getComputedStyle(host).position;
      if (current === 'static') {
        this.renderer.setStyle(host, 'position', 'relative');
      }
    }
  }

  private applyClasses(): void {
    if (!this.badgeEl) {
      return;
    }
    const COLORS: readonly CngxBadgeColor[] = ['primary', 'error', 'warning', 'neutral'];
    const POSITIONS: readonly CngxBadgePosition[] = [
      'inline',
      'above-start',
      'above-end',
      'below-start',
      'below-end',
    ];
    for (const c of COLORS) {
      this.renderer.removeClass(this.badgeEl, `cngx-badge-indicator--${c}`);
    }
    for (const p of POSITIONS) {
      this.renderer.removeClass(this.badgeEl, `cngx-badge-indicator--${p}`);
    }
    this.renderer.addClass(this.badgeEl, `cngx-badge-indicator--${this.color()}`);
    this.renderer.addClass(this.badgeEl, `cngx-badge-indicator--${this.position()}`);
    if (this.isDotMode()) {
      this.renderer.addClass(this.badgeEl, 'cngx-badge-indicator--dot');
    } else {
      this.renderer.removeClass(this.badgeEl, 'cngx-badge-indicator--dot');
    }
  }

  private applyContent(): void {
    if (!this.badgeEl) {
      return;
    }
    const value = this.displayValue();
    this.badgeEl.textContent = value ?? '';
  }

  private removeBadge(): void {
    if (this.badgeEl?.parentNode) {
      this.renderer.removeChild(this.badgeEl.parentNode, this.badgeEl);
    }
    this.badgeEl = null;
  }
}
