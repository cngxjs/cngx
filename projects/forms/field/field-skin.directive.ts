import { computed, Directive, inject, input } from '@angular/core';
import { CNGX_FORM_FIELD_HOST, type CngxFieldSkin } from '@cngx/core/tokens';
import { CNGX_FORM_FIELD_CONFIG } from './form-field.token';

/**
 * Resolves the appearance of one control and writes it to its own host as
 * `data-skin`, which is what the skin CSS scopes on.
 *
 * One responsibility: the cascade, evaluated in a single `computed()`.
 *
 * ```text
 * own [cngxFieldSkin]  ->  surrounding field's [skin]  ->  withFieldSkin(...)  ->  'outline'
 * ```
 *
 * `'outline'` resolves to `null`, so the default emits no attribute at all
 * and existing DOM stays byte-identical - the base layer already paints the
 * outline look.
 *
 * The surrounding field is read through `CNGX_FORM_FIELD_HOST`, optionally.
 * A control outside any `cngx-form-field` - a table filter input, a toolbar
 * control - still resolves its own input and the app-wide default, which is
 * exactly what the `bare` skin is for.
 *
 * **Where it is already composed.** `CngxFormField`, `CngxInput`,
 * `CngxAffixRow` and the select-family triggers host this directive and
 * re-alias its input to the short `skin`, so `<input cngxInput skin="bare">`
 * works out of the box. Directives that do not host `cngxInput` opt in with
 * the explicit attribute instead: `CngxNumericInput`, `CngxInputMask`,
 * `CngxInputFormat`, `CngxOtpSlot`, `input[cngxListboxSearch]`,
 * `input[cngxSearch]`, `input[cngxDgaFilter]`.
 *
 * ```html
 * <input cngxNumericInput cngxFieldSkin="bare" />
 * ```
 *
 * Never put it on `cngx-form-field`'s own element expecting a box: the field
 * is `display: contents` and has no border. The attribute belongs on whatever
 * element actually draws - the control, or the affix row when affixes turn
 * that row into the box.
 *
 * @category forms/field
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/field-skin.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxInput, CngxAffixRow, withFieldSkin
 * <example-url>http://localhost:4200/#/forms/field/skin/fill</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/bare-table-filter</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/bare-cell-edit</example-url>
 * <example-url>http://localhost:4200/#/forms/input/numeric/basic-numeric-input</example-url>
 */
@Directive({
  selector: '[cngxFieldSkin]',
  standalone: true,
  host: {
    '[attr.data-skin]': 'dataSkin()',
  },
})
export class CngxFieldSkinHost {
  private readonly host = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  private readonly config = inject(CNGX_FORM_FIELD_CONFIG);

  /**
   * Appearance for this control. Unset falls through to the field, then the
   * config. The valueless attribute form (`<input cngxFieldSkin>`, how a
   * host composes the directive without binding it) reads as `''` and is
   * normalised to "unset", mirroring the `CngxContrast` / `CngxDensity`
   * theming axes.
   */
  readonly skin = input<CngxFieldSkin | undefined, CngxFieldSkin | '' | undefined>(undefined, {
    alias: 'cngxFieldSkin',
    transform: (value) => (value === '' ? undefined : value),
  });

  /** The resolved skin as an attribute value; `null` for the default `'outline'`. */
  protected readonly dataSkin = computed(() => {
    const resolved = this.skin() ?? this.host?.skin?.() ?? this.config.skin ?? 'outline';
    return resolved === 'outline' ? null : resolved;
  });
}
