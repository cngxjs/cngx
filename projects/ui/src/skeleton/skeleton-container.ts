import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  inject,
  input,
  signal,
  type Signal,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import {
  CngxSkeletonPlaceholder,
  type CngxSkeletonPlaceholderContext,
} from './skeleton-placeholder';

/**
 * Skeleton loading container with built-in placeholder repetition.
 *
 * Manages CSS classes, ARIA, and reduced-motion handling internally
 * (same behavior as the `CngxSkeleton` atom directive). Adds template projection
 * so the consumer doesn't need `@if`/`@for` boilerplate.
 *
 * - Project a `<ng-template cngxSkeletonPlaceholder>` for the loading state (repeated `count` times).
 * - Project content directly for the loaded state.
 * - Uses `display: contents` — no extra DOM wrapper.
 *
 * @usageNotes
 *
 * ### Basic usage
 * ```html
 * <cngx-skeleton [loading]="loading()" [count]="3">
 *   <ng-template cngxSkeletonPlaceholder>
 *     <div class="skeleton-card"></div>
 *   </ng-template>
 *   <app-real-content />
 * </cngx-skeleton>
 * ```
 *
 * ### With template context (index, first, last)
 * ```html
 * <cngx-skeleton [loading]="loading()" [count]="5">
 *   <ng-template cngxSkeletonPlaceholder let-i let-last="last">
 *     <div class="skeleton-line" [style.width]="last ? '60%' : '100%'"></div>
 *   </ng-template>
 *   <p>Loaded content here</p>
 * </cngx-skeleton>
 * ```
 *
 * @category components
 */
@Component({
  selector: 'cngx-skeleton',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxSkeletonContainer',
  host: {
    style: 'display: contents',
    class: 'cngx-skeleton',
    '[class.cngx-skeleton--loading]': 'isLoading()',
    '[class.cngx-skeleton--shimmer]': 'showShimmer()',
    '[attr.aria-busy]': 'isLoading() || null',
  },
  template: `
    @if (isLoading()) {
      @for (i of indices(); track i) {
        <ng-container
          *ngTemplateOutlet="placeholderTpl()?.templateRef ?? null; context: getContext(i)"
        />
      }
    } @else {
      <ng-content />
    }
  `,
})
export class CngxSkeletonContainer {
  /** Controls the loading state directly. */
  readonly loading = input<boolean>(false);

  /** Bind an async state — shows skeleton during first load. Takes precedence over `loading`. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Enables the `.cngx-skeleton--shimmer` class (respects `prefers-reduced-motion`). */
  readonly shimmer = input<boolean>(true);

  /** Repeat count for the placeholder template. */
  readonly count = input<number>(1);

  /** Derived loading state: `state.isFirstLoad` takes precedence over `loading` input. */
  protected readonly isLoading = computed(() => this.state()?.isFirstLoad() ?? this.loading());

  /** @internal — projected placeholder template. */
  protected readonly placeholderTpl = contentChild(CngxSkeletonPlaceholder);

  /** Array of indices for internal `@for` rendering. */
  readonly indices = computed(() => Array.from({ length: this.count() }, (_, i) => i));

  // ── Reduced motion (inline) ─────────────────────────────────────────

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

  /** @internal */
  protected readonly showShimmer = computed(
    () => this.isLoading() && this.shimmer() && !this.prefersReducedMotion(),
  );

  /** @internal */
  protected getContext(index: number): CngxSkeletonPlaceholderContext {
    const total = this.count();
    return {
      $implicit: index,
      index,
      count: total,
      first: index === 0,
      last: index === total - 1,
    };
  }
}
