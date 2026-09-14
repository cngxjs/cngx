import {
  InjectionToken,
  signal,
  type EnvironmentProviders,
  type WritableSignal,
} from '@angular/core';
import { createPreferenceAxis } from './preference-axis';

/**
 * The three density rungs the `[data-density]` scale swap ships
 * (`density-tokens.css`). `comfortable` is the library default;
 * `compact` and `spacious` re-scale `--cngx-space-*` for the subtree.
 *
 * @category core/theming
 * @since 0.1.0
 */
export type CngxDensityValue = 'comfortable' | 'compact' | 'spacious';

/**
 * Holds the app-wide density preference as a `WritableSignal`. Read it
 * (and write it at runtime) through {@link injectDensity}; install the
 * root reflector with {@link provideDensity}. Defaults to
 * `comfortable` when no `provideDensity()` is present so an injected
 * signal is always available.
 *
 * @category core/theming
 * @relatedTo provideDensity
 * @relatedTo injectDensity
 * @since 0.1.0
 */
export const CNGX_DENSITY = new InjectionToken<WritableSignal<CngxDensityValue>>('CNGX_DENSITY', {
  providedIn: 'root',
  factory: () => signal<CngxDensityValue>('comfortable'),
});

const densityAxis = createPreferenceAxis({
  token: CNGX_DENSITY,
  attribute: 'data-density',
});

/**
 * Install the density preference at app root and reflect it onto
 * `<html data-density>`, mirroring how the colour ramp is applied by
 * attribute. The reflector is an `effect` (not `afterNextRender`) so it
 * re-runs on every runtime `injectDensity().set(...)`; the DOM write is
 * wrapped in `untracked()` per the signal-architecture rules.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideDensity('compact')],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo CNGX_DENSITY
 * @relatedTo injectDensity
 * @since 0.1.0
 */
export function provideDensity(initial: CngxDensityValue = 'comfortable'): EnvironmentProviders {
  return densityAxis.provide(initial);
}

/**
 * Read the app-wide density signal in an injection context. The
 * returned signal is writable, so `injectDensity().set('spacious')`
 * re-densifies the whole document reactively.
 *
 * @category core/theming
 * @relatedTo provideDensity
 * @since 0.1.0
 */
export function injectDensity(): WritableSignal<CngxDensityValue> {
  return densityAxis.injectValue();
}
