import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

/**
 * Validates that the string control value matches the given regular expression.
 * Returns `null` when valid, `{ patternMatch: { pattern, actual } }` otherwise.
 *
 * Returns `null` (valid) when the control value is empty or falsy —
 * pair with `Validators.required` when an empty value is not acceptable.
 *
 * @category validators
 */
export function patternMatch(pattern: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const value = String(control.value);
    return pattern.test(value)
      ? null
      : { patternMatch: { pattern: pattern.source, actual: value } };
  };
}
