import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Typed prefix affix for a form-field control - a positioned add-on rendered
 * before the input (currency symbol, unit, inline icon, or an interactive
 * control like a search button).
 *
 * Place it on the affix element inside the input row you compose; the directive
 * owns the affix ARIA so you do not have to. A decorative affix (the default) is
 * `aria-hidden` so a screen reader is not made to read "dollar sign" before the
 * field's own label; mark it `cngxPrefixInteractive` when the affix is a real
 * control (button, link) that must stay in the a11y tree and focus order.
 *
 * Layout stays yours (Komposition statt Konfiguration): position the row with
 * your own flex/grid; the directive contributes the `cngx-field-prefix` class as
 * a styling hook, not a layout opinion.
 *
 * ```html
 * <span cngxAffixRow>
 *   <span cngxPrefix>$</span>
 *   <input cngxInput cngxNumericInput [field]="f.amount" />
 * </span>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/prefix.directive.ts
 * @since 0.2.0
 * @relatedTo CngxSuffix, CngxAffixRow, CngxFormField, CngxInput, withCurrency
 * <example-url>http://localhost:4200/#/forms/field/affix/currency-and-unit</example-url>
 */
@Directive({
  selector: '[cngxPrefix]',
  standalone: true,
  exportAs: 'cngxPrefix',
  host: {
    class: 'cngx-field-prefix',
    '[class.cngx-field-affix--interactive]': 'interactive()',
    '[attr.aria-hidden]': "interactive() ? null : 'true'",
  },
})
export class CngxPrefix {
  /**
   * Whether the affix is a real interactive control. Default `false`
   * (decorative -> `aria-hidden`). Set it for a button/link affix so it stays
   * in the accessibility tree and focus order.
   */
  readonly interactive = input(false, {
    alias: 'cngxPrefixInteractive',
    transform: booleanAttribute,
  });
}
