import { type ElementRef, InjectionToken, type Signal } from '@angular/core';

/**
 * What a {@link CngxFieldBox} publishes to the controls inside it.
 *
 * The box owns its direct children and nothing deeper: `controlElements`
 * lists the host elements of the `CNGX_FORM_FIELD_CONTROL` providers that
 * sit directly inside the box. A control behind a wrapper element, or the
 * inner controls of a composite, is not in the list.
 *
 * @category forms/field
 */
export interface CngxFieldBoxContract {
  /** Host elements of the box's direct-child form-field controls. */
  readonly controlElements: Signal<readonly ElementRef<HTMLElement>[]>;
}

/**
 * Resolves to the surrounding {@link CngxFieldBox}. A `CngxFieldSkinHost`
 * reads it to find out whether its host is a direct child of a box; if so
 * it resolves to `bare`, because the box, not the control, is the painted
 * element. Only direct children count: the box owns its direct children,
 * so a control two levels down follows the normal skin cascade.
 *
 * @category forms/field
 * @since 0.2.0
 * @relatedTo CngxFieldBox, CngxFieldBoxContract, CngxFieldSkinHost
 */
export const CNGX_FIELD_BOX = new InjectionToken<CngxFieldBoxContract>('CngxFieldBox');

/**
 * Marker provided by `CngxPrefix` and `CngxSuffix`, so a box can tell an
 * affix control (a currency picker) apart from its main control.
 *
 * @internal Exported only because the affix directives and the box live in
 * sibling files.
 * @category forms/field
 */
export const CNGX_FIELD_AFFIX = new InjectionToken<true>('CngxFieldAffix');
