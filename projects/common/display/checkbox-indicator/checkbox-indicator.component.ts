import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, type TemplateRef } from '@angular/core';

/**
 * Presentational checkbox / checkmark indicator.
 *
 * **Why this exists.**
 * Across the library, "is this row selected?" shows up as a bare
 * `<span class="cngx-select__check">&#10003;</span>` in the forms/select panel,
 * a future grid/tree cell will want a checkbox with indeterminate state, and
 * `ng decompose cngx-*` schematics should emit a consistent indicator shape
 * regardless of which list-like component they originated from. This atom
 * unifies all three surfaces behind a single presentational molecule —
 * purely decorative (`aria-hidden="true"`), zero outputs, two variants,
 * full `--cngx-checkbox-*` theming.
 *
 * **Responsibilities (intentionally narrow).**
 * - Render a boxed checkbox or a bare checkmark glyph (`variant`).
 * - Express checked / indeterminate / disabled visual state via host classes
 *   the consumer (or upstream CSS) can theme.
 * - Apply size presets (`sm` / `md` / `lg`) as CSS-custom-property modifiers.
 *
 * **Non-responsibilities.**
 * - Selection state — controlled entirely by the parent via `checked` /
 *   `indeterminate` inputs.
 * - Interaction — no `click` output, no keyboard handling. The parent (option
 *   row, tree cell, grid row) owns the hit area and toggle semantics.
 * - Accessibility announcements — `aria-hidden="true"` unconditionally. The
 *   truth about "selected" is communicated by the row's own `aria-selected`
 *   / `role="option"` ARIA, not by this decoration.
 *
 * @category display
 */
@Component({
  selector: 'cngx-checkbox-indicator',
  exportAs: 'cngxCheckboxIndicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './checkbox-indicator.component.css',
  imports: [NgTemplateOutlet],
  host: {
    class: 'cngx-checkbox-indicator',
    'aria-hidden': 'true',
    '[class.cngx-checkbox-indicator--checkbox]': "variant() === 'checkbox'",
    '[class.cngx-checkbox-indicator--checkmark]': "variant() === 'checkmark'",
    '[class.cngx-checkbox-indicator--checked]': 'checked()',
    '[class.cngx-checkbox-indicator--indeterminate]': 'indeterminate()',
    '[class.cngx-checkbox-indicator--disabled]': 'disabled()',
    '[class.cngx-checkbox-indicator--sm]': "size() === 'sm'",
    '[class.cngx-checkbox-indicator--md]': "size() === 'md'",
    '[class.cngx-checkbox-indicator--lg]': "size() === 'lg'",
  },
  template: `
    <ng-template #defaultDashGlyph>
      <span aria-hidden="true" class="cngx-checkbox-indicator__dash">&minus;</span>
    </ng-template>
    <ng-template #defaultCheckGlyph>
      <span aria-hidden="true" class="cngx-checkbox-indicator__check">&#10003;</span>
    </ng-template>

    @if (variant() === 'checkbox') {
      <span class="cngx-checkbox-indicator__box">
        @if (indeterminate()) {
          <ng-container *ngTemplateOutlet="dashGlyph() ?? defaultDashGlyph" />
        } @else if (checked()) {
          <ng-container *ngTemplateOutlet="checkGlyph() ?? defaultCheckGlyph" />
        }
      </span>
    } @else {
      @if (indeterminate()) {
        <ng-container *ngTemplateOutlet="dashGlyph() ?? defaultDashGlyph" />
      } @else if (checked()) {
        <ng-container *ngTemplateOutlet="checkGlyph() ?? defaultCheckGlyph" />
      }
    }
  `,
})
export class CngxCheckboxIndicator {
  /**
   * Visual form. `'checkbox'` renders a bordered box containing the glyph;
   * `'checkmark'` renders the bare glyph only (no box). Consumers pick the
   * mode-appropriate form themselves — `@cngx/forms/select` resolves it
   * from its `selectionIndicatorVariant` config.
   */
  readonly variant = input<'checkbox' | 'checkmark'>('checkbox');

  /** Whether the current value is selected. */
  readonly checked = input<boolean>(false);

  /**
   * Partial-selection state. Takes precedence over `checked` — when both
   * are true, the dash glyph is rendered. Intended for tree / group rows
   * where some-but-not-all descendants are selected.
   */
  readonly indeterminate = input<boolean>(false);

  /**
   * Disabled visual state. Purely cosmetic (opacity dim) — the indicator
   * never intercepts events, so this is a hint, not a block.
   */
  readonly disabled = input<boolean>(false);

  /** Size preset. Maps to a `--cngx-checkbox-size` custom property. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Consumer-supplied template for the check glyph. When `null` (default),
   * the built-in `<span class="cngx-checkbox-indicator__check">&#10003;</span>`
   * is rendered. When set, the consumer template replaces the glyph span
   * entirely — the `__check` class is NOT applied to the custom content
   * (consumers own the styling of their replacement).
   *
   * Convention-compatible with `*cngxSelectCheck` / `*cngxSelectOptionLabel`:
   * pass a `TemplateRef<void>` obtained via `#myGlyphTpl`. Useful for
   * `CngxTreeCheckboxHeader` or other consumers that need a custom glyph
   * without forking the atom.
   */
  readonly checkGlyph = input<TemplateRef<void> | null>(null);

  /**
   * Consumer-supplied template for the indeterminate dash glyph. Mirrors
   * {@link checkGlyph} — defaults to the built-in
   * `<span class="cngx-checkbox-indicator__dash">&minus;</span>`.
   */
  readonly dashGlyph = input<TemplateRef<void> | null>(null);
}
