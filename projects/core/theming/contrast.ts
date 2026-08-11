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
 * The three contrast preferences the `[data-contrast]` axis ships
 * (`contrast-tokens.css`). `auto` is the library default: it removes the
 * attribute so the OS `prefers-contrast: more` media query drives.
 * `more` strengthens borders and demotes muted text toward the full text
 * colour app-wide; `normal` opts out even under an OS `more` preference.
 *
 * @category core/theming
 * @since 0.1.0
 */
export type CngxContrastPreference = 'normal' | 'more' | 'auto';

/**
 * Holds the app-wide contrast preference as a `WritableSignal`. Read it
 * (and write it at runtime) through {@link injectContrast}; install the
 * root reflector with {@link provideContrast}. Defaults to `auto` when no
 * `provideContrast()` is present so an injected signal is always available.
 *
 * @category core/theming
 * @relatedTo provideContrast
 * @relatedTo injectContrast
 * @since 0.1.0
 */
export const CNGX_CONTRAST = new InjectionToken<WritableSignal<CngxContrastPreference>>(
  'CNGX_CONTRAST',
  {
    providedIn: 'root',
    factory: () => signal<CngxContrastPreference>('auto'),
  },
);

/**
 * Install the contrast preference at app root and reflect it onto
 * `<html data-contrast>`, driving the higher-contrast token overrides in
 * `contrast-tokens.css`. Like the motion reflector, this one **removes**
 * the attribute for `'auto'` so the OS `prefers-contrast: more` media
 * query stays in charge, and sets it for `'more'` / `'normal'`. The
 * reflector is an `effect` (not `afterNextRender`) so it re-runs on every
 * runtime `injectContrast().set(...)`; the DOM write is wrapped in
 * `untracked()` per the signal-architecture rules.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideContrast('more')],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo CNGX_CONTRAST
 * @relatedTo injectContrast
 * @since 0.1.0
 */
export function provideContrast(
  initial: CngxContrastPreference = 'auto',
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_CONTRAST, useFactory: () => signal<CngxContrastPreference>(initial) },
    provideEnvironmentInitializer(() => {
      const contrast = inject(CNGX_CONTRAST);
      const root = inject(DOCUMENT).documentElement;
      effect(() => {
        const value = contrast();
        untracked(() => {
          if (value === 'auto') {
            root.removeAttribute('data-contrast');
          } else {
            root.setAttribute('data-contrast', value);
          }
        });
      });
    }),
  ]);
}

/**
 * Read the app-wide contrast signal in an injection context. The returned
 * signal is writable, so `injectContrast().set('more')` strengthens
 * borders and muted text across the whole document reactively;
 * `set('auto')` hands control back to the OS preference.
 *
 * @category core/theming
 * @relatedTo provideContrast
 * @since 0.1.0
 */
export function injectContrast(): WritableSignal<CngxContrastPreference> {
  return inject(CNGX_CONTRAST);
}
