import {
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  type EnvironmentProviders,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { injectWindow } from '@cngx/core/tokens';
import { createMediaQuerySignal } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';

import { createPreferenceAxis } from './preference-axis';

/**
 * The three motion preferences the `[data-motion]` axis ships
 * (`motion-tokens.css`). `auto` is the library default: it removes the
 * attribute so the OS `prefers-reduced-motion` media query drives.
 * `reduced` collapses animation/transition durations app-wide; `full`
 * opts back into motion even under an OS reduce preference.
 *
 * @since 0.1.0
 */
export type CngxMotionPreference = 'full' | 'reduced' | 'auto';

/**
 * Holds the app-wide motion preference as a `WritableSignal`. Read it
 * (and write it at runtime) through {@link injectMotion}; install the
 * root reflector with {@link provideMotion}. Defaults to `auto` when no
 * `provideMotion()` is present so an injected signal is always available.
 *
 * @relatedTo provideMotion
 * @relatedTo injectMotion
 * @since 0.1.0
 */
export const CNGX_MOTION = new InjectionToken<WritableSignal<CngxMotionPreference>>('CNGX_MOTION', {
  providedIn: 'root',
  factory: (): WritableSignal<CngxMotionPreference> => motionAxis.unprovided('auto'),
});

const motionAxis = createPreferenceAxis({
  warnChildInstall: () =>
    typeof ngDevMode !== 'undefined' &&
    ngDevMode &&
    cngxDevWarn(
      'CNGX0007',
      'provideMotion() in a child injector does not write <html data-motion> and shares the root signal; call it in the application config.',
    ),
  warnUnprovidedWrite: () =>
    typeof ngDevMode !== 'undefined' &&
    ngDevMode &&
    cngxDevWarn(
      'CNGX0008',
      'provideMotion() is not installed, so this write changes the signal but not <html data-motion>; call it in the application config.',
    ),
  token: CNGX_MOTION,
  attribute: 'data-motion',
  removeValue: 'auto',
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
 * @relatedTo CNGX_MOTION
 * @relatedTo injectMotion
 * @since 0.1.0
 */
export function provideMotion(initial: CngxMotionPreference = 'auto'): EnvironmentProviders {
  return motionAxis.provide(initial);
}

/**
 * Read the app-wide motion signal in an injection context. The returned
 * signal is writable, so `injectMotion().set('reduced')` collapses motion
 * across the whole document reactively; `set('auto')` hands control back
 * to the OS preference.
 *
 * @relatedTo provideMotion
 * @since 0.1.0
 */
export function injectMotion(): WritableSignal<CngxMotionPreference> {
  return motionAxis.injectValue();
}

/**
 * The motion the user gets right now, resolved for JavaScript: the
 * `CNGX_MOTION` pick when it is `reduced` or `full`, else the OS
 * `prefers-reduced-motion` query. Read it wherever JS decides on motion
 * (smooth scrolling, animation fallbacks, shimmer classes), so an in-app
 * pick in an accessibility panel reaches JS the same way it reaches CSS
 * through `motion-tokens.css`.
 *
 * A subtree `cngxMotionScope` is not seen here: it is CSS-only.
 *
 * ```ts
 * private readonly motion = injectEffectiveMotion();
 * protected readonly behavior = computed(() => (this.motion() === 'reduced' ? 'auto' : 'smooth'));
 * ```
 *
 * @relatedTo injectMotion, provideMotion
 * @since 0.3.0
 */
export function injectEffectiveMotion(): Signal<'reduced' | 'full'> {
  const preference = inject(CNGX_MOTION);
  const osReduce = createMediaQuerySignal(
    '(prefers-reduced-motion: reduce)',
    inject(DestroyRef),
    injectWindow(),
  );
  return computed(() => {
    const pick = preference();
    if (pick !== 'auto') {
      return pick;
    }
    return osReduce() ? 'reduced' : 'full';
  });
}
