import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CngxErrorScopeFieldBridge } from './error-scope-field-bridge.directive';
import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Invisible A11y coordination container for form fields.
 *
 * Renders as `display: contents` — zero visual footprint.
 * All ARIA coordination (IDs, describedby, error gating) and CSS state classes
 * are handled by the hosted {@link CngxFormFieldPresenter}.
 *
 * Child directives (`CngxLabel`, `CngxInput`, `CngxHint`, `CngxError`, `CngxFieldErrors`)
 * inject the presenter from this component via DI.
 *
 * @example
 * ```html
 * <cngx-form-field [field]="fields.email">
 *   <label cngxLabel>E-Mail</label>
 *   <input cngxInput placeholder="max@example.com" />
 *   <span cngxHint>Business address</span>
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * @category components
 */
@Component({
  selector: 'cngx-form-field',
  standalone: true,
  template: `<ng-content />`,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    CngxErrorScopeFieldBridge,
    {
      directive: CngxFormFieldPresenter,
      inputs: ['field'],
    },
  ],
})
export class CngxFormField {}
