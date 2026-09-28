import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { coerceSignal, createOverrideMerge } from '@cngx/core/utils';

/**
 * Interactive i18n surface. Library defaults are English; consumers override
 * via {@link provideInteractiveI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withInteractiveI18nLabels} accepts a `Signal` of a
 * partial bundle, so a runtime language switch re-derives every read.
 *
 * Both keys are live-region copy. `CngxAsyncClick` (and `CngxActionButton`,
 * which wraps it) announces the settle it just made, spent once per
 * transition.
 *
 * @category common/interactive/i18n
 */
export interface CngxInteractiveI18n {
  /** Announced when an async click action resolves. */
  readonly asyncClickSucceeded: string;
  /** Announced when an async click action rejects. */
  readonly asyncClickFailed: string;
}

const INTERACTIVE_I18N_DEFAULTS: CngxInteractiveI18n = {
  asyncClickSucceeded: 'Action succeeded',
  asyncClickFailed: 'Action failed',
};

/**
 * DI token for the interactive i18n bundle. `providedIn: 'root'` with English
 * defaults; the value is a `Signal`, shared by every reader under one
 * injector.
 *
 * @category common/interactive/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/i18n/interactive-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxAsyncClick
 */
export const CNGX_INTERACTIVE_I18N = new InjectionToken<Signal<CngxInteractiveI18n>>(
  'CngxInteractiveI18n',
  {
    providedIn: 'root',
    factory: () => coerceSignal(INTERACTIVE_I18N_DEFAULTS),
  },
);

/**
 * Branded feature-fn for {@link provideInteractiveI18n}.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export type CngxInteractiveI18nFeature = ((
  bundle: Signal<CngxInteractiveI18n>,
) => Signal<CngxInteractiveI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineInteractiveI18nFeature(
  fn: (bundle: Signal<CngxInteractiveI18n>) => Signal<CngxInteractiveI18n>,
): CngxInteractiveI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys keep the English
 * default. Pass a `Signal` of a partial bundle to switch languages at
 * runtime.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export function withInteractiveI18nLabels(
  overrides: Partial<CngxInteractiveI18n> | Signal<Partial<CngxInteractiveI18n>>,
): CngxInteractiveI18nFeature {
  return defineInteractiveI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the interactive i18n bundle. Returns a plain `Provider`, so it
 * also scopes a subtree through `viewProviders`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideInteractiveI18n(
 *       withInteractiveI18nLabels({ asyncClickSucceeded: 'Erledigt', asyncClickFailed: 'Fehlgeschlagen' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export function provideInteractiveI18n(
  ...features: readonly CngxInteractiveI18nFeature[]
): Provider {
  return {
    provide: CNGX_INTERACTIVE_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxInteractiveI18n>>(
        (bundle, feat) => feat(bundle),
        coerceSignal(INTERACTIVE_I18N_DEFAULTS),
      ),
  };
}

/**
 * Inject the resolved interactive i18n bundle signal. Read it inside a
 * `computed()` or template so a runtime override flip re-derives.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 */
export function injectInteractiveI18n(): Signal<CngxInteractiveI18n> {
  return inject(CNGX_INTERACTIVE_I18N);
}
