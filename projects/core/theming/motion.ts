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
 * The three motion preferences the `[data-motion]` axis ships
 * (`motion-tokens.css`). `auto` is the library default: it removes the
 * attribute so the OS `prefers-reduced-motion` media query drives.
 * `reduced` collapses animation/transition durations app-wide; `full`
 * opts back into motion even under an OS reduce preference.
 *
 * @category core/theming
 * @since 0.1.0
 */
export type CngxMotionPreference = 'full' | 'reduced' | 'auto';

/**
 * Holds the app-wide motion preference as a `WritableSignal`. Read it
 * (and write it at runtime) through {@link injectMotion}; install the
 * root reflector with {@link provideMotion}. Defaults to `auto` when no
 * `provideMotion()` is present so an injected signal is always available.
 *
 * @category core/theming
 * @relatedTo provideMotion
 * @relatedTo injectMotion
 * @since 0.1.0
 */
export const CNGX_MOTION = new InjectionToken<WritableSignal<CngxMotionPreference>>('CNGX_MOTION', {
  providedIn: 'root',
  factory: () => signal<CngxMotionPreference>('auto'),
});

/**
 * Install the motion preference at app root and reflect it onto
 * `<html data-motion>`, driving the reduced-motion safety net in
 * `motion-tokens.css`. Unlike the density reflector, this one **removes**
 * the attribute for `'auto'` so the OS `prefers-reduced-motion`
 * media query stays in charge, and sets it for `'reduced'` / `'full'`. The
 * reflector is an `effect` (not `afterNextRender`) so it re-runs on every
 * runtime `injectMotion().set(...)`; the DOM write is wrapped in
 * `untracked()` per the signal-architecture rules.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideMotion('reduced')],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo CNGX_MOTION
 * @relatedTo injectMotion
 * @since 0.1.0
 */
export function provideMotion(initial: CngxMotionPreference = 'auto'): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_MOTION, useFactory: () => signal<CngxMotionPreference>(initial) },
    provideEnvironmentInitializer(() => {
      const motion = inject(CNGX_MOTION);
      const root = inject(DOCUMENT).documentElement;
      effect(() => {
        const value = motion();
        untracked(() => {
          if (value === 'auto') {
            root.removeAttribute('data-motion');
          } else {
            root.setAttribute('data-motion', value);
          }
        });
      });
    }),
  ]);
}

/**
 * Read the app-wide motion signal in an injection context. The returned
 * signal is writable, so `injectMotion().set('reduced')` collapses motion
 * across the whole document reactively; `set('auto')` hands control back
 * to the OS preference.
 *
 * @category core/theming
 * @relatedTo provideMotion
 * @since 0.1.0
 */
export function injectMotion(): WritableSignal<CngxMotionPreference> {
  return inject(CNGX_MOTION);
}
