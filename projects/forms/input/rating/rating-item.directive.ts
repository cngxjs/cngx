import { Directive } from '@angular/core';

/**
 * Typed context exposed to a `*cngxRatingItem` glyph template.
 *
 * - `index` - zero-based position of the star in the strip.
 * - `step` - the numeric value this star commits when chosen.
 * - `filled` - `true` when the rating value reaches or exceeds this star
 *   (cumulative fill, not exact-match).
 * - `half` - `true` only when `[allowHalf]` is on and the value sits exactly
 *   half a step below this star.
 * - `disabled` - the effective disabled state of the control.
 *
 * @category forms/input
 */
export interface CngxRatingItemContext {
  readonly index: number;
  readonly step: number;
  readonly filled: boolean;
  readonly half: boolean;
  readonly disabled: boolean;
}

/**
 * Overrides the per-star glyph rendered by `CngxRating`.
 *
 * Apply as a structural directive on an `<ng-template>` inside a
 * `<cngx-rating>`; the template is stamped once per star with a typed
 * {@link CngxRatingItemContext}. Without it, the control falls back to a
 * minimal internal glyph - the library ships no icon component.
 *
 * ```html
 * <cngx-rating [(value)]="score">
 *   <ng-template cngxRatingItem let-filled="filled">
 *     <my-icon [name]="filled ? 'star' : 'star-outline'" />
 *   </ng-template>
 * </cngx-rating>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/rating/rating-item.directive.ts
 * @since 0.1.0
 * @relatedTo CngxRating
 * <example-url>http://localhost:4200/#/forms/input/rating/basic</example-url>
 */
@Directive({
  selector: 'ng-template[cngxRatingItem]',
  standalone: true,
})
export class CngxRatingItem {
  /** Narrows the template's `let-` bindings to {@link CngxRatingItemContext}. */
  static ngTemplateContextGuard(
    _dir: CngxRatingItem,
    ctx: unknown,
  ): ctx is CngxRatingItemContext {
    return true;
  }
}
