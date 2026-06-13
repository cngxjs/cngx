import { afterNextRender, type Injector, signal, type Signal } from '@angular/core';

/**
 * One-shot gate that arms the strip's `animate.enter` motion only after
 * the component's first render. Angular runs enter animations whenever an
 * element is inserted - including the initial mount - so an ungated strip
 * would flash every step in on load. Bind `animate.enter` to this signal
 * (`armed() ? '<enter-class>' : ''`) so the intro paint is silent and only
 * later reflows (a collapsed group expanding) animate. `animate.leave`
 * needs no gate: nothing leaves on the first render.
 *
 * Pure `create*` factory, sibling to {@link createStripDensity} - it owns
 * a single `afterNextRender` the way the density factory owns a
 * `ResizeObserver`. Requires an injection context via `injector`.
 *
 * @category common/stepper
 */
export function createStepperStripEnterGate(injector: Injector): Signal<boolean> {
  const armed = signal(false);
  afterNextRender(() => armed.set(true), { injector });
  return armed.asReadonly();
}
