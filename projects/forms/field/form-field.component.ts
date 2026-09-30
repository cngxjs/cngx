import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CngxErrorScopeFieldBridge } from './error-scope-field-bridge.directive';
import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Invisible A11y coordination container for form fields.
 *
 * Renders as `display: contents` - zero visual footprint - until it holds a
 * `CngxLabel` as a direct child. Then it is the field's own stack: a flex
 * column that spaces label, control and hint with `--cngx-field-label-gap`
 * and `--cngx-field-hint-gap`, so the container around the fields only
 * spaces one field from the next.
 * All ARIA coordination (IDs, describedby, error gating) and CSS state classes
 * are handled by the hosted {@link CngxFormFieldPresenter}.
 *
 * Child directives (`CngxLabel`, `CngxInput`, `CngxHint`, `CngxError`, `CngxFieldErrors`)
 * inject the presenter from this component via DI.
 *
 * ```html
 * <cngx-form-field [field]="fields.email">
 *   <label cngxLabel>E-Mail</label>
 *   <input cngxInput />
 *   <span cngxHint>Business address</span>
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/form-field.component.ts
 * @since 0.1.0
 * @relatedTo CngxFormFieldPresenter, CngxLabel, CngxHint, CngxError, CngxFieldErrors, CngxBindField, CngxErrorScopeFieldBridge, CngxFieldSkinHost, withFieldSkin
 * @playground Basic input ./examples/basic-input/basic-input.component.ts
 * @playground Validation states ./examples/validation-states/validation-states.component.ts
 * @playground Form-error summary ./examples/form-error-summary/form-error-summary.component.ts
 * @playground Input add-ons ./examples/input-addons/input-addons.component.ts
 * @playground Skins ./examples/skins/skins.component.ts
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/reactive-forms-same-atom-just-bind-formcontrol</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/signal-forms-drop-the-atom-into-cngx-form-field</example-url>
 * <example-url>http://localhost:4200/#/forms/field/listbox-forms/reactive-forms-adapted-via-adaptformcontrol</example-url>
 * <example-url>http://localhost:4200/#/forms/field/listbox-forms/signal-forms-multi-select-min-2</example-url>
 * <example-url>http://localhost:4200/#/forms/field/listbox-forms/signal-forms-single-select</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/fill</example-url>
 * <example-url>http://localhost:4200/#/forms/field/skin/bare-cell-edit</example-url>
 */
@Component({
  selector: 'cngx-form-field',
  standalone: true,
  template: `<ng-content />`,
  styles: `
    :host {
      display: contents;
    }
    /* With a label the field is the stack: label, control or box, hint and
       errors in one column, spaced by the --cngx-field-label-gap and
       --cngx-field-hint-gap tokens (cngx.css). The consumer's container
       spaces fields from each other, never a label from its control. */
    :host(:has(> .cngx-label)) {
      display: flex;
      flex-direction: column;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    CngxErrorScopeFieldBridge,
    {
      directive: CngxFormFieldPresenter,
      inputs: ['field', 'skin'],
    },
  ],
})
export class CngxFormField {}
