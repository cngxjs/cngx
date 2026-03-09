import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

/**
 * Validates that the string control value matches the given regular expression.
 * Returns `null` when valid, `{ patternMatch: { pattern, actual } }` otherwise.
 */
export function patternMatch(pattern: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return pattern.test(String(control.value))
      ? null
      : { patternMatch: { pattern: pattern.source, actual: control.value } };
  };
}
