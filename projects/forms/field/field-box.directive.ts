import { computed, contentChildren, Directive, ElementRef, inject } from '@angular/core';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
} from '@cngx/core/tokens';
import { CNGX_FIELD_AFFIX, CNGX_FIELD_BOX, type CngxFieldBoxContract } from './field-box.token';
import { CngxFieldSkinHost } from './field-skin.directive';

/**
 * The painted box of a form control: one element that carries the skin's
 * surface, border, underline and focus ring, and lays the control out with
 * its {@link CngxPrefix} and {@link CngxSuffix} affixes on a single
 * baseline-aligned line - the control grows to fill, the affixes hug their
 * content.
 *
 * Place it on the wrapper around `[cngxPrefix]`, the control, and
 * `[cngxSuffix]` so the row layout comes from the library instead of consumer
 * inline flex. The gap is the `--cngx-field-affix-gap` custom property
 * (default `0.5rem`).
 *
 * The default visuals ship as Track-B CSS in `@cngx/themes/cngx.css` - import
 * it once at the app root for the box to lay out.
 *
 * **The box owns its direct children.** It hosts {@link CngxFieldSkinHost}
 * under the short `skin` alias and writes `data-skin` in every skin,
 * `outline` included. A control that is a direct child resolves to `bare`
 * and is reset to transparent, so one box is drawn, not two. A control
 * behind a wrapper element, or the inner controls of a composite such as a
 * phone input, is not a direct child and follows the normal cascade; a
 * composite is its own box and belongs directly in `cngx-form-field`.
 *
 * The box paints the state of its **main control**: the first direct-child
 * form-field control that is not an affix. It publishes that state as
 * `data-invalid` / `data-disabled` / `data-readonly` (readonly also when
 * the surrounding field is), so a disabled suffix button never greys the
 * row.
 * One main control per box; a second non-affix control is ignored. A click
 * on the box padding focuses the main control, so the whole box is its hit
 * area.
 *
 * **Label inside the box.** Besides the control and its affixes, the box
 * takes a {@link CngxLabel} as a direct child: placed there, it renders as an
 * inner label on its own line above the value, and the box grows by that line (56px instead
 * of 42px at comfortable density). Placement is the whole API, there is no
 * position input. Use one placement per form.
 *
 * ```html
 * <span cngxFieldBox>
 *   <label cngxLabel>Order reference</label>
 *   <input cngxInput [formField]="f.reference" />
 * </span>
 * ```
 *
 * ```html
 * <span cngxFieldBox>
 *   <span cngxPrefix>CHF</span>
 *   <input cngxInput cngxNumericInput [field]="f.price" />
 *   <span cngxSuffix>/ month</span>
 * </span>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/field-box.directive.ts
 * @since 0.2.0
 * @relatedTo CngxPrefix, CngxSuffix, CngxLabel, CngxFormField, CngxInput, CngxFieldSkinHost, CNGX_FIELD_BOX
 * <example-url>http://localhost:4200/#/forms/field/affix/currency-and-unit</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/outline-anatomy</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/fill-anatomy</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/bare-anatomy</example-url>
 */
@Directive({
  selector: '[cngxFieldBox], [cngxAffixRow]',
  standalone: true,
  providers: [{ provide: CNGX_FIELD_BOX, useExisting: CngxFieldBox }],
  hostDirectives: [{ directive: CngxFieldSkinHost, inputs: ['cngxFieldSkin: skin'] }],
  host: {
    class: 'cngx-field-box cngx-field-affix-row',
    '[attr.data-invalid]': 'dataInvalid()',
    '[attr.data-disabled]': 'dataDisabled()',
    '[attr.data-readonly]': 'dataReadonly()',
    '(click)': 'handleClick($event)',
  },
})
export class CngxFieldBox implements CngxFieldBoxContract {
  private readonly controls = contentChildren(CNGX_FORM_FIELD_CONTROL);
  /** Host elements of the box's direct-child form-field controls. */
  readonly controlElements = contentChildren(CNGX_FORM_FIELD_CONTROL, { read: ElementRef });
  private readonly affixControls = contentChildren(CNGX_FIELD_AFFIX, {
    read: CNGX_FORM_FIELD_CONTROL,
  });
  private readonly fieldHost = inject(CNGX_FORM_FIELD_HOST, { optional: true });

  private readonly mainControl = computed(() => {
    const affixes = new Set<CngxFormFieldControl>(this.affixControls());
    return this.controls().find((control) => !affixes.has(control));
  });

  protected readonly dataInvalid = computed(() => (this.mainControl()?.errorState() ? '' : null));
  protected readonly dataDisabled = computed(() => (this.mainControl()?.disabled() ? '' : null));
  protected readonly dataReadonly = computed(() => {
    const controlReadonly = this.mainControl()?.readonly?.() ?? false;
    const fieldReadonly = this.fieldHost?.readonly?.() ?? false;
    return controlReadonly || fieldReadonly ? '' : null;
  });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * A click on the box itself - its padding, not a child - focuses the main
   * control, so the whole box is the hit area on a coarse pointer, the way a
   * label forwards to its control.
   */
  protected handleClick(event: MouseEvent): void {
    if (event.target !== this.element) {
      return;
    }
    this.mainControl()?.focus?.();
  }
}

/**
 * @deprecated Renamed to {@link CngxFieldBox}. The `[cngxAffixRow]` selector
 * and this alias keep working for one release.
 */
export const CngxAffixRow = CngxFieldBox;
/**
 * @deprecated Renamed to {@link CngxFieldBox}.
 */
export type CngxAffixRow = CngxFieldBox;
