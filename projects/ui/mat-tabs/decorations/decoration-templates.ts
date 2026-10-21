import { computed, type Signal, type TemplateRef } from '@angular/core';

import type { CngxMatTabsConfig } from '../mat-tabs-config';
import type {
  CngxMatTabAggregatorContent,
  CngxMatTabAggregatorContentContext,
} from './mat-tab-aggregator-content.directive';
import type {
  CngxMatTabRejectionContent,
  CngxMatTabRejectionContentContext,
} from './mat-tab-rejection-content.directive';

/**
 * Content templates of the two Material decorations, resolved once for
 * `[cngxMatTabs]` and `[cngxMatTabNav]`.
 *
 * @internal
 */
export interface CngxMatTabDecorationTemplates {
  /** The projected `*cngxMatTabAggregatorContent`, else `null`. */
  readonly aggregator: Signal<TemplateRef<CngxMatTabAggregatorContentContext> | null>;
  /**
   * The projected `*cngxMatTabRejectionContent`, else the
   * `CNGX_MAT_TABS_CONFIG.templates.rejection` default, else `null`.
   */
  readonly rejection: Signal<TemplateRef<CngxMatTabRejectionContentContext> | null>;
}

/**
 * Resolve the decoration content slots of a Material tab bridge. The
 * `contentChild` queries stay on each host (signal queries must be class
 * fields); the resolution order is shared so both hosts agree.
 *
 * @internal
 */
export function createDecorationTemplates(
  aggregatorSlot: Signal<CngxMatTabAggregatorContent | undefined>,
  rejectionSlot: Signal<CngxMatTabRejectionContent | undefined>,
  config: CngxMatTabsConfig,
): CngxMatTabDecorationTemplates {
  return {
    aggregator: computed(() => aggregatorSlot()?.templateRef ?? null),
    rejection: computed(
      () => rejectionSlot()?.templateRef ?? config.templates?.rejection ?? null,
    ),
  };
}
