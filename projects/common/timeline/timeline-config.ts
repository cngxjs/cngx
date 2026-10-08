import {
  computed,
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Optional,
  type Provider,
  type Signal,
  SkipSelf,
  type TemplateRef,
} from '@angular/core';
import { createNestedLanguageSection, formatMessage } from '@cngx/core/i18n';
import { createNestedOverrideMerge, dateTimeFormatterFor } from '@cngx/core/utils';

import {
  CNGX_TIMELINE_LANGUAGE_EN,
  type CngxTimelineLanguageSection,
} from './i18n/timeline-language-section';

import type { TimelineGroup } from './grouping';
import type { TimelineStatus } from './marker.component';
import type {
  CngxTimelineDateHeaderContext,
  CngxTimelineEmptyContext,
  CngxTimelineErrorContext,
  CngxTimelineItemContext,
  CngxTimelineMarkerContext,
  CngxTimelineRetryButtonContext,
} from './template-slots';

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
   * bound. Default `'No events yet'`
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
   * count into the header. The second argument is the app locale
   * (`CNGX_LOCALE`, falling back to the nearest `LOCALE_ID`), read live,
   * so a formatter that uses it follows a locale switch. Defaults to the
   * group's start date as a numeric date in that locale, placed by the
   * `groupHeader` message of the timeline language section.
   */
  readonly groupLabel?: (group: TimelineGroup<unknown>, locale: string) => string;
}

/**
 * App-wide template defaults for the timeline's slot regions - the middle
 * tier of the family-standard 3-stage cascade
 * (per-instance directive > this field > built-in markup).
 *
 * Set them with {@link withTimelineTemplates}. Keys are typed against
 * `unknown` items because the config is app-wide while the slots are
 * generic; a `TemplateRef` for a concrete item type assigns in fine.
 *
 * @category common/timeline
 */
export interface CngxTimelineTemplates {
  /** Default row template (`*cngxTimelineItem`). */
  readonly item?: TemplateRef<CngxTimelineItemContext<unknown>>;
  /** Default per-group date header (`*cngxTimelineDateHeader`). */
  readonly dateHeader?: TemplateRef<CngxTimelineDateHeaderContext<unknown>>;
  /** Default marker content (`*cngxTimelineMarkerTpl`). */
  readonly marker?: TemplateRef<CngxTimelineMarkerContext<unknown>>;
  /** Default empty surface (`*cngxTimelineEmpty`). */
  readonly empty?: TemplateRef<CngxTimelineEmptyContext>;
  /** Default error surface (`*cngxTimelineError`). */
  readonly error?: TemplateRef<CngxTimelineErrorContext>;
  /** Default retry control (`*cngxTimelineRetryButton`). */
  readonly retryButton?: TemplateRef<CngxTimelineRetryButtonContext>;
  /** Default refreshing tail (`*cngxTimelineLoadingTail`). */
  readonly loadingTail?: TemplateRef<void>;
  /** Default placeholder row for the first-load body (`*cngxTimelineSkeleton`). */
  readonly skeleton?: TemplateRef<void>;
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
  /**
   * A plain bundle or a `Signal` of one; once {@link withTimelineLabels} ran
   * it holds a `Signal`, so the copy follows a runtime language switch. Read
   * it through `coerceSignal` from `@cngx/core/utils`.
   */
  readonly labels?: CngxTimelineLabels | Signal<CngxTimelineLabels>;
  readonly templates?: CngxTimelineTemplates;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {};

/** @internal Turns a timeline section into the config labels. */
function timelineLabelsFrom(section: CngxTimelineLanguageSection): CngxTimelineLabels {
  return {
    timelineRegion: section.timelineRegion,
    retry: section.retry,
    errorFallback: section.errorFallback,
    emptyFallback: section.emptyFallback,
    loading: section.loading,
    refreshing: section.refreshing,
    itemBusy: section.itemBusy,
    itemErrorFallback: section.itemErrorFallback,
    status: section.status,
    groupLabel: (group, locale) =>
      formatMessage(
        section.groupHeader,
        { date: dateTimeFormatterFor(locale, DATE_FORMAT).format(group.start) },
        locale,
      ),
  };
}

const LABELS_BY_SECTION = new WeakMap<CngxTimelineLanguageSection, CngxTimelineLabels>();

/**
 * @internal The labels of one section object, built once: an equal section
 * yields the identical labels, so readers compare by reference. The locale
 * reaches `groupLabel` as its argument, so the labels do not depend on it.
 */
function labelsOf(section: CngxTimelineLanguageSection): CngxTimelineLabels {
  let labels = LABELS_BY_SECTION.get(section);
  if (!labels) {
    labels = timelineLabelsFrom(section);
    LABELS_BY_SECTION.set(section, labels);
  }
  return labels;
}

const TIMELINE_CONFIG_DEFAULTS: Required<CngxTimelineConfig> = {
  labels: timelineLabelsFrom(CNGX_TIMELINE_LANGUAGE_EN),
  templates: {},
};

/** @internal The timeline section of the active pack over the English section. */
const injectTimelineSection = createNestedLanguageSection(
  'timeline',
  CNGX_TIMELINE_LANGUAGE_EN,
  'status',
);

/**
 * @internal The defaults with `labels` read from the timeline section of the
 * active language pack. Runs in an injection context.
 */
function timelineConfigDefaultsFromPack(): CngxTimelineConfig {
  const section = injectTimelineSection();
  return { ...TIMELINE_CONFIG_DEFAULTS, labels: computed(() => labelsOf(section())) };
}

/**
 * DI token for the resolved timeline config. \
 * `providedIn: 'root'` with the library defaults, `labels` read from the
 * timeline section of the active language pack; override via
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
  factory: timelineConfigDefaultsFromPack,
});

/**
 * Signature of every `with*` timeline config builder - a pure
 * config-to-config mutator, folded left over the library defaults.
 *
 * @category common/timeline
 */
export type CngxTimelineConfigFeature = (config: CngxTimelineConfig) => CngxTimelineConfig;

/**
 * @internal Shared empty bundle for a config without `labels`. One identity,
 * so every `coerceSignal` over it resolves to the same cached source.
 */
export const TIMELINE_NO_LABELS: CngxTimelineLabels = {};

/**
 * Merge label overrides into the cascade. Keys left out keep the language
 * pack's copy, or the English library default, so a consumer translates
 * what they need and nothing more. Pass a `Signal` to switch the language at runtime.
 *
 * ```ts
 * provideTimelineConfig(
 *   withTimelineLabels({
 *     retry: 'Erneut versuchen',
 *     emptyFallback: 'Noch keine Ereignisse.',
 *     groupLabel: (group, locale) => group.start.toLocaleDateString(locale, { dateStyle: 'medium' }),
 *   }),
 * )
 * ```
 *
 * @category common/timeline
 */
export function withTimelineLabels(
  labels: CngxTimelineLabels | Signal<CngxTimelineLabels>,
): CngxTimelineConfigFeature {
  return (config) => ({
    ...config,
    // One level deeper than the rest: `status` is a map, and a shallow
    // spread would let a consumer who renames one status silently
    // silence the other three.
    labels: createNestedOverrideMerge<CngxTimelineLabels, 'status'>(
      config.labels ?? TIMELINE_NO_LABELS,
      labels,
      'status',
    ),
  });
}

/**
 * Merge app-wide slot template defaults into the cascade. Keys left out
 * keep whatever an earlier feature set, and a per-instance slot directive
 * still wins over anything set here.
 *
 * One bag rather than a `with*Template` builder per slot, matching how the
 * select family carries its own slot defaults - the timeline has eight
 * slots and near-identical builders would only add surface.
 *
 * ```ts
 * readonly emptyTpl = viewChild.required<TemplateRef<CngxTimelineEmptyContext>>('emptyTpl', {
 *   read: TemplateRef,
 * });
 *
 * providers: [provideTimelineConfig(withTimelineTemplates({ empty: this.emptyTpl() }))]
 * ```
 *
 * @category common/timeline
 */
export function withTimelineTemplates(templates: CngxTimelineTemplates): CngxTimelineConfigFeature {
  return (config) => ({ ...config, templates: { ...config.templates, ...templates } });
}

function applyFeatures(
  base: CngxTimelineConfig,
  features: readonly CngxTimelineConfigFeature[],
): CngxTimelineConfig {
  return features.reduce<CngxTimelineConfig>((config, feature) => feature(config), base);
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
    {
      provide: CNGX_TIMELINE_CONFIG,
      useFactory: () => applyFeatures(timelineConfigDefaultsFromPack(), features),
    },
  ]);
}

/**
 * Component-scoped override. Returns `Provider[]` rather than
 * {@link EnvironmentProviders} because `viewProviders` rejects opaque
 * environment providers.
 *
 * Features merge onto the parent config - an enclosing scope, or the root
 * provider, or the library defaults when neither is present - so a region
 * can re-phrase one label without resetting every other one the app set.
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
  return [
    {
      provide: CNGX_TIMELINE_CONFIG,
      useFactory: (parent: CngxTimelineConfig | null) =>
        applyFeatures(parent ?? timelineConfigDefaultsFromPack(), features),
      deps: [[new SkipSelf(), new Optional(), CNGX_TIMELINE_CONFIG]],
    },
  ];
}

/**
 * Read the resolved timeline config. Runs in an injection context.
 *
 * @category common/timeline
 */
export function injectTimelineConfig(): CngxTimelineConfig {
  return inject(CNGX_TIMELINE_CONFIG);
}
