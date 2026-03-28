import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Skeleton placeholder for card content during loading.
 *
 * Renders shimmer rectangles that match typical card layout patterns.
 * Use alongside `@if (loading())` to swap real content with the skeleton.
 *
 * ```html
 * <cngx-card [loading]="loading()">
 *   @if (loading()) {
 *     <cngx-card-skeleton [lines]="3" [showMedia]="true" />
 *   } @else {
 *     <header cngxCardHeader>...</header>
 *     <div cngxCardBody>...</div>
 *   }
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Component({
  selector: 'cngx-card-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-card-skeleton',
    'aria-hidden': 'true',
  },
  template: `
    @if (showMedia()) {
      <div class="cngx-card-skeleton__media"></div>
    }
    <div class="cngx-card-skeleton__title"></div>
    @for (_ of lineArray(); track $index; let last = $last) {
      <div class="cngx-card-skeleton__line" [style.width]="last ? '60%' : '100%'"></div>
    }
  `,
})
export class CngxCardSkeleton {
  /** Number of body text lines to show. */
  readonly lines = input<number>(3);

  /** Whether to show a media placeholder block. */
  readonly showMedia = input<boolean>(false);

  /** @internal */
  protected readonly lineArray = computed(() => Array.from({ length: this.lines() }));
}
