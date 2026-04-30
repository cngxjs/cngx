import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, type TemplateRef } from '@angular/core';

/**
 * Presentational radio indicator — circle with a centred dot when checked.
 *
 * **Why this exists.**
 * The library's `@cngx/forms/select` panel currently composes
 * {@link import('../checkbox-indicator/checkbox-indicator.component').CngxCheckboxIndicator}
 * for both single-select (`'checkmark'`) and multi-select (`'checkbox'`)
 * indicators. The form-primitives spec (Brain vs. Skin) introduces a
 * radio variant — `selectionIndicatorVariant: 'radio'` for single-select
 * panels, plus the standalone {@link import('../../../interactive/src/radio/radio.directive').CngxRadio}
 * atom — that needs the dot-in-circle visual independently of the
 * box/checkmark shapes. This atom is the radio counterpart: same
 * decorative-only contract, same `--cngx-*` theming surface, same
 * `aria-hidden="true"` discipline.
 *
 * **Responsibilities (intentionally narrow).**
 * - Render a circle frame and, when `checked` is true, a centred dot.
 * - Express checked / disabled visual state via host classes the
 *   consumer (or upstream CSS) can theme.
 * - Apply size presets (`sm` / `md` / `lg`) as CSS-custom-property
 *   modifiers — same scale token as `CngxCheckboxIndicator` so the
 *   two atoms render at matching sizes inside a select panel.
 *
 * **Non-responsibilities.**
 * - Selection state — controlled by the parent via `checked`.
 * - No `indeterminate` — radios are exclusive by definition; the
 *   group enforces single-selection at the brain layer.
 * - Interaction — no `click` output, no keyboard handling. The radio
 *   row (or the consuming select panel) owns the hit area.
 * - Accessibility announcements — `aria-hidden="true"` unconditionally.
 *   Selection is announced via the row's `role="radio"` /
 *   `aria-checked` ARIA, never by this decoration.
 *
 * @category display
 */
@Component({
  selector: 'cngx-radio-indicator',
  exportAs: 'cngxRadioIndicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './radio-indicator.component.css',
  imports: [NgTemplateOutlet],
  host: {
    class: 'cngx-radio-indicator',
    'aria-hidden': 'true',
    '[class.cngx-radio-indicator--checked]': 'checked()',
    '[class.cngx-radio-indicator--disabled]': 'disabled()',
    '[class.cngx-radio-indicator--sm]': "size() === 'sm'",
    '[class.cngx-radio-indicator--md]': "size() === 'md'",
    '[class.cngx-radio-indicator--lg]': "size() === 'lg'",
  },
  template: `
    <ng-template #defaultDotGlyph>
      <span aria-hidden="true" class="cngx-radio-indicator__dot"></span>
    </ng-template>

    <span class="cngx-radio-indicator__circle">
      @if (checked()) {
        <ng-container *ngTemplateOutlet="dotGlyph() ?? defaultDotGlyph" />
      }
    </span>
  `,
})
export class CngxRadioIndicator {
  /** Whether the current value is selected. */
  readonly checked = input<boolean>(false);

  /**
   * Disabled visual state. Purely cosmetic (opacity dim) — the indicator
   * never intercepts events, so this is a hint, not a block.
   */
  readonly disabled = input<boolean>(false);

  /** Size preset. Maps to a `--cngx-radio-indicator-size` custom property. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Consumer-supplied template for the centred dot. When `null` (default),
   * the built-in `<span class="cngx-radio-indicator__dot"></span>` is
   * rendered. When set, the consumer template replaces the dot span
   * entirely — the `__dot` class is NOT applied to the custom content
   * (consumers own the styling of their replacement).
   *
   * Convention-compatible with `CngxCheckboxIndicator.checkGlyph`: pass a
   * `TemplateRef<void>` obtained via `#myDotTpl`. Useful for
   * design-system overrides that want a brand-glyph dot without
   * forking the atom.
   */
  readonly dotGlyph = input<TemplateRef<void> | null>(null);
}
