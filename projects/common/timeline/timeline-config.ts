import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type Provider,
  type TemplateRef,
} from '@angular/core';

import type { TimelineGroup } from './grouping';
import type { TimelineStatus } from './marker.component';

/**
 * Every user-visible string the timeline can render without a consumer
 * slot, plus the group-header formatter.
 *
 * Library defaults are English. Localise by passing
 * {@link withTimelineLabels} to {@link provideTimelineConfig} once at
 * bootstrap - the timeline itself hardcodes nothing, so a missing
 * translation shows up as English text rather than as a blank surface.
 *
 * Each of these is a *fallback*: the matching template slot
 * (`*cngxTimelineError`, `*cngxTimelineEmpty`, ...) wins whenever it is
 * present.
 *
 * @category common/timeline
 */
export interface CngxTimelineLabels {
  /**
   * Accessible name for the timeline list itself, read when focus or a
   * screen-reader cursor enters the region. Default `'Timeline'`. A
   * per-instance `[aria-label]` / `[aria-labelledby]` wins.
   */
  readonly timelineRegion?: string;
  /**
   * Label on the built-in retry control rendered in the error surface.
   * Default `'Retry'`. Superseded by `*cngxTimelineRetryButton`.
   */
  readonly retry?: string;
  /**
   * Body text for the error surface when no `*cngxTimelineError` slot is
   * bound. Default `'Could not load the timeline.'`
   */
  readonly errorFallback?: string;
  /**
   * Body text for the empty surface when no `*cngxTimelineEmpty` slot is
   * bound. Default `'No events yet.'`
   */
  readonly emptyFallback?: string;
  /**
   * Accessible name for the loading body, so the skeleton is announced
   * as something other than silence. Default `'Loading timeline'`.
   */
  readonly loading?: string;
  /**
   * Text for the refreshing tail appended below the list while a
   * background reload is in flight. Default `'Updating…'`. Superseded by
   * `*cngxTimelineLoadingTail`.
   */
  readonly refreshing?: string;
  /**
   * Screen-reader text for a single item whose own `[state]` is pending.
   * Paired with `aria-busy` on that item. Default `'Updating'`.
   */
  readonly itemBusy?: string;
  /**
   * Inline error text for a single item whose own `[state]` failed, used
   * when the consumer renders no per-item error content. Default
   * `'Could not load this event.'`
   */
  readonly itemErrorFallback?: string;
  /**
   * Screen-reader wording for each process status. The marker paints the
   * status visually and the dot is `aria-hidden`, so this map is the only
   * channel that carries it to assistive tech - leaving a key blank
   * silences that status rather than merely restyling it.
   *
   * Defaults: `Completed` / `In progress` / `Upcoming` / `Rejected`.
   * Partial - {@link withTimelineLabels} merges it key by key, so
   * renaming one status leaves the other three at their defaults.
   */
  readonly status?: Readonly<Partial<Record<TimelineStatus, string>>>;
  /**
   * Formats a group's header when no `*cngxTimelineDateHeader` slot is
   * bound. Receives the whole group so a consumer can fold the item
   * count into the header. Defaults to the group's start date in the
   * browser locale - a date, unlike the strings above, has no sensible
   * English-only default.
   */
  readonly groupLabel?: (group: TimelineGroup<unknown>) => string;
}

/**
 * App-wide template defaults for the timeline's slot regions - the
 * middle tier of the family-standard 3-stage cascade
 * (per-instance directive > this field > built-in markup).
 *
 * Apply via the matching `with*Template` builders.
 *
 * @category common/timeline
 */
export interface CngxTimelineTemplates {
  /** Default for the per-group date header (`*cngxTimelineDateHeader`). */
  readonly dateHeader?: TemplateRef<{ readonly $implicit: TimelineGroup<unknown> }>;
}

/**
 * Timeline config surface. Resolution priority: \
 * per-instance Input → `provideTimelineConfigAt` (viewProviders) →
 * `provideTimelineConfig` (root) → library default.
 *
 * Deliberately small: the timeline has no behavioural switches to
 * configure, so this carries text and templates only. Bucketing is
 * swapped through {@link CNGX_TIMELINE_GROUPING_FACTORY} instead, and
 * everything visual through the slot directives.
 *
 * @category common/timeline
 */
export interface CngxTimelineConfig {
  readonly labels?: CngxTimelineLabels;
  readonly templates?: CngxTimelineTemplates;
}

const TIMELINE_CONFIG_DEFAULTS: Required<CngxTimelineConfig> = {
  labels: {
    timelineRegion: 'Timeline',
    retry: 'Retry',
    errorFallback: 'Could not load the timeline.',
    emptyFallback: 'No events yet.',
    loading: 'Loading timeline',
    refreshing: 'Updating…',
    itemBusy: 'Updating',
    itemErrorFallback: 'Could not load this event.',
    status: {
      done: 'Completed',
      active: 'In progress',
      upcoming: 'Upcoming',
      rejected: 'Rejected',
    },
    groupLabel: (group) => group.start.toLocaleDateString(),
  },
  templates: {},
};

/**
 * DI token for the resolved timeline config. \
 * `providedIn: 'root'` with the library defaults; override via
 * {@link provideTimelineConfig} (root) or {@link provideTimelineConfigAt}
 * (component scope).
 *
 * @category common/timeline
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/timeline-config.ts
 * @relatedTo provideTimelineConfig
 * @relatedTo withTimelineLabels
 * @since 0.1.0
 */
export const CNGX_TIMELINE_CONFIG = new InjectionToken<CngxTimelineConfig>('CngxTimelineConfig', {
  providedIn: 'root',
  factory: () => TIMELINE_CONFIG_DEFAULTS,
});

/**
 * Signature of every `with*` timeline config builder - a pure
 * config-to-config mutator, folded left over the library defaults.
 *
 * @category common/timeline
 */
export type CngxTimelineConfigFeature = (config: CngxTimelineConfig) => CngxTimelineConfig;

/**
 * Merge label overrides into the cascade. Keys left out keep their
 * English library default, so a consumer translates what they need and
 * nothing more.
 *
 * ```ts
 * provideTimelineConfig(
 *   withTimelineLabels({
 *     retry: 'Erneut versuchen',
 *     emptyFallback: 'Noch keine Ereignisse.',
 *     groupLabel: (group) => group.start.toLocaleDateString('de-AT'),
 *   }),
 * )
 * ```
 *
 * @category common/timeline
 */
export function withTimelineLabels(labels: CngxTimelineLabels): CngxTimelineConfigFeature {
  return (config) => ({
    ...config,
    labels: {
      ...config.labels,
      ...labels,
      // One level deeper than the rest: `status` is a map, and a shallow
      // spread would let a consumer who renames one status silently
      // silence the other three.
      status: { ...config.labels?.status, ...labels.status },
    },
  });
}

function resolveFeatures(features: readonly CngxTimelineConfigFeature[]): CngxTimelineConfig {
  return features.reduce<CngxTimelineConfig>(
    (config, feature) => feature(config),
    TIMELINE_CONFIG_DEFAULTS,
  );
}

/**
 * Root-level provider. Apply once in `bootstrapApplication` /
 * `appConfig.providers`.
 *
 * @category common/timeline
 */
export function provideTimelineConfig(
  ...features: readonly CngxTimelineConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_TIMELINE_CONFIG, useValue: resolveFeatures(features) },
  ]);
}

/**
 * Component-scoped override. Returns `Provider[]` rather than
 * {@link EnvironmentProviders} because `viewProviders` rejects opaque
 * environment providers.
 *
 * Each call resolves against the library defaults, not against whatever
 * the root provider set - a scoped override states its full intent
 * rather than inheriting half of an app-wide one.
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideTimelineConfigAt(withTimelineLabels({ retry: 'Again' }))],
 * })
 * ```
 *
 * @category common/timeline
 */
export function provideTimelineConfigAt(
  ...features: readonly CngxTimelineConfigFeature[]
): Provider[] {
  return [{ provide: CNGX_TIMELINE_CONFIG, useValue: resolveFeatures(features) }];
}

/**
 * Read the resolved timeline config. Runs in an injection context.
 *
 * @category common/timeline
 */
export function injectTimelineConfig(): CngxTimelineConfig {
  return inject(CNGX_TIMELINE_CONFIG);
}
