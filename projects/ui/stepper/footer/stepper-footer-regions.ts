import { Directive } from '@angular/core';

/**
 * Marker for the footer's leading region (inline-start). Place on the
 * element you want in the start slot - typically a Back control.
 *
 * ```html
 * <button cngxStepperFooterStart cngxStepperPrevious>Back</button>
 * ```
 *
 * @category ui/stepper
 * @since 0.1.0
 * @relatedTo CngxStepperFooter, CngxStepperFooterCenter, CngxStepperFooterEnd
 */
@Directive({
  selector: '[cngxStepperFooterStart]',
  standalone: true,
  host: { class: 'cngx-stepper-footer__slot' },
})
export class CngxStepperFooterStart {}

/**
 * Marker for the footer's center region - a progress hint, a
 * `<cngx-stepper-count>`, or a "50% complete" caption.
 *
 * @category ui/stepper
 * @since 0.1.0
 * @relatedTo CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterEnd
 */
@Directive({
  selector: '[cngxStepperFooterCenter]',
  standalone: true,
  host: { class: 'cngx-stepper-footer__slot' },
})
export class CngxStepperFooterCenter {}

/**
 * Marker for the footer's trailing region (inline-end) - typically a
 * Continue / Finish control, optionally preceded by a "Save draft".
 *
 * @category ui/stepper
 * @since 0.1.0
 * @relatedTo CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterCenter
 */
@Directive({
  selector: '[cngxStepperFooterEnd]',
  standalone: true,
  host: { class: 'cngx-stepper-footer__slot' },
})
export class CngxStepperFooterEnd {}
