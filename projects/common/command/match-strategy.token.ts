import { InjectionToken } from '@angular/core';
import { injectLocale } from '@cngx/core/utils';

import { createDefaultCommandMatcher, type CngxCommandMatcher } from './match';

/**
 * Factory producing a {@link CngxCommandMatcher}. The exact signature is
 * captured so an override matches it precisely. The panel calls it in an
 * injection context, so a factory may `inject()` what its matcher needs.
 *
 * @category common/command
 * @since 0.1.0
 */
export type CngxCommandMatchFactory = () => CngxCommandMatcher;

/**
 * Swappable match-strategy seam. Defaults to {@link createDefaultCommandMatcher}
 * (pure label/keyword ranking, case- and accent-tolerant in the app locale). Override it - app-wide via `providers` or
 * per-component via `viewProviders` - to drop in a fuzzy/Levenshtein ranker
 * without touching the panel. The fuzzy engine stays a consumer swap; the
 * default bundle ships only the pure ranker.
 *
 * @category common/command
 * @since 0.1.0
 */
export const CNGX_COMMAND_MATCH_FACTORY = new InjectionToken<CngxCommandMatchFactory>(
  'CNGX_COMMAND_MATCH_FACTORY',
  { providedIn: 'root', factory: () => () => createDefaultCommandMatcher(injectLocale()) },
);
