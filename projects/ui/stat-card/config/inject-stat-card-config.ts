import { inject } from '@angular/core';

import type { CngxStatCardConfig } from './stat-card.config';
import { CNGX_STAT_CARD_CONFIG } from './stat-card.config.defaults';

/**
 * Convenience accessor for the stat-card configuration cascade. Runs in
 * injection context; resolves through the priority chain (per-instance Input
 * -> `provideStatCardConfigAt` -> `provideStatCardConfig` -> library
 * defaults). Equivalent to `inject(CNGX_STAT_CARD_CONFIG)` - the helper exists
 * so consumers don't import the token directly.
 *
 * ```ts
 * export class CngxStatCard {
 *   private readonly cfg = injectStatCardConfig();
 *   readonly errorText = input<string>(this.cfg.ariaLabels?.errorFallback ?? 'Could not load');
 * }
 * ```
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export function injectStatCardConfig(): CngxStatCardConfig {
  return inject(CNGX_STAT_CARD_CONFIG);
}
