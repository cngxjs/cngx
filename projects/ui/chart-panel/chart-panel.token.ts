import { InjectionToken, type Signal } from '@angular/core';

/**
 * Contract the panel exposes to its projected slots. The title slot registers
 * its generated id on init and the panel derives its `aria-labelledby` from
 * it; the actions slot reads the panel-level busy state and the id of the
 * node that says why the actions are unavailable.
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
  /**
   * Panel-level busy (the panel `[state]`, never the chart's data). The
   * actions slot reads it to mark each projected action disabled.
   */
  readonly busy: Signal<boolean>;
  /**
   * Id of the always-rendered node naming why the actions are disabled while
   * busy. Referenced only while `busy()` holds.
   */
  readonly busyDescriptionId: string;
}

/** DI token carrying the {@link CngxChartPanelRegistry} a `CngxChartPanel` provides. */
export const CNGX_CHART_PANEL = new InjectionToken<CngxChartPanelRegistry>('CNGX_CHART_PANEL');
