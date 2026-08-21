/**
 * @module @cngx/ui/toc
 */

export { CngxToc } from './toc.component';
export { CngxTocRouterSync } from './toc-router-sync.directive';
export { CngxTocItemSlot } from './toc-item-slot';
export { CNGX_TOC, type CngxTocContract } from './toc-token';
export type { CngxTocItem, CngxTocItemContext } from './toc.types';
export type { CngxTocConfig } from './config/toc.config';
export { CNGX_TOC_CONFIG } from './config/toc.config.defaults';
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
export { injectTocConfig } from './config/inject-toc-config';
