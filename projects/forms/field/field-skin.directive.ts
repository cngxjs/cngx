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
 * **Where it is already composed.** `CngxInput`, `CngxAffixRow` and the nine
 * select-family triggers host this directive and re-alias its input to the
 * short `skin`, so `<input cngxInput skin="bare">` works out of the box.
 *
 * `CngxFormField` does NOT host it - the field is `display: contents` and has
 * no box to paint. It forwards its own `[skin]` into `CngxFormFieldPresenter`,
 * which publishes the raw value on `CNGX_FORM_FIELD_HOST`; every control
 * inside then resolves it through the cascade above. Binding
 * `[cngxFieldSkin]` on `cngx-form-field` itself does nothing.
 *
 * Controls that do not host `cngxInput` opt in with the explicit attribute:
 * `CngxNumericInput`, `CngxInputMask`, `CngxInputFormat`, `CngxOtpSlot`,
 * `input[cngxListboxSearch]`, `input[cngxSearch]`, `input[cngxDgaFilter]`.
 * They are not reached by `withFieldSkin(...)` either - the config tier is
 * read by this directive, so a control that does not compose it stays on the
 * base outline look until the attribute is set.
 *
 * ```html
 * <input cngxNumericInput cngxFieldSkin="bare" />
 * ```
 *
 * @category forms/field
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/field-skin.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxInput, CngxAffixRow, withFieldSkin
 * <example-url>http://localhost:4200/#/forms/select/single-select/signal-forms-required</example-url>
 * <example-url>http://localhost:4200/#/forms/select/multi-select/multi-basic</example-url>
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
