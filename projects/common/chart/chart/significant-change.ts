import { computed, linkedSignal, type Signal } from '@angular/core';

import { type CngxChartSummary } from '../i18n/chart-i18n';

/** @internal */
type Trend = 'up' | 'down' | 'flat';

/**
 * A significant, AT-worthy transition derived from the chart summary:
 * either the trend flipped, or the current value crossed a threshold.
 * A discriminated union - each variant carries exactly its own fields.
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/significant-change.ts
 * @since 0.1.0
 */
export type CngxSignificantChange =
  | { readonly kind: 'trend-flip'; readonly from: Trend; readonly to: Trend }
  | { readonly kind: 'threshold-cross'; readonly threshold: number; readonly direction: 'up' | 'down' };

/** @internal Structural equality so a re-emitted identical event does not cascade. */
function significantChangeEqual(
  a: CngxSignificantChange | null,
  b: CngxSignificantChange | null,
): boolean {
  if (a === b) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'trend-flip' && b.kind === 'trend-flip') {
    return a.from === b.from && a.to === b.to;
  }
  if (a.kind === 'threshold-cross' && b.kind === 'threshold-cross') {
    return a.threshold === b.threshold && a.direction === b.direction;
  }
  return false;
}

/**
 * Derive the most recent significant transition from a chart-summary
 * signal, or `null` when the latest update carried no significance.
 *
 * Mirrors `createTransitionTracker`'s current/previous discipline: an
 * internal `linkedSignal` holds the current summary and the one before it
 * (structural-equality guarded), and the public signal is a `computed`
 * with its own structural `equal` - so a summary that re-emits an
 * equivalent shape yields the same `null` reference and never re-fires a
 * downstream effect. Threshold crossings take precedence over trend flips
 * (they are operationally more significant).
 *
 * The chart stays pure-derivation: effects that react to the event live in
 * the companion announcer, not here.
 *
 * @param summary the chart's `CngxChartSummary` signal.
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/significant-change.ts
 * @since 0.1.0
 */
export function createSignificantChangeTracker(
  summary: Signal<CngxChartSummary>,
): Signal<CngxSignificantChange | null> {
  const pair = linkedSignal<
    CngxChartSummary,
    { current: CngxChartSummary; previous: CngxChartSummary | null }
  >({
    source: summary,
    computation: (current, prev) => ({ current, previous: prev?.value.current ?? null }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  return computed<CngxSignificantChange | null>(
    () => {
      const { current, previous } = pair();
      if (!previous) {
        return null;
      }
      for (const threshold of current.thresholds) {
        const before = previous.current - threshold;
        const after = current.current - threshold;
        if (before !== 0 && after !== 0 && Math.sign(before) !== Math.sign(after)) {
          return { kind: 'threshold-cross', threshold, direction: after > 0 ? 'up' : 'down' };
        }
      }
      if (current.trend !== previous.trend) {
        return { kind: 'trend-flip', from: previous.trend, to: current.trend };
      }
      return null;
    },
    { equal: significantChangeEqual },
  );
}
