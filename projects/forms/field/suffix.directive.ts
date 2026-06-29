import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Typed suffix affix for a form-field control - a positioned add-on rendered
 * after the input (unit, currency code, inline icon, or an interactive control
 * like an in-field clear button).
 *
 * Mirror of {@link CngxPrefix} for the trailing side. Place it on the affix
 * element inside the input row you compose; a decorative affix (the default) is
 * `aria-hidden`, and `cngxSuffixInteractive` keeps an interactive affix (button,
 * link) in the a11y tree and focus order. Layout stays yours; the directive
 * contributes the `cngx-field-suffix` styling-hook class only.
 *
 * ```html
 * <span class="row">
 *   <input cngxInput cngxNumericInput [field]="f.weight" />
 *   <span cngxSuffix>kg</span>
 * </span>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/suffix.directive.ts
 * @since 0.2.0
 * @relatedTo CngxPrefix, CngxFormField, CngxInput, withCurrency
 * <example-url>http://localhost:4200/#/forms/field/affix/currency-and-unit</example-url>
 */
@Directive({
  selector: '[cngxSuffix]',
  standalone: true,
  exportAs: 'cngxSuffix',
  host: {
    class: 'cngx-field-suffix',
    '[class.cngx-field-affix--interactive]': 'interactive()',
    '[attr.aria-hidden]': "interactive() ? null : 'true'",
  },
})
export class CngxSuffix {
  /**
   * Whether the affix is a real interactive control. Default `false`
   * (decorative -> `aria-hidden`). Set it for a button/link affix so it stays
   * in the accessibility tree and focus order.
   */
  readonly interactive = input(false, {
    alias: 'cngxSuffixInteractive',
    transform: booleanAttribute,
  });
}
