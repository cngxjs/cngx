/**
 * @module @cngx/ui/toc
 */

export type { CngxTocItem, CngxTocItemContext } from './toc.types';
export type { CngxTocConfig } from './config/toc.config';
export { CNGX_TOC_CONFIG } from './config/toc.config.defaults';
export { withTocAriaLabels, withTocScrollBehavior, withTocTemplates } from './config/features';
export {
  provideTocConfig,
  provideTocConfigAt,
  type CngxTocConfigFeature,
} from './config/provide-toc-config';
export { injectTocConfig } from './config/inject-toc-config';
