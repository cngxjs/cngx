import { Directive } from '@angular/core';
import { CNGX_FORM_FIELD_CONTROL } from '@cngx/forms/field';

import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';

/**
 * Opt-in attribute directive that exposes `CngxFilterBuilderPresenter`
 * as the `CngxFormFieldControl` for the current element. Apply alongside
 * `<cngx-filter-builder>` when wrapping inside `<cngx-form-field>`:
 *
 * ```html
 * <cngx-form-field>
 *   <cngx-filter-builder
 *     cngxFilterBuilderFormFieldControl
 *     [fields]="fields"
 *     [(value)]="value"
 *   ></cngx-filter-builder>
 * </cngx-form-field>
 * ```
 *
 * The form-field control contract is fenced rather than always-provided
 * because `disabled` / `focused` / `errorState` ship as Phase-6 stubs
 * (`filter-builder-presenter.directive.ts`); the default presenter does
 * not advertise a contract it cannot fully fulfil. When Phase 6 wires
 * the real signals, consumers will still add this directive to opt into
 * form-field bridge — the wiring stays explicit.
 */
@Directive({
  selector: '[cngxFilterBuilderFormFieldControl]',
  standalone: true,
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxFilterBuilderPresenter },
  ],
})
export class CngxFilterBuilderFormFieldControl {}
