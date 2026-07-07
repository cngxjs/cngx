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
export { CngxAccordionItemSubtitle } from './accordion-item-subtitle.directive';
export { CngxAccordionItemLeading } from './accordion-item-leading.directive';
export { CngxAccordionItemMeta } from './accordion-item-meta.directive';
export { CngxAccordionItemContent } from './accordion-item-content.directive';
export { CngxAccordionItemBusy } from './accordion-item-busy.directive';
export { CngxAccordionItemError } from './accordion-item-error.directive';
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
export {
  withAccordionLabels,
  withDefaultHeadingLevel,
  withAccordionTemplates,
} from './config/features';
export { injectAccordionConfig } from './config/inject-accordion-config';
