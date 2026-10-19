import type { FieldTree } from '@angular/forms/signals';

import { fieldControlFor } from './field-control-registry';

/**
 * Focuses the first invalid leaf field's bound control after form submission.
 *
 * Uses `errorSummary()` from the root FieldState to find all descendant errors,
 * then iterates to find the first one with a bound UI control and calls
 * `focusBoundControl()` on it; a control a `cngx-form-field` discovered for
 * the field without `[formField]` (a select) gets its own `focus()`. Skips group-level validators that have no
 * bound control (where `focusBoundControl()` would be a no-op).
 *
 * Call after `submit()` fails or after manually touching all fields.
 *
 * Generic over the form model, so a typed tree such as `form(signal({ ... }))`
 * passes without a cast, also in apps compiled without `strictNullChecks`.
 *
 * @param tree The root FieldTree of the form.
 * @returns `true` if a field was focused, `false` if no focusable error found.
 *
 * ```typescript
 * async handleSubmit() {
 *   const success = await submit(this.loginForm, async () => { ... });
 *   if (!success) {
 *     focusFirstError(this.loginForm);
 *   }
 * }
 * ```
 *
 * @category forms/field
 */
export function focusFirstError<TModel>(tree: FieldTree<TModel>): boolean {
  const state = tree();
  const errors = state.errorSummary();

  for (const error of errors) {
    const fieldState = error.fieldTree();
    // Skip group-level validators - they have no bound control. A leaf has
    // at least one entry in formFieldBindings when [formField] is used.
    const bindings = fieldState.formFieldBindings?.();
    if (bindings && bindings.length > 0) {
      fieldState.focusBoundControl({ preventScroll: false });
      return true;
    }
    // A control projected into a cngx-form-field without [formField] (a
    // select-family composite) is reached through the field's registration.
    const control = fieldControlFor(fieldState);
    if (control?.focus) {
      control.focus();
      return true;
    }
  }

  // Fallback: focus the first error even if it is a group-level entry.
  if (errors.length > 0) {
    errors[0].fieldTree().focusBoundControl({ preventScroll: false });
    return true;
  }

  return false;
}
