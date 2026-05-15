import { Directive, input } from '@angular/core';

/**
 * Structural slot directive for the card media region (images, videos, icons).
 *
 * When `decorative` is `true` (default), the media is hidden from screen readers
 * via `aria-hidden`. Set to `false` when the image carries meaningful information.
 *
 * ```html
 * <cngx-card>
 *   <img cngxCardMedia [decorative]="false" alt="Photo of patient" />
 * </cngx-card>
 * ```
 * <example-url>http://localhost:4200/common/card/action-card-with-selection</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-badge</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-expandable-text</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-image</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/common/card/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/common/card/interactive-card-with-actions</example-url>
 * <example-url>http://localhost:4200/common/card/loading-state</example-url>
 * <example-url>http://localhost:4200/common/card/severity-accent</example-url>
 * <example-url>http://localhost:4200/common/card/skeleton-loading</example-url>
 * <example-url>http://localhost:4200/common/card/title-subtitle-footer</example-url>
 */
@Directive({
  selector: '[cngxCardMedia]',
  standalone: true,
  host: {
    class: 'cngx-card__media',
    '[style.aspect-ratio]': 'aspectRatio() !== "auto" ? aspectRatio() : null',
    '[attr.aria-hidden]': 'decorative() || null',
    '[attr.loading]': '"lazy"',
  },
})
export class CngxCardMedia {
  /** Whether this media is purely decorative (hidden from SR). */
  readonly decorative = input<boolean>(true);

  /** Aspect ratio applied via CSS `aspect-ratio` property. */
  readonly aspectRatio = input<'16/9' | '4/3' | '1/1' | 'auto'>('auto');
}
