import { DOCUMENT } from '@angular/common';
import {
  effect,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
  untracked,
  type EnvironmentProviders,
  type InjectionToken,
  type WritableSignal,
} from '@angular/core';

/**
 * Options for {@link createPreferenceAxis}.
 * @internal
 */
interface CngxPreferenceAxisOptions<V extends string> {
  /**
   * The axis's public writable-signal token, declared in the axis
   * module (`new InjectionToken(...)` stays module-level so the token
   * keeps its own doc page and its root default factory).
   */
  readonly token: InjectionToken<WritableSignal<V>>;
  /** Root attribute the reflector writes, e.g. `'data-density'`. */
  readonly attribute: string;
  /**
   * Value that REMOVES the attribute instead of setting it (the "defer
   * to the OS media query" rung, `'auto'` on the axes that have one).
   * Omit for axes whose every value stamps the attribute.
   */
  readonly removeValue?: V;
}

/**
 * The machinery a preference axis shares: the `provide*` installer with
 * its root reflector, and the `inject*` reader.
 * @internal
 */
interface CngxPreferenceAxis<V extends string> {
  provide(initial: V): EnvironmentProviders;
  injectValue(): WritableSignal<V>;
}

/**
 * Internal factory behind the five theming preference axes (density,
 * text-scale, motion, contrast, touch-target). Each axis is the same
 * machine: a root-provided `WritableSignal` token plus an environment
 * initializer whose `effect` reflects the value onto an `<html data-*>`
 * attribute, with the DOM write in `untracked()`. Axes with a
 * `removeValue` rung remove the attribute for that value so the
 * corresponding OS media query stays in charge.
 *
 * The token itself stays declared in the axis module - it is the public
 * contract (and compodocx classifies token pages off the module-level
 * `new InjectionToken` initializer). This factory owns only the shared
 * machinery behind `provide*` / `inject*`.
 * @internal
 */
export function createPreferenceAxis<V extends string>(
  options: CngxPreferenceAxisOptions<V>,
): CngxPreferenceAxis<V> {
  const provide = (initial: V): EnvironmentProviders =>
    makeEnvironmentProviders([
      { provide: options.token, useFactory: () => signal<V>(initial) },
      provideEnvironmentInitializer(() => {
        const preference = inject(options.token);
        const root = inject(DOCUMENT).documentElement;
        effect(() => {
          const value = preference();
          untracked(() => {
            if (value === options.removeValue) {
              root.removeAttribute(options.attribute);
            } else {
              root.setAttribute(options.attribute, value);
            }
          });
        });
      }),
    ]);

  return { provide, injectValue: () => inject(options.token) };
}
