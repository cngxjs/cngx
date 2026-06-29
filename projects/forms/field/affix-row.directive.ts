import { Directive } from '@angular/core';

/**
 * Structural row that lays a form control out with its {@link CngxPrefix} and
 * {@link CngxSuffix} affixes on a single baseline-aligned line - the control
 * grows to fill, the affixes hug their content.
 *
 * Place it on the wrapper around `[cngxPrefix]`, the control, and
 * `[cngxSuffix]` so the row layout comes from the library instead of consumer
 * inline flex. The gap is the `--cngx-field-affix-gap` custom property
 * (default `0.5rem`); the rule is structural only, so colours and the outer
 * field stacking stay yours.
 *
 * The default visuals ship as Track-B CSS in `@cngx/themes/cngx.css` - import
 * it once at the app root for the row to lay out.
 *
 * ```html
 * <span cngxAffixRow>
 *   <span cngxPrefix>CHF</span>
 *   <input cngxInput cngxNumericInput [field]="f.price" />
 *   <span cngxSuffix>/ month</span>
 * </span>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/affix-row.directive.ts
 * @since 0.2.0
 * @relatedTo CngxPrefix, CngxSuffix, CngxFormField, CngxInput
 * <example-url>http://localhost:4200/#/forms/field/affix/currency-and-unit</example-url>
 */
@Directive({
  selector: '[cngxAffixRow]',
  standalone: true,
  host: {
    class: 'cngx-field-affix-row',
  },
})
export class CngxAffixRow {}
