/**
 * @module @cngx/ui/toc
 */

export { CngxToc } from './toc.component';
export { CngxTocRouterSync } from './toc-router-sync.directive';
export { CngxTocItemSlot } from './toc-item-slot';
export { CNGX_TOC, type CngxTocContract } from './toc-token';
export type { CngxTocItem, CngxTocItemContext } from './toc.types';
export type { CngxTocAriaLabels, CngxTocConfig } from './config/toc.config';
export { CNGX_TOC_CONFIG, CNGX_TOC_DEFAULTS } from './config/toc.config.defaults';
export {
  withTocAriaLabels,
  withTocScrollBehavior,
  withTocSpy,
  withTocTemplates,
} from './config/features';
export {
  provideTocConfig,
  provideTocConfigAt,
  type CngxTocConfigFeature,
} from './config/provide-toc-config';
export { injectTocAriaLabels, injectTocConfig } from './config/inject-toc-config';
export { CNGX_TOC_LANGUAGE_EN, type CngxTocLanguageSection } from './i18n/toc-language-section';
