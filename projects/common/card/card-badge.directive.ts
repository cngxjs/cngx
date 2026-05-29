import { Directive, input } from '@angular/core';

/**
 * Positions a badge element at a corner of its parent card and projects
 * intent + size variants onto the host class so a bare element renders
 * a usable pill without any inline styles.
 *
 * ```html
 * <cngx-card>
 *   <span cngxCardBadge position="top-end" intent="danger" size="md">P</span>
 *   <header cngxCardHeader>Pflegeplan</header>
 * </cngx-card>
 * ```
 *
 * Empty content collapses to a fixed-diameter dot via `:empty` (status
 * indicator pattern). Theme via the `--cngx-card-badge-*` tokens on
 * `card.component.css`; fallbacks chain through `--cngx-badge-*` then
 * the foundation palette.
 *
 * @category common/card
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/card-badge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxCard, CngxCardAccent, CngxCardHeader
 * <example-url>http://localhost:4200/#/common/card/card-with-badge</example-url>
 */
@Directive({
  selector: '[cngxCardBadge]',
  standalone: true,
  host: {
    class: 'cngx-card__badge',
    '[class.cngx-card__badge--top-start]': 'position() === "top-start"',
    '[class.cngx-card__badge--top-end]': 'position() === "top-end"',
    '[class.cngx-card__badge--bottom-start]': 'position() === "bottom-start"',
    '[class.cngx-card__badge--bottom-end]': 'position() === "bottom-end"',
    '[class.cngx-card__badge--intent-primary]': 'intent() === "primary"',
    '[class.cngx-card__badge--intent-danger]': 'intent() === "danger"',
    '[class.cngx-card__badge--intent-warning]': 'intent() === "warning"',
    '[class.cngx-card__badge--intent-success]': 'intent() === "success"',
    '[class.cngx-card__badge--intent-neutral]': 'intent() === "neutral"',
    '[class.cngx-card__badge--size-sm]': 'size() === "sm"',
    '[class.cngx-card__badge--size-md]': 'size() === "md"',
    '[class.cngx-card__badge--size-lg]': 'size() === "lg"',
  },
})
export class CngxCardBadge {
  /** Corner position using logical properties. */
  readonly position = input<'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'>('top-end');

  /**
   * Tone of the badge surface. Resolves to
   * `--cngx-card-badge-<intent>-bg` / `-color`; cascades through
   * `--cngx-badge-<intent>-bg` then `--cngx-color-<system>`.
   */
  readonly intent = input<'primary' | 'danger' | 'warning' | 'success' | 'neutral'>('primary');

  /**
   * Pill diameter and font-size. Empty content always renders as a
   * fixed dot at the `sm` token regardless of this input (`:empty`
   * fallback for status indicators).
   */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
