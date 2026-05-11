import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

/**
 * Validates that the control value is strictly `true`.
 *
 * Returns `{ requiredTrue: { actual } }` for any value other than `true`.
 * Intended for checkbox agreement fields.
 *
 * @category validators
 */
export function requiredTrue(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as unknown;
    return value === true ? null : { requiredTrue: { actual: value } };
  };
}
