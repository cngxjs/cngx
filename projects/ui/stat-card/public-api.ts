/**
 * @module @cngx/ui/stat-card
 */

export { CngxStatCard } from './stat-card.component';
export { CngxStatCardViz, CngxStatCardFooter } from './stat-card-slots';

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
