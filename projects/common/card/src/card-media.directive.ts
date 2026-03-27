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
 *
 * @category card
 */
@Directive({
  selector: '[cngxCardMedia]',
  standalone: true,
  host: {
    class: 'cngx-card__media',
    '[style.aspect-ratio]': 'aspectRatio() !== "auto" ? aspectRatio() : null',
    '[attr.aria-hidden]': 'decorative() || null',
  },
})
export class CngxCardMedia {
  /** Whether this media is purely decorative (hidden from SR). */
  readonly decorative = input<boolean>(true);

  /** Aspect ratio applied via CSS `aspect-ratio` property. */
  readonly aspectRatio = input<'16/9' | '4/3' | '1/1' | 'auto'>('auto');
}
