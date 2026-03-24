import type { FieldTree } from '@angular/forms/signals';

/**
 * Focuses the first invalid leaf field's bound control after form submission.
 *
 * Uses `errorSummary()` from the root FieldState to find all descendant errors,
 * then iterates to find the first one with a bound UI control and calls
 * `focusBoundControl()` on it. Skips group-level validators that have no
 * bound control (where `focusBoundControl()` would be a no-op).
 *
 * Call after `submit()` fails or after manually touching all fields.
 *
 * @param tree The root FieldTree of the form.
 * @returns `true` if a field was focused, `false` if no focusable error found.
 *
 * @example
 * ```typescript
 * async handleSubmit() {
 *   const success = await submit(this.loginForm, async () => { ... });
 *   if (!success) {
 *     focusFirstError(this.loginForm);
 *   }
 * }
 * ```
 *
 * @category utilities
 */
export function focusFirstError(tree: FieldTree<unknown>): boolean {
  const state = tree();
  const errors = state.errorSummary();

  for (const error of errors) {
    const fieldState = error.fieldTree();
    // Skip group-level validators — they have no bound form control to focus.
    // A leaf field has formFieldBindings with at least one entry when [formField] is used.
    const bindings = fieldState.formFieldBindings?.();
    if (bindings && bindings.length > 0) {
      fieldState.focusBoundControl({ preventScroll: false });
      return true;
    }
  }

  // Fallback: try the first error anyway (might be a group, but worth trying)
  if (errors.length > 0) {
    errors[0].fieldTree().focusBoundControl({ preventScroll: false });
    return true;
  }

  return false;
}
