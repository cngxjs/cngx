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
 * The three text-scale rungs the `[data-text-size]` swap ships
 * (`text-scale-tokens.css`). `md` is the library default (multiplier
 * `1`, identity); `sm` and `lg` re-scale `--cngx-font-scale` so every
 * root-relative `font-size` shrinks or grows for the subtree.
 *
 * @category core/theming
 * @since 0.1.0
 */
export type CngxTextScaleValue = 'sm' | 'md' | 'lg';

/**
 * Holds the app-wide text-scale preference as a `WritableSignal`. Read
 * it (and write it at runtime) through {@link injectTextScale}; install
 * the root reflector with {@link provideTextScale}. Defaults to `md`
 * (the identity rung) when no `provideTextScale()` is present so an
 * injected signal is always available and unset markup is unchanged.
 *
 * @category core/theming
 * @relatedTo provideTextScale
 * @relatedTo injectTextScale
 * @since 0.1.0
 */
export const CNGX_TEXT_SCALE = new InjectionToken<WritableSignal<CngxTextScaleValue>>(
  'CNGX_TEXT_SCALE',
  {
    providedIn: 'root',
    factory: () => signal<CngxTextScaleValue>('md'),
  },
);

/**
 * Install the text-scale preference at app root and reflect it onto
 * `<html data-text-size>`, mirroring how density is applied by
 * attribute. The reflector is an `effect` (not `afterNextRender`) so it
 * re-runs on every runtime `injectTextScale().set(...)`; the DOM write
 * is wrapped in `untracked()` per the signal-architecture rules.
 *
 * The default `md` rung is the identity multiplier, so
 * `provideTextScale()` with no argument (or an `md` value) leaves every
 * font-size pixel-identical to today.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideTextScale('lg')],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo CNGX_TEXT_SCALE
 * @relatedTo injectTextScale
 * @since 0.1.0
 */
export function provideTextScale(initial: CngxTextScaleValue = 'md'): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_TEXT_SCALE, useFactory: () => signal<CngxTextScaleValue>(initial) },
    provideEnvironmentInitializer(() => {
      const textScale = inject(CNGX_TEXT_SCALE);
      const root = inject(DOCUMENT).documentElement;
      effect(() => {
        const value = textScale();
        untracked(() => root.setAttribute('data-text-size', value));
      });
    }),
  ]);
}

/**
 * Read the app-wide text-scale signal in an injection context. The
 * returned signal is writable, so `injectTextScale().set('lg')`
 * re-scales all root-relative text reactively.
 *
 * @category core/theming
 * @relatedTo provideTextScale
 * @since 0.1.0
 */
export function injectTextScale(): WritableSignal<CngxTextScaleValue> {
  return inject(CNGX_TEXT_SCALE);
}
