import { inject } from '@angular/core';

import type { CngxRadioConfig } from './radio.config';
import { CNGX_RADIO_CONFIG } from './radio.config.defaults';

/**
 * Convenience accessor for the radio indicator configuration cascade.
 * Runs in injection context; resolves through the priority chain
 * (`provideRadioConfigAt` → `provideRadioConfig` → library defaults).
 *
 * Equivalent to `inject(CNGX_RADIO_CONFIG)` - the helper exists so
 * consumers don't need to import the token directly. Mirrors
 * `injectTagConfig`.
 *
 * ```ts
 * export class MyChoiceCard {
 *   private readonly radioConfig = injectRadioConfig();
 *   protected readonly skin = computed(() => this.radioConfig.skin ?? 'default');
 * }
 * ```
 */
export function injectRadioConfig(): CngxRadioConfig {
  return inject(CNGX_RADIO_CONFIG);
}
