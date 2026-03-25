import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';

/**
 * Touch/click ripple feedback without Material dependency.
 *
 * Creates a `<span class="cngx-ripple__wave">` on pointer contact, positions it
 * via CSS custom properties (`--cngx-ripple-x`, `--cngx-ripple-y`, `--cngx-ripple-size`),
 * and removes it after the animation completes. ALL visual treatment — color, duration,
 * shape — is the consumer's CSS responsibility.
 *
 * Ships a companion `_ripple.scss` with sensible defaults.
 *
 * @usageNotes
 *
 * ### Button with ripple
 * ```html
 * <button cngxRipple>Click me</button>
 * ```
 *
 * ### Centered ripple for icon buttons
 * ```html
 * <button cngxRipple [rippleCentered]="true" class="icon-btn">
 *   <mat-icon>favorite</mat-icon>
 * </button>
 * ```
 *
 * ### Disable ripple
 * ```html
 * <button cngxRipple [rippleDisabled]="isReducedMotion()">Click</button>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxRipple]',
  exportAs: 'cngxRipple',
  standalone: true,
  host: {
    '[style.position]': '"relative"',
    '[style.overflow]': '"hidden"',
    '(pointerdown)': 'handlePointerDown($event)',
  },
})
export class CngxRipple {
  /** Ripple color — passed as `--cngx-ripple-color` on the wave element. */
  readonly color = input<string>('currentColor', { alias: 'rippleColor' });
  /** Whether the ripple originates from the center of the host. */
  readonly centered = input<boolean>(false, { alias: 'rippleCentered' });
  /** Whether the ripple effect is disabled. */
  readonly disabled = input<boolean>(false, { alias: 'rippleDisabled' });

  private readonly activeState = signal(false);
  /** Whether a ripple animation is currently playing. */
  readonly active = this.activeState.asReadonly();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private prefersReducedMotion = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const win = this.doc.defaultView;

    // Detect reduced motion preference (matchMedia may not exist in test/SSR)
    if (win?.matchMedia) {
      const mql = win.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mql.matches;
      const handler = (e: MediaQueryListEvent) => (this.prefersReducedMotion = e.matches);
      mql.addEventListener('change', handler);
      destroyRef.onDestroy(() => mql.removeEventListener('change', handler));
    }
  }

  /** @internal */
  protected handlePointerDown(event: PointerEvent): void {
    if (this.disabled() || this.prefersReducedMotion) {
      return;
    }

    const host = this.el.nativeElement as HTMLElement;
    const rect = host.getBoundingClientRect();

    // Calculate ripple origin — centered or from pointer position
    let x: number;
    let y: number;
    if (this.centered()) {
      x = rect.width / 2;
      y = rect.height / 2;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    // Ripple size = diameter of circle that covers the entire host from the origin point
    const size =
      Math.max(
        Math.hypot(x, y),
        Math.hypot(rect.width - x, y),
        Math.hypot(x, rect.height - y),
        Math.hypot(rect.width - x, rect.height - y),
      ) * 2;

    // Create wave element
    const wave = this.doc.createElement('span');
    wave.className = 'cngx-ripple__wave';
    wave.style.setProperty('--cngx-ripple-x', `${x}px`);
    wave.style.setProperty('--cngx-ripple-y', `${y}px`);
    wave.style.setProperty('--cngx-ripple-size', `${size}px`);
    wave.style.setProperty('--cngx-ripple-color', this.color());

    host.appendChild(wave);
    this.activeState.set(true);

    // Remove after animation completes — guard against double-invocation
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      clearTimeout(fallbackTimer);
      wave.remove();
      this.activeState.set(false);
    };

    wave.addEventListener('animationend', cleanup, { once: true });
    // Fallback timeout in case animationend doesn't fire (e.g. display:none)
    const fallbackTimer = setTimeout(cleanup, 1000);
  }
}
