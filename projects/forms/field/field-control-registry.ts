import type { CngxFormFieldControl } from '@cngx/core/tokens';

/**
 * Field state to the control a `cngx-form-field` discovered for it. Keyed by
 * the state object itself, so an entry dies with its form. Lets
 * `focusFirstError` reach a control that is not bound through `[formField]`
 * (a select-family composite projected into the field).
 */
const CONTROLS = new WeakMap<object, CngxFormFieldControl>();

/**
 * Registers `control` for `state` and returns the matching unregister. The
 * unregister only removes its own entry: a later registration for the same
 * state is never dropped by an earlier one's teardown.
 *
 * @internal
 */
export function registerFieldControl(state: object, control: CngxFormFieldControl): () => void {
  CONTROLS.set(state, control);
  return () => {
    if (CONTROLS.get(state) === control) {
      CONTROLS.delete(state);
    }
  };
}

/**
 * The control registered for `state`, `undefined` when none.
 *
 * @internal
 */
export function fieldControlFor(state: object): CngxFormFieldControl | undefined {
  return CONTROLS.get(state);
}
