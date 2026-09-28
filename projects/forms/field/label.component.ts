import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONFIG } from './form-field.token';

/**
 * Label for a `cngx-form-field`. Sets `for` and `id` automatically.
 *
 * When `withRequiredMarker()` is configured globally, the label auto-appends
 * the required indicator for required fields. Override per-label with
 * `[showRequired]="false"`.
 *
 * CSS classes:
 * - `cngx-label--required` - when the field has a `required` validator
 * - `cngx-label--error` - when field errors are visible or the discovered control reports an error state
 * - `cngx-label--disabled` - when the field or the discovered control is disabled
 *
 * Placement is composition, not an input: a label placed as a direct child of
 * a `CngxFieldBox` renders as an inner static label, on its own line above the
 * prefix / control / suffix line inside the box surface (the Material 3 filled
 * look, without a float). The box grows by the label line and keeps its
 * formula. Place the label in one spot per form, outside every box or inside
 * every box.
 *
 * ```html
 * <cngx-form-field [field]="form.reference" skin="fill">
 *   <span cngxFieldBox>
 *     <label cngxLabel>Order reference</label>
 *     <input cngxInput [formField]="form.reference" />
 *   </span>
 * </cngx-form-field>
 * ```
 *
 * Global required marker (no per-label code needed)
 * ```ts
 * provideFormField(withRequiredMarker())
 * ```
 * ```html
 * <label cngxLabel>E-Mail</label>
 * <!-- renders: E-Mail * -->
 * ```
 *
 * Opt-out per label
 * ```html
 * <label cngxLabel [showRequired]="false">Optional Field</label>
 * ```
 *
 * Manual marker (without global config)
 * ```html
 * <label cngxLabel>E-Mail <cngx-required /></label>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/label.component.ts
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxRequired, CngxHint, withRequiredMarker
 * <example-url>http://localhost:4200/#/forms/field/label/basic</example-url>
 * <example-url>http://localhost:4200/#/forms/field/label/required-marker</example-url>
 * <example-url>http://localhost:4200/#/forms/field/label/error-and-disabled-classes</example-url>
 * <example-url>http://localhost:4200/#/forms/field/label/show-required-override</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/fill</example-url>
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (label can be any element)
  selector: '[cngxLabel]',
  standalone: true,
  template: `<ng-content />
    @if (markerVisible()) {
      <span class="cngx-label__required" aria-hidden="true">{{ markerText() }}</span>
    }`,
  styleUrls: ['./label.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxLabel',
  host: {
    class: 'cngx-label',
    '[attr.for]': 'presenter.controlId()',
    '[id]': 'presenter.labelId()',
    '[class.cngx-label--required]': 'presenter.required()',
    '[class.cngx-label--error]': 'presenter.fieldOrControlError()',
    '[class.cngx-label--disabled]': 'presenter.fieldOrControlDisabled()',
  },
})
export class CngxLabel {
  /** @internal */
  protected readonly presenter = inject(CngxFormFieldPresenter);
  private readonly config = inject(CNGX_FORM_FIELD_CONFIG);

  /** Whether the associated field is required. */
  readonly required = this.presenter.required;

  /**
   * Override whether the auto-required marker is shown on this label.
   * Defaults to `undefined` (uses global config). Set `false` to opt out.
   */
  readonly showRequired = input<boolean | undefined>(undefined);

  /** @internal - resolved marker text from global config. */
  protected readonly markerText = computed(() =>
    typeof this.config.requiredMarker === 'string' ? this.config.requiredMarker : '*',
  );

  /** @internal - whether to show the auto-marker. */
  protected readonly markerVisible = computed(() => {
    if (!this.config.requiredMarker) {
      return false;
    }
    const override = this.showRequired();
    if (override === false) {
      return false;
    }
    return this.presenter.required();
  });
}
