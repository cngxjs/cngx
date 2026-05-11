import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, Directive, inject, input, signal, type Signal } from '@angular/core';

/**
 * Headless skeleton loading placeholder.
 *
 * Toggles between loading and content states via CSS classes and ARIA attributes.
 * No template -- the consumer renders the skeleton UI.
 *
 * Exposes an `indices()` signal for `@for` rendering of repeated skeleton elements.
 * Respects `prefers-reduced-motion` (disables shimmer animation class).
 *
 * @usageNotes
 *
 * ### Basic loading placeholder
 * ```html
 * <div [cngxSkeleton]="isLoading()" #sk="cngxSkeleton">
 *   @if (sk.loading()) {
 *     @for (i of sk.indices(); track i) {
 *       <div class="skeleton-line" aria-hidden="true"></div>
 *     }
 *   } @else {
 *     <p>{{ content() }}</p>
 *   }
 * </div>
 * ```
 *
 * ### Card list with repeat count
 * ```html
 * <div [cngxSkeleton]="loading()" [count]="3" #sk="cngxSkeleton">
 *   @if (sk.loading()) {
 *     @for (i of sk.indices(); track i) {
 *       <div class="skeleton-card" aria-hidden="true">
 *         <div class="skeleton-avatar"></div>
 *         <div class="skeleton-line"></div>
 *       </div>
 *     }
 *   } @else {
 *     @for (card of cards(); track card.id) {
 *       <app-card [data]="card" />
 *     }
 *   }
 * </div>
 * ```
 *
 * @category layout
 */
@Directive({
  selector: '[cngxSkeleton]',
  standalone: true,
  exportAs: 'cngxSkeleton',
  host: {
    class: 'cngx-skeleton',
    '[class.cngx-skeleton--loading]': 'loading()',
    '[class.cngx-skeleton--shimmer]': 'showShimmer()',
    '[attr.aria-busy]': 'loading() || null',
  },
})
export class CngxSkeleton {
  /** Controls the loading state. */
  readonly skeleton = input<boolean>(false, { alias: 'cngxSkeleton' });

  /** Enables the `.cngx-skeleton--shimmer` class (respects `prefers-reduced-motion`). */
  readonly shimmer = input<boolean>(true);

  /** Repeat count — exposed via the `indices()` signal for `@for` rendering. */
  readonly count = input<number>(1);

  private readonly prefersReducedMotion: Signal<boolean>;

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    const pref = signal(false);

    if (win?.matchMedia) {
      const mq = win.matchMedia('(prefers-reduced-motion: reduce)');
      pref.set(mq.matches);
      const listener = (e: MediaQueryListEvent) => pref.set(e.matches);
      mq.addEventListener('change', listener);
      inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', listener));
    }

    this.prefersReducedMotion = pref.asReadonly();
  }

  /** Whether the skeleton is in loading state. Mirrors the `cngxSkeleton` input. */
  readonly loading = computed(() => this.skeleton());

  /** Array of indices for `@for` rendering of repeated skeleton elements. */
  readonly indices = computed(() => Array.from({ length: this.count() }, (_, i) => i));

  /** @internal — shimmer class condition. */
  protected readonly showShimmer = computed(
    () => this.loading() && this.shimmer() && !this.prefersReducedMotion(),
  );
}
