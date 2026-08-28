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
 * The three touch-target modes the `[data-touch]` floor accepts.
 * `auto` (the default) writes no attribute and leaves the
 * `(any-pointer: coarse)` media query in control - the environment
 * derives the 44px floor. `on` / `off` pin the floor explicitly,
 * overriding the media query for the subtree.
 *
 * @category core/theming
 * @since 0.1.0
 */
export type CngxTouchTargetValue = 'auto' | 'on' | 'off';

/**
 * Holds the app-wide touch-target mode as a `WritableSignal`. Read it
 * (and write it at runtime) through {@link injectTouchTargets}; install
 * the root reflector with {@link provideTouchTargets}. Defaults to
 * `auto` when no `provideTouchTargets()` is present so an injected
 * signal is always available and the media-derived floor stays primary.
 *
 * @category core/theming
 * @relatedTo provideTouchTargets
 * @relatedTo injectTouchTargets
 * @since 0.1.0
 */
export const CNGX_TOUCH_TARGET = new InjectionToken<WritableSignal<CngxTouchTargetValue>>(
  'CNGX_TOUCH_TARGET',
  {
    providedIn: 'root',
    factory: () => signal<CngxTouchTargetValue>('auto'),
  },
);

/**
 * Install the touch-target mode at app root and reflect it onto
 * `<html data-touch>`. `auto` removes the attribute so the
 * `(any-pointer: coarse)` media query derives the floor; `on` / `off`
 * pin it. The reflector is an `effect` (not `afterNextRender`) so it
 * re-runs on every runtime `injectTouchTargets().set(...)`; the DOM
 * write is wrapped in `untracked()` per the signal-architecture rules.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideTouchTargets('on')],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo CNGX_TOUCH_TARGET
 * @relatedTo injectTouchTargets
 * @since 0.1.0
 */
export function provideTouchTargets(
  initial: CngxTouchTargetValue = 'auto',
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_TOUCH_TARGET, useFactory: () => signal<CngxTouchTargetValue>(initial) },
    provideEnvironmentInitializer(() => {
      const touch = inject(CNGX_TOUCH_TARGET);
      const root = inject(DOCUMENT).documentElement;
      effect(() => {
        const value = touch();
        untracked(() => {
          if (value === 'auto') {
            root.removeAttribute('data-touch');
          } else {
            root.setAttribute('data-touch', value);
          }
        });
      });
    }),
  ]);
}

/**
 * Read the app-wide touch-target signal in an injection context. The
 * returned signal is writable, so `injectTouchTargets().set('on')`
 * pins the 44px floor across the whole document reactively.
 *
 * @category core/theming
 * @relatedTo provideTouchTargets
 * @since 0.1.0
 */
export function injectTouchTargets(): WritableSignal<CngxTouchTargetValue> {
  return inject(CNGX_TOUCH_TARGET);
}
