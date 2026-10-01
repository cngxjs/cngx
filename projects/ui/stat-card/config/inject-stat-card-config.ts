import { inject, type Signal } from '@angular/core';
import { createOverrideMerge } from '@cngx/core/utils';

import type { CngxStatCardConfig, CngxStatCardResolvedAriaLabels } from './stat-card.config';
import {
  CNGX_STAT_CARD_ARIA_LABELS_DEFAULTS,
  CNGX_STAT_CARD_CONFIG,
} from './stat-card.config.defaults';

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

/**
 * The resolved strings of the stat-card config in scope, filled from the
 * English defaults, as a Signal that follows a runtime language switch. Runs
 * in injection context; read it inside a `computed()`, a template or a
 * handler, and untracked where it builds live-region text.
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export function injectStatCardAriaLabels(): Signal<CngxStatCardResolvedAriaLabels> {
  return createOverrideMerge(CNGX_STAT_CARD_ARIA_LABELS_DEFAULTS, injectStatCardConfig().ariaLabels);
}
