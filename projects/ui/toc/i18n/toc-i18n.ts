import { createLanguageSection } from '@cngx/core/i18n';

import { CNGX_TOC_LANGUAGE_EN } from './toc-language-section';

/**
 * @internal The toc section of the active pack over the English section,
 * shared app-wide. Consumers override copy through `withTocAriaLabels`.
 */
export const injectTocSiteCopy = createLanguageSection('toc', CNGX_TOC_LANGUAGE_EN);
