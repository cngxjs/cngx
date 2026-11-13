import type { FieldTree } from '@angular/forms/signals';

import { focusFieldControl } from './field-control-registry';
import type { CngxFieldValidationError } from './models';

/**
 * Focuses the first invalid leaf field's bound control after form submission.
 *
 * Uses `errorSummary()` from the root FieldState to find all descendant errors,
 * then iterates to the first one whose control takes focus: `focusBoundControl()`
 * for a `[formField]` control, the control's own `focus()` for one a
 * `cngx-form-field` discovered without `[formField]` (an adapted Reactive Forms
 * control, a bridge, a select). Group-level validators and controls that refuse
 * focus (DOM-disabled) are skipped.
 *
 * Call after `submit()` fails or after manually touching all fields.
 *
 * Generic over the form model, so a typed tree such as `form(signal({ ... }))`
 * passes without a cast, also in apps compiled without `strictNullChecks`.
 *
 * @param tree The root FieldTree of the form.
 * @returns `true` if focus moved to a control, `false` if no error's control took focus.
 *
 * ```typescript
 * async handleSubmit() {
 *   const success = await submit(this.loginForm, async () => { ... });
 *   if (!success) {
 *     focusFirstError(this.loginForm);
 *   }
 * }
 * ```
 */
export function focusFirstError<TModel>(tree: FieldTree<TModel>): boolean {
  const state = tree();
  // Read through the structural type: Signal Forms 21.1 names the error type
  // and types focusBoundControl differently from 21.2 and 22.
  const errors: readonly CngxFieldValidationError[] = state.errorSummary();

  const doc = typeof document === 'undefined' ? undefined : document;
  for (const error of errors) {
    // A group-level validator has no control and moves no focus; neither
    // does a control that refuses focus. Both fall through to the next error.
    if (focusFieldControl(error.fieldTree(), doc)) {
      return true;
    }
  }

  return false;
}
