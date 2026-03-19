import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

/** Validates that the control value is strictly `true`. */
export function requiredTrue(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as unknown;
    return value === true ? null : { requiredTrue: { actual: value } };
  };
}
