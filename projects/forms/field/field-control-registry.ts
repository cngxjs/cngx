import type { CngxFormFieldControl } from '@cngx/core/tokens';

import type { CngxErrorFieldState } from './models';

/**
 * Field state to the control a `cngx-form-field` discovered for it. Keyed by
 * the state object itself, so an entry dies with its form. Lets
 * `focusFirstError` and the error summary reach a control that is not bound
 * through `[formField]` (an adapted Reactive Forms control, a field bridge, a
 * select-family composite).
 *
 * Not `createKeyedRegistry`: that registry is string-keyed and signal-backed,
 * while this lookup needs an object key that does not keep its form alive and
 * is read imperatively, never tracked. The unregister below carries the same
 * guard (only its own entry is removed).
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

/**
 * Focuses the control of `state`: through `focusBoundControl()` when
 * `[formField]` bound one, else through the control a `cngx-form-field`
 * registered for it (an adapted Reactive Forms control, a bridge, a select).
 * Returns whether the control holds focus afterwards: focus moved, or it
 * already sat on that control. A control that refuses focus (a DOM-disabled
 * input) does not count as reached.
 *
 * @internal
 */
export function focusFieldControl(state: CngxErrorFieldState, doc: Document | undefined): boolean {
  const before = doc?.activeElement;
  const [binding] = state.formFieldBindings?.() ?? [];
  const control = fieldControlFor(state);
  if (binding !== undefined) {
    state.focusBoundControl({ preventScroll: false });
  } else {
    control?.focus?.();
  }
  if (doc === undefined) {
    return false;
  }
  if (doc.activeElement !== before) {
    return true;
  }
  // Focus did not move: reached only when it already sat on this control.
  if (binding !== undefined) {
    return (
      typeof binding === 'object' &&
      binding !== null &&
      'element' in binding &&
      binding.element === before
    );
  }
  return control?.focused() === true;
}
