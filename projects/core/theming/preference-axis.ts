import { DOCUMENT } from '@angular/common';
import {
  effect,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
  untracked,
  type EnvironmentProviders,
  type WritableSignal,
} from '@angular/core';

/**
 * Options for {@link createPreferenceAxis}.
 * @internal
 */
interface CngxPreferenceAxisOptions<V extends string> {
  /** Dev-mode token name, e.g. `'CNGX_DENSITY'`. */
  readonly tokenName: string;
  /** Root attribute the reflector writes, e.g. `'data-density'`. */
  readonly attribute: string;
  /** Library default installed by the root token factory. */
  readonly initial: V;
  /**
   * Value that REMOVES the attribute instead of setting it (the "defer
   * to the OS media query" rung, `'auto'` on the axes that have one).
   * Omit for axes whose every value stamps the attribute.
   */
  readonly removeValue?: V;
}

/**
 * The bundle a preference axis ships: the writable-signal token, the
 * `provide*` installer with its root reflector, and the `inject*` reader.
 * @internal
 */
interface CngxPreferenceAxis<V extends string> {
  readonly token: InjectionToken<WritableSignal<V>>;
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
 * Not part of the public API - the per-axis `provide*` / `inject*`
 * functions and token constants are the public surface.
 * @internal
 */
export function createPreferenceAxis<V extends string>(
  options: CngxPreferenceAxisOptions<V>,
): CngxPreferenceAxis<V> {
  const token = new InjectionToken<WritableSignal<V>>(options.tokenName, {
    providedIn: 'root',
    factory: () => signal<V>(options.initial),
  });

  const provide = (initial: V): EnvironmentProviders =>
    makeEnvironmentProviders([
      { provide: token, useFactory: () => signal<V>(initial) },
      provideEnvironmentInitializer(() => {
        const preference = inject(token);
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

  return { token, provide, injectValue: () => inject(token) };
}
