import { Directive, input } from '@angular/core';

/**
 * Non-interactive section header for navigation groups.
 *
 * Renders as a visual label without semantic heading role by default.
 * Use `[heading]="true"` to opt in to `role="heading"` with `aria-level`
 * when the label genuinely represents a heading in the document outline.
 *
 * @usageNotes
 *
 * ### Section label (default — no heading role)
 * ```html
 * <span cngxNavLabel>@cngx/common</span>
 * ```
 *
 * ### With heading semantics (opt-in)
 * ```html
 * <span cngxNavLabel [heading]="true" [level]="3">Settings</span>
 * ```
 *
 * @category nav
 */
@Directive({
  selector: '[cngxNavLabel]',
  exportAs: 'cngxNavLabel',
  standalone: true,
  host: {
    '[class.cngx-nav-label]': 'true',
    '[attr.role]': 'heading() ? "heading" : null',
    '[attr.aria-level]': 'heading() ? level() : null',
  },
})
export class CngxNavLabel {
  /** Whether to apply `role="heading"`. Off by default to avoid inflating the heading outline. */
  readonly heading = input<boolean>(false);

  /** The heading level (2–6) when `heading` is true. */
  readonly level = input<number>(3);
}
