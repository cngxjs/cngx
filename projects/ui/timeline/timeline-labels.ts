import type { CngxTimelineConfig, TimelineGroup } from '@cngx/common/timeline';

/**
 * The fallback copy the timeline renders when a consumer bound no slot for
 * a surface, resolved once from the config cascade.
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
 * `groupLabel` keeps the band's key as its own last resort: a consumer who
 * clears the formatter should still get a legible header rather than an
 * empty one that leaves the group unnamed.
 *
 * @category ui/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/timeline/timeline-labels.ts
 * @since 0.1.0
 */
export function createTimelineFallbackCopy(config: CngxTimelineConfig): CngxTimelineFallbackCopy {
  const labels = config.labels;
  return {
    retry: labels?.retry ?? '',
    errorFallback: labels?.errorFallback ?? '',
    emptyFallback: labels?.emptyFallback ?? '',
    loading: labels?.loading ?? '',
    refreshing: labels?.refreshing ?? '',
    groupLabel: (group) => labels?.groupLabel?.(group) ?? group.key,
  };
}
