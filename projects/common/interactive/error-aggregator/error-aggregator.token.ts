import { InjectionToken, type Signal } from '@angular/core';

/**
 * One registered error source within an {@link CngxErrorAggregatorContract}.
 *
 * `key` uniquely identifies the source within its aggregator. `condition`
 * is the live signal the aggregator reads on every recompute. `label` is
 * an optional human-readable string included in announcements.
 *
 * @category interfaces
 */
export interface CngxErrorAggregatorSourceEntry {
  readonly key: string;
  readonly condition: Signal<boolean>;
  readonly label?: string | null;
}

/**
 * Contract every {@link CngxErrorAggregator} (or external override) fulfils.
 *
 * The aggregator is the live A11y surface — it computes `hasError` /
 * `errorCount` / `activeErrors` / `errorLabels` / `shouldShow` /
 * `announcement` from its registered sources and exposes them to the
 * surrounding host. Sources register via {@link addSource} on init and
 * deregister via {@link removeSource} on teardown.
 *
 * @category interfaces
 */
export interface CngxErrorAggregatorContract {
  /** `true` when at least one registered source's condition is `true`. */
  readonly hasError: Signal<boolean>;
  /** Count of currently active error sources. */
  readonly errorCount: Signal<number>;
  /** Keys of currently active error sources, in registration order. */
  readonly activeErrors: Signal<readonly string[]>;
  /** Labels of currently active error sources (only entries with non-null labels). */
  readonly errorLabels: Signal<readonly string[]>;
  /** `true` when errors should be visible — `hasError` AND scope reveal-state. */
  readonly shouldShow: Signal<boolean>;
  /** SR-friendly announcement text — joins active labels into one phrase. */
  readonly announcement: Signal<string>;
  /** Registers (or replaces) a source by `key`. */
  addSource(entry: CngxErrorAggregatorSourceEntry): void;
  /** Deregisters the source with `key` (no-op if absent). */
  removeSource(key: string): void;
}

/**
 * DI token resolving to the nearest {@link CngxErrorAggregatorContract}
 * ancestor.
 *
 * Provided by {@link CngxErrorAggregator} via `useExisting`; descendant
 * `CngxErrorSource` directives inject with `{ optional: true }` so they
 * function as no-ops outside an aggregator.
 *
 * @category tokens
 */
export const CNGX_ERROR_AGGREGATOR = new InjectionToken<CngxErrorAggregatorContract>(
  'CngxErrorAggregator',
);
