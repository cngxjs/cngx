import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';

/**
 * Touch/click ripple feedback without Material dependency.
 *
 * Creates a `<span class="cngx-ripple__wave">` on pointer contact, positions it
 * via CSS custom properties (`--cngx-ripple-x`, `--cngx-ripple-y`, `--cngx-ripple-size`),
 * and removes it after the animation completes. ALL visual treatment - color, duration,
 * shape - is the consumer's CSS responsibility.
 *
 * Waves render into a lazily created `<span class="cngx-ripple__container" aria-hidden="true">`
 * that `cngx-ripple.css` lays over the host (`inset: 0`, `border-radius: inherit`,
 * `overflow: hidden`, `pointer-events: none`). Only the wave is clipped to the host
 * shape; the host itself is never clipped, so a corner badge or any other overhang
 * stays intact. The host gets the `cngx-ripple` class, which sets `position: relative`
 * at zero specificity, so a host that is already positioned keeps its own value.
 *
 * Ships default styles in `cngx-ripple.css` (part of `@cngx/themes/cngx.css`).
 * Reduced motion is the stylesheet's call, not the directive's: the wave is
 * always created, and under the app motion axis (`provideMotion`,
 * `cngxMotionScope`) or the OS preference it does not expand. With the
 * reduced-motion safety net of `@cngx/themes/cngx.css` loaded it is
 * removed at once; without it, it fades in place.
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
 * <button cngxRipple [rippleDisabled]="readOnly()">Click</button>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/ripple/ripple.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPressable, CngxPressRipple, CngxHoverable
 * <example-url>/#/common/interactive/ripple/base/button-ripples</example-url>
 * <example-url>/#/common/interactive/ripple/base/card-with-ripple</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxRipple]',
  exportAs: 'cngxRipple',
  standalone: true,
  host: {
    class: 'cngx-ripple',
    '(pointerdown)': 'handlePointerDown($event)',
  },
})
export class CngxRipple {
  /**
   * Ripple color, written inline as `--cngx-ripple-color` on the wave when set.
   * Unset, the wave reads `--cngx-ripple-color` from the cascade (a host
   * override, the Material bridge, or the `currentColor` default).
   */
  readonly color = input<string | undefined>(undefined, { alias: 'rippleColor' });
  /** Whether the ripple originates from the center of the host. */
  readonly centered = input<boolean>(false, { alias: 'rippleCentered' });
  /** Whether the ripple effect is disabled. */
  readonly disabled = input<boolean>(false, { alias: 'rippleDisabled' });

  private readonly liveWaves = signal(0);
  /** Whether a ripple animation is currently playing (any of overlapping waves). */
  readonly active = computed(() => this.liveWaves() > 0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Cleanups of waves whose animation has not finished yet. Flushed on
   * destroy so the 1s fallback timer never outlives the directive and
   * detached hosts do not keep orphaned wave elements alive.
   */
  private readonly pendingCleanups = new Set<() => void>();

  /**
   * Clipping layer the waves render into. Created on the first ripple so a
   * host that is never pressed carries no extra node; removed on destroy.
   */
  private container: HTMLElement | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const cleanup of [...this.pendingCleanups]) {
        cleanup();
      }
      this.container?.remove();
      this.container = null;
    });
  }

  private ensureContainer(host: HTMLElement): HTMLElement {
    if (this.container?.parentNode === host) {
      return this.container;
    }
    const container = this.doc.createElement('span');
    container.className = 'cngx-ripple__container';
    // Decorative layer: keep it and every wave out of the accessibility tree.
    container.setAttribute('aria-hidden', 'true');
    host.appendChild(container);
    this.container = container;
    return container;
  }

  /** @internal */
  protected handlePointerDown(event: PointerEvent): void {
    // Primary button only: a right-click opens a context menu, not a press.
    if (this.disabled() || event.button !== 0) {
      return;
    }

    const host = this.el.nativeElement as HTMLElement;
    const rect = host.getBoundingClientRect();

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

    const wave = this.doc.createElement('span');
    wave.className = 'cngx-ripple__wave';
    // Decorative feedback only - keep the transient span out of the
    // accessibility tree so AT never announces an empty inline element.
    wave.setAttribute('aria-hidden', 'true');
    wave.style.setProperty('--cngx-ripple-x', `${x}px`);
    wave.style.setProperty('--cngx-ripple-y', `${y}px`);
    wave.style.setProperty('--cngx-ripple-size', `${size}px`);
    const color = this.color();
    if (color) {
      wave.style.setProperty('--cngx-ripple-color', color);
    }

    this.ensureContainer(host).appendChild(wave);
    this.liveWaves.update((n) => n + 1);

    // Remove after animation completes - guard against double-invocation
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      this.pendingCleanups.delete(cleanup);
      clearTimeout(fallbackTimer);
      wave.remove();
      this.liveWaves.update((n) => n - 1);
    };
    this.pendingCleanups.add(cleanup);

    wave.addEventListener('animationend', cleanup, { once: true });
    // Fallback timeout in case animationend doesn't fire (e.g. display:none)
    const fallbackTimer = setTimeout(cleanup, 1000);
  }
}
