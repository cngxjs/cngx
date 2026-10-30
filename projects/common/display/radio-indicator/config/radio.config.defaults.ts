import { InjectionToken } from '@angular/core';

import type { CngxRadioConfig } from './radio.config';

/**
 * Library defaults for the radio indicator configuration cascade.
 *
 * Exported for intra-lib consumers (`provideRadioConfig` merges over
 * this base) but **NOT** re-exported from `public-api.ts` - downstream
 * consumers reach the defaults via `inject(CNGX_RADIO_CONFIG)` so
 * `provideRadioConfig` / `provideRadioConfigAt` overrides take
 * precedence.
 *
 * @internal
 */
export const CNGX_RADIO_DEFAULTS: CngxRadioConfig = {
  skin: 'default',
};

/**
 * App-wide configuration cascade for the radio indicator. Resolves in
 * priority order:
 *
 *   1. Per-instance `[skin]` binding (indicator, radio or group).
 *   2. `provideRadioConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideRadioConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never
 * need to provide the token explicitly - `inject(CNGX_RADIO_CONFIG)`
 * always resolves. Lives in `@cngx/common/display` next to the
 * indicator, so it reaches every `cngx-radio-indicator`, including the
 * ones a select panel renders for its radio variant.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/radio-indicator/config/radio.config.defaults.ts
 * @since 0.1.0
 */
export const CNGX_RADIO_CONFIG = new InjectionToken<CngxRadioConfig>('CNGX_RADIO_CONFIG', {
  providedIn: 'root',
  factory: () => CNGX_RADIO_DEFAULTS,
});
