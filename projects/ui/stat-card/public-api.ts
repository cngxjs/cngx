/**
 * @module @cngx/ui/stat-card
 */

export { CngxStatCard } from './stat-card.component';
export { CngxStatCardViz, CngxStatCardFooter } from './stat-card-slots';
export { type CngxStatCardConfig } from './config/stat-card.config';
export { CNGX_STAT_CARD_CONFIG } from './config/stat-card.config.defaults';
export {
  provideStatCardConfig,
  provideStatCardConfigAt,
  type CngxStatCardConfigFeature,
} from './config/provide-stat-card-config';
export { withStatCardAriaLabels, withStatCardLoadingTreatment } from './config/features';
export { injectStatCardConfig } from './config/inject-stat-card-config';

// The four coordinated stat slots are the existing atoms from @cngx/common/data,
// re-exported for a local import surface. A slot projected into the card injects
// the same CNGX_STAT the card provides - one token, one shape, no new contract.
export {
  CngxStatLabel,
  CngxStatValue,
  CngxStatDelta,
  CngxStatCaption,
  CNGX_STAT,
  type CngxStatRegistry,
} from '@cngx/common/data';
