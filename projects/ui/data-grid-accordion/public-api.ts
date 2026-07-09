/**
 * @module @cngx/ui/data-grid-accordion
 */
export type {
  CngxDataGridAccordionConfig,
  CngxDataGridSeverity,
  CngxDataGridSkin,
} from './config/data-grid-accordion.config';
export { CNGX_DATA_GRID_ACCORDION_CONFIG } from './config/data-grid-accordion.config.defaults';
export {
  provideDataGridAccordionConfig,
  provideDataGridAccordionConfigAt,
  type CngxDataGridAccordionConfigFeature,
} from './config/provide-data-grid-accordion-config';
export { withDataGridSkin } from './config/features';
export { injectDataGridAccordionConfig } from './config/inject-data-grid-accordion-config';
