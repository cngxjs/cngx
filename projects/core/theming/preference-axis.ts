import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  DestroyRef,
  effect,
  EnvironmentInjector,
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
   * Dev warning for an install below the root injector
   * ([`CNGX0007`](/error-codes/cngx0007.md)). Each axis passes its own call,
   * guarded inline, so the message names its installer literally.
   */
  readonly warnChildInstall: () => void;
  /**
   * Dev warning for a write to the default signal without the installer
   * ([`CNGX0008`](/error-codes/cngx0008.md)), guarded inline like
   * `warnChildInstall`.
   */
  readonly warnUnprovidedWrite: () => void;
  /**
   * Value that REMOVES the attribute instead of setting it (the "defer
   * to the OS media query" rung, `'auto'` on the axes that have one).
   * Omit for axes whose every value stamps the attribute.
   */
  readonly removeValue?: V;
}

/**
 * The machinery a preference axis shares: the `provide*` installer with
 * its root reflector, the `inject*` reader, and the token's default signal.
 * @internal
 */
interface CngxPreferenceAxis<V extends string> {
  provide(initial: V): EnvironmentProviders;
  injectValue(): WritableSignal<V>;
  /**
   * The signal the token's root default factory returns when no
   * `provide*` is installed. In dev mode a write warns
   * ([`CNGX0008`](/error-codes/cngx0008.md)): nothing
   * reflects it onto `<html>`.
   */
  unprovided(initial: V): WritableSignal<V>;
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
 * Root only: `<html>` is one element, so one injector owns it. An install
 * in a child environment injector (a lazy route's `providers`) warns in dev
 * mode ([`CNGX0007`](/error-codes/cngx0007.md)), writes nothing, and its
 * token hands out the parent's signal, so readers below it never diverge
 * from the document. The root
 * reflector removes its attribute when the root injector is destroyed.
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
  const isRootInjector = (): boolean =>
    inject(EnvironmentInjector) === inject(ApplicationRef).injector;

  const provide = (initial: V): EnvironmentProviders =>
    makeEnvironmentProviders([
      {
        provide: options.token,
        useFactory: () =>
          isRootInjector() ? signal<V>(initial) : inject(options.token, { skipSelf: true }),
      },
      provideEnvironmentInitializer(() => {
        if (!isRootInjector()) {
          options.warnChildInstall();
          return;
        }
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
        inject(DestroyRef).onDestroy(() => root.removeAttribute(options.attribute));
      }),
    ]);

  const unprovided = (initial: V): WritableSignal<V> => {
    const value = signal<V>(initial);
    if (typeof ngDevMode === 'undefined' || !ngDevMode) {
      return value;
    }
    const warn = options.warnUnprovidedWrite;
    const set = value.set;
    const update = value.update;
    value.set = (next: V) => {
      warn();
      set(next);
    };
    value.update = (fn: (current: V) => V) => {
      warn();
      update(fn);
    };
    return value;
  };

  return { provide, injectValue: () => inject(options.token), unprovided };
}
