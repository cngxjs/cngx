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
 * <example-url>http://localhost:4200/common/card/card/action-card-with-selection</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-badge</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-expandable-text</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-image</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/common/card/card/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/common/card/card/interactive-card-with-actions</example-url>
 * <example-url>http://localhost:4200/common/card/card/loading-state</example-url>
 * <example-url>http://localhost:4200/common/card/card/severity-accent</example-url>
 * <example-url>http://localhost:4200/common/card/card/skeleton-loading</example-url>
 * <example-url>http://localhost:4200/common/card/card/title-subtitle-footer</example-url>
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
