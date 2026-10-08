import { createLanguageSection } from '@cngx/core/i18n';

import { CNGX_STAT_CARD_LANGUAGE_EN } from './stat-card-language-section';

/**
 * @internal The stat-card section of the active pack over the English section,
 * shared app-wide. Consumers override copy through `withStatCardAriaLabels`.
 */
export const injectStatCardSiteCopy = createLanguageSection('statCard', CNGX_STAT_CARD_LANGUAGE_EN);
