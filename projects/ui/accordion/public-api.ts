/**
 * @module @cngx/ui/accordion
 */
export { CngxAccordionGroup } from './accordion-group.component';
export {
  CNGX_ACCORDION_GROUP,
  type CngxAccordionGroupContext,
} from './accordion-group.token';
export { CngxAccordionItem } from './accordion-item.component';
export { CngxAccordionItemTitle } from './accordion-item-title.directive';
export { CngxAccordionItemContent } from './accordion-item-content.directive';
export {
  CngxAccordionItemIcon,
  type CngxAccordionItemIconContext,
} from './accordion-item-icon.directive';
export type { CngxAccordionConfig } from './config/accordion.config';
export { CNGX_ACCORDION_CONFIG } from './config/accordion.config.defaults';
export {
  provideAccordionConfig,
  provideAccordionConfigAt,
  type CngxAccordionConfigFeature,
} from './config/provide-accordion-config';
export { withAccordionLabels, withDefaultHeadingLevel } from './config/features';
export { injectAccordionConfig } from './config/inject-accordion-config';
