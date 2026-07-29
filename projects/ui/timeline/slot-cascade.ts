import { computed, type Signal, type TemplateRef } from '@angular/core';
import type {
  CngxTimelineDateHeaderContext,
  CngxTimelineEmptyContext,
  CngxTimelineErrorContext,
  CngxTimelineItemContext,
  CngxTimelineMarkerContext,
  CngxTimelineRetryButtonContext,
  CngxTimelineTemplates,
} from '@cngx/common/timeline';

/**
 * Anything a cngx slot directive exposes: its own `TemplateRef`. Structural
 * rather than a base class, so a consumer's own slot directive satisfies it
 * by shape alone.
 *
 * @category ui/timeline
 */
export interface CngxTimelineSlotSource<C> {
  readonly templateRef: TemplateRef<C>;
}

/**
 * The family-standard three-stage template cascade, as one named concept:
 *
 * ```text
 * instance contentChild  ->  CNGX_*_CONFIG.templates.<key>  ->  null
 * ```
 *
 * The `contentChild()` query itself has to stay a direct field initialiser
 * on the component (AOT rejects it from a helper, NG8110), but resolving the
 * three tiers does not - and writing that resolution out once per slot turns
 * a single rule into eight places it can drift.
 *
 * `configured` is a thunk rather than a value so the config tier is read at
 * resolution time, inside the `computed()`.
 *
 * Exported because an ejected skin resolves the same three tiers and would
 * otherwise have to restate the rule.
 *
 * @category ui/timeline
 * @relatedTo createTimelineSlots
 * @since 0.1.0
 */
export function createTimelineSlotBinding<C>(
  instance: Signal<CngxTimelineSlotSource<C> | undefined>,
  configured: () => TemplateRef<C> | undefined,
): Signal<TemplateRef<C> | null> {
  return computed(() => instance()?.templateRef ?? configured() ?? null);
}

/**
 * The eight `contentChild()` queries a timeline runs, handed over as one bag
 * because AOT requires them to be declared on the component itself.
 *
 * @category ui/timeline
 */
export interface CngxTimelineSlotQueries<T> {
  readonly item: Signal<CngxTimelineSlotSource<CngxTimelineItemContext<T>> | undefined>;
  readonly dateHeader: Signal<CngxTimelineSlotSource<CngxTimelineDateHeaderContext<T>> | undefined>;
  readonly marker: Signal<CngxTimelineSlotSource<CngxTimelineMarkerContext<T>> | undefined>;
  readonly empty: Signal<CngxTimelineSlotSource<CngxTimelineEmptyContext> | undefined>;
  readonly error: Signal<CngxTimelineSlotSource<CngxTimelineErrorContext> | undefined>;
  readonly retryButton: Signal<CngxTimelineSlotSource<CngxTimelineRetryButtonContext> | undefined>;
  readonly loadingTail: Signal<CngxTimelineSlotSource<void> | undefined>;
  readonly skeleton: Signal<CngxTimelineSlotSource<void> | undefined>;
}

/**
 * The same eight, resolved. Every member is already through the cascade, so
 * the template reads one signal per region and never restates the rule.
 *
 * @category ui/timeline
 */
export interface CngxTimelineSlots<T> {
  readonly item: Signal<TemplateRef<CngxTimelineItemContext<T>> | null>;
  readonly dateHeader: Signal<TemplateRef<CngxTimelineDateHeaderContext<T>> | null>;
  readonly marker: Signal<TemplateRef<CngxTimelineMarkerContext<T>> | null>;
  readonly empty: Signal<TemplateRef<CngxTimelineEmptyContext> | null>;
  readonly error: Signal<TemplateRef<CngxTimelineErrorContext> | null>;
  readonly retryButton: Signal<TemplateRef<CngxTimelineRetryButtonContext> | null>;
  readonly loadingTail: Signal<TemplateRef<void> | null>;
  readonly skeleton: Signal<TemplateRef<void> | null>;
}

/**
 * Runs {@link createTimelineSlotBinding} over the whole slot set at once, so
 * the organism holds one field instead of eight near-identical ones and each
 * region has exactly one call site.
 *
 * The casts live here rather than at eight use sites: `CngxTimelineTemplates`
 * is typed against `unknown` items because the config is app-wide while the
 * slots are generic. `TemplateRef` is method-bivariant, so a consumer's
 * concrete template still assigns in.
 *
 * @category ui/timeline
 * @relatedTo createTimelineSlotBinding
 * @since 0.1.0
 */
export function createTimelineSlots<T>(
  queries: CngxTimelineSlotQueries<T>,
  templates: () => CngxTimelineTemplates | undefined,
): CngxTimelineSlots<T> {
  const pick = <C,>(key: keyof CngxTimelineTemplates): TemplateRef<C> | undefined =>
    templates()?.[key] as TemplateRef<C> | undefined;

  return {
    item: createTimelineSlotBinding(queries.item, () => pick('item')),
    dateHeader: createTimelineSlotBinding(queries.dateHeader, () => pick('dateHeader')),
    marker: createTimelineSlotBinding(queries.marker, () => pick('marker')),
    empty: createTimelineSlotBinding(queries.empty, () => pick('empty')),
    error: createTimelineSlotBinding(queries.error, () => pick('error')),
    retryButton: createTimelineSlotBinding(queries.retryButton, () => pick('retryButton')),
    loadingTail: createTimelineSlotBinding(queries.loadingTail, () => pick('loadingTail')),
    skeleton: createTimelineSlotBinding(queries.skeleton, () => pick('skeleton')),
  };
}
