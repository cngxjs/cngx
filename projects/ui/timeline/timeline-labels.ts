import { computed, type Signal } from '@angular/core';
import type { CngxTimelineConfig, CngxTimelineLabels, TimelineGroup } from '@cngx/common/timeline';
import { coerceSignal } from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

/**
 * @internal Shared empty bundle for a config without `labels`. One identity,
 * so every `coerceSignal` over it resolves to the same cached source.
 */
export const TIMELINE_NO_LABELS: CngxTimelineLabels = {};

/**
 * The fallback copy the timeline renders when a consumer bound no slot for
 * a surface, resolved from the config cascade.
 *
 * @category ui/timeline
 */
export interface CngxTimelineFallbackCopy {
  readonly retry: string;
  readonly errorFallback: string;
  readonly emptyFallback: string;
  readonly loading: string;
  readonly refreshing: string;
  readonly groupLabel: (group: TimelineGroup<unknown>) => string;
}

/**
 * Flattens the config's optional label bag into the exact set the template
 * reads, so the template names what it wants rather than indexing a keyed
 * accessor, and the optional-chaining lives in one place instead of at every
 * use site.
 *
 * Returns a `Signal`: when the config's `labels` is a `Signal` (as it is once
 * `withTimelineLabels` ran), the copy follows a runtime language switch. The
 * bundle keeps its reference while the resolved strings stay equal.
 *
 * `groupLabel` keeps the band's key as its own last resort: a consumer who
 * clears the formatter should still get a legible header rather than an
 * empty one that leaves the group unnamed.
 *
 * @category ui/timeline
 * @since 0.1.0
 */
export function createTimelineFallbackCopy(
  config: CngxTimelineConfig,
): Signal<CngxTimelineFallbackCopy> {
  const source = coerceSignal<CngxTimelineLabels>(config.labels ?? TIMELINE_NO_LABELS);
  // The wrapper closure is rebuilt only when the consumer formatter itself
  // changes, so an unrelated label flip keeps `groupLabel` reference-stable.
  const formatter = computed(() => source().groupLabel);
  const groupLabel = computed(() => {
    const format = formatter();
    return (group: TimelineGroup<unknown>): string => format?.(group) ?? group.key;
  });
  return computed(
    () => {
      const labels = source();
      return {
        retry: labels.retry ?? '',
        errorFallback: labels.errorFallback ?? '',
        emptyFallback: labels.emptyFallback ?? '',
        loading: labels.loading ?? '',
        refreshing: labels.refreshing ?? '',
        groupLabel: groupLabel(),
      };
    },
    { equal: recordEqual },
  );
}
