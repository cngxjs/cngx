import { createLanguageSection } from '@cngx/core/i18n';

import { CNGX_ACCORDION_LANGUAGE_EN } from './accordion-language-section';

/**
 * @internal The accordion section of the active pack over the English section,
 * shared app-wide. Consumers override copy through `withAccordionLabels`.
 */
export const injectAccordionSiteCopy = createLanguageSection(
  'accordion',
  CNGX_ACCORDION_LANGUAGE_EN,
);
