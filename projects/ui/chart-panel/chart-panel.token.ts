import { InjectionToken } from '@angular/core';

/**
 * Title-registration contract the panel exposes to its projected title slot.
 * The slot registers its generated id on init; the panel derives its
 * `aria-labelledby` from it.
 *
 * Fronted by a DI token rather than the concrete `CngxChartPanel` class so the
 * slot stays decompose-safe - an ejected skin talks to the same token the
 * library defines. Mirrors `CNGX_STAT` behind the `cngxStat*` slots.
 */
export interface CngxChartPanelRegistry {
  /** Register the id contributed by the title slot. */
  registerTitle(id: string): void;
  /**
   * Withdraw a previously registered title id. Takes the id rather than no
   * argument so a destroy arriving after a replacement title already
   * registered cannot clear the newer one.
   */
  unregisterTitle(id: string): void;
}

/** DI token carrying the {@link CngxChartPanelRegistry} a `CngxChartPanel` provides. */
export const CNGX_CHART_PANEL = new InjectionToken<CngxChartPanelRegistry>('CNGX_CHART_PANEL');
