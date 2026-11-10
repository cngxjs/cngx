// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The actionStatus section of a {@link CngxLanguagePack}: the status labels
 * of every action host on `CngxActionStatusBrain`. An empty key renders no
 * cell for that state, so the section switches cells on, not only their
 * text. `provideActionStatusConfig(withActionStatusLabels(...))` overrides
 * single keys on top of it; a bound `pendingLabel` / `succeededLabel` /
 * `failedLabel` wins over both.
 *
 * @since 0.1.0
 * @relatedTo CNGX_ACTION_STATUS_CONFIG, CngxActionStatusBrain, withActionStatusLabels
 */
export interface CngxActionStatusLanguageSection {
  /** Label of the pending cell, shown once the busy visual shows. `''`: no pending cell. */
  readonly pending: string;
  /** Label of the succeeded cell. `''`: no succeeded cell. */
  readonly succeeded: string;
  /** Label of the failed cell. `''`: no failed cell. */
  readonly failed: string;
}

/**
 * The English actionStatus section: every key empty, so an action host shows
 * its idle content through a run unless an app, a pack or the host sets a
 * label.
 *
 * @since 0.1.0
 * @relatedTo CNGX_ACTION_STATUS_CONFIG
 */
export const CNGX_ACTION_STATUS_LANGUAGE_EN: CngxActionStatusLanguageSection = {
  pending: '',
  succeeded: '',
  failed: '',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly actionStatus: CngxActionStatusLanguageSection;
  }
}
