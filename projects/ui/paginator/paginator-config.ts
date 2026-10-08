import {
  computed,
  inject,
  InjectionToken,
  isSignal,
  makeEnvironmentProviders,
  Optional,
  SkipSelf,
  type EnvironmentProviders,
  type Provider,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { createFilledOverrideMerge, createOverrideMerge } from '@cngx/core/utils';

import { injectPaginatorSiteCopy } from './i18n/paginator-i18n';

/**
 * Accessible-name strings for the paginator landmark and its segment parts.
 * The defaults come from the `paginator` section of the language pack
 * (English without one); {@link withPaginatorAriaLabels} overrides single keys.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export interface CngxPaginatorAriaLabels {
  /** Accessible name for the `role="navigation"` landmark. */
  readonly label: string;
  /** First-page button. */
  readonly first: string;
  /** Previous-page button. */
  readonly previous: string;
  /** Next-page button. */
  readonly next: string;
  /** Last-page button. */
  readonly last: string;
  /** A page button, given its 1-based display number. */
  readonly page: (page: number) => string;
  /** The ellipsis overflow trigger that reveals hidden pages. */
  readonly morePages: string;
  /** Page-size selector. */
  readonly itemsPerPage: string;
  /** Go-to-page input. */
  readonly goToPage: string;
  /** Page-of-pages selector (the `current / total` jump dropdown). */
  readonly pageOfPages: string;
  /** Load-more trigger while pages remain (the append-style "reveal next page" button). */
  readonly loadMore: string;
  /**
   * Load-more trigger once every page is revealed, given the total item count.
   * Replaces the actionable `loadMore` name on the exhausted (last-page) button
   * so AT does not announce a "Load more" action on a disabled control.
   */
  readonly allLoaded: (total: number) => string;
  /** A category/range chip, given its bucket label (e.g. `'A-C'`). */
  readonly bucket: (label: string) => string;
  /**
   * A category/range chip with no matching items, given its bucket label.
   * Names the disabled chip AND states why it is disabled, so an empty bucket
   * is not a silent dead control.
   */
  readonly emptyBucket: (label: string) => string;
  /** Accessible name for the category/range chip strip (`role="group"`). */
  readonly bucketGroup: string;
  /**
   * Accessible name for the `rail` skin's progress rail. Becomes the composed
   * `cngx-progress` `[label]`, so AT reads "Page position" with the progressbar
   * value the atom exposes.
   */
  readonly railPosition: string;
}

/**
 * Display-text formatters for the data-readout segments. The defaults come
 * from the `paginator` section of the language pack, numbers formatted for the
 * locale; the `withPaginator*Format` features override single keys.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export interface CngxPaginatorFormats {
  /**
   * Range-readout text, given the 1-based first item, last item, and total.
   * The `cngx-pgn-range` segment renders the returned string as sanitised HTML,
   * so inline emphasis (e.g. `<b>` around the current range) is honoured; the
   * default bolds the range. Angular's sanitiser strips anything unsafe.
   */
  readonly range: (start: number, end: number, total: number) => string;
  /**
   * Page-status text, given the 1-based current page and total page count.
   * The `cngx-pgn-status` segment renders the returned string as sanitised HTML
   * (the default bolds the page); it is the visible twin of the
   * `announcements.pageChange` live-region phrasing, which stays plain text.
   */
  readonly pageStatus: (page: number, totalPages: number) => string;
  /**
   * Trigger readout of the `cngx-pgn-page-of-pages` dropdown, given the 1-based
   * current page and total page count. Rendered as sanitised HTML (the default
   * bolds the page). Optional for compatibility with full configs written before
   * it existed; the language-pack default applies when absent.
   */
  readonly pageOfPagesReadout?: (page: number, totalPages: number) => string;
  /**
   * Visible progress readout of the `cngx-pgn-load-more` button, given the items
   * revealed so far and the total. Plain text, decorative (`aria-hidden`); the
   * button's accessible name stays `ariaLabels.loadMore`. Optional for the same
   * compatibility reason as {@link CngxPaginatorFormats.pageOfPagesReadout}.
   */
  readonly loadMoreReadout?: (shown: number, total: number) => string;
}

/**
 * Live-region announcement phrasing. The paginator announces the effective page
 * on every change (navigation or a `total`-shrink clamp, so the clamp is never
 * silent) and the async busy / settle transitions. The defaults come from the
 * `paginator` section of the language pack; {@link withPaginatorAnnouncements}
 * overrides single keys.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export interface CngxPaginatorAnnouncements {
  /** Announced on every page change, given the 1-based page and total pages. */
  readonly pageChange: (page: number, totalPages: number) => string;
  /** Announced when the bound async state becomes busy. */
  readonly loading: string;
  /** Announced when the bound async state settles after being busy. */
  readonly updated: string;
}

/**
 * Application-wide template-slot defaults. The instance `*cngxPaginatorLoading`
 * slot still wins over the cascade; this tier supplies a shared override when no
 * per-instance slot is projected. Library default is unset (the built-in
 * `CngxProgress` bar renders).
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export interface CngxPaginatorTemplates {
  /** Busy indicator shown while the bound async state is busy. */
  readonly loading?: TemplateRef<unknown>;
}

/**
 * Resolved paginator configuration. Three copy sub-trees - accessible-name
 * strings, live-region announcement phrasing, and data-readout formatters -
 * plus a flat `pageSizeOptions` list and an optional `templates` slot tree,
 * each merged independently by the reducer in
 * {@link provideCngxPaginatorConfig}.
 *
 * The copy sub-trees hold overrides only: unset by default, a partial value or
 * a `Signal` of one once a feature ran. Every key they leave out reads the
 * `paginator` section of the language pack, so the paginator follows a runtime
 * language switch. Read the resolved copy through
 * {@link injectPaginatorAriaLabels}, {@link injectPaginatorAnnouncements} and
 * {@link injectPaginatorFormats}, inside a `computed()`, a template or a handler.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export interface CngxPaginatorConfig {
  readonly ariaLabels?: Partial<CngxPaginatorAriaLabels> | Signal<Partial<CngxPaginatorAriaLabels>>;
  readonly announcements?:
    | Partial<CngxPaginatorAnnouncements>
    | Signal<Partial<CngxPaginatorAnnouncements>>;
  readonly formats?: Partial<CngxPaginatorFormats> | Signal<Partial<CngxPaginatorFormats>>;
  /**
   * Default items-per-page choices the `cngx-pgn-page-size` dropdown renders
   * when no per-instance `[options]` is bound. The instance input still wins
   * when it is non-empty; this is the cascade fallback so the segment needs no
   * boilerplate. Replaced wholesale (not merged) by
   * {@link withPaginatorPageSizeOptions} - a size list is one atomic value.
   */
  readonly pageSizeOptions: readonly number[];
  readonly templates?: CngxPaginatorTemplates;
}

/**
 * Library defaults. Carries no copy: the copy defaults are the `paginator`
 * section of the language pack. Override via {@link provideCngxPaginatorConfig}.
 */
export const CNGX_PAGINATOR_DEFAULTS: CngxPaginatorConfig = {
  // Includes the brain's default pageSize (10) so the trigger value is always a
  // member of the panel; a common data-table ladder, locale-neutral.
  pageSizeOptions: [10, 25, 50, 100],
};

/**
 * Configuration cascade token. Resolution priority (high to low):
 * per-instance Input, then `provideCngxPaginatorConfig(...)` at the
 * application root, then the library defaults.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export const CNGX_PAGINATOR_CONFIG = new InjectionToken<CngxPaginatorConfig>(
  'CngxPaginatorConfig',
  {
    providedIn: 'root',
    factory: () => CNGX_PAGINATOR_DEFAULTS,
  },
);

/**
 * A single configuration override produced by a `with*` feature factory.
 * The reducer in {@link provideCngxPaginatorConfig} matches on `kind` and
 * shallow-merges `payload` into the matching sub-tree - except
 * `pageSizeOptions`, whose payload replaces the list wholesale.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export type CngxPaginatorConfigFeature =
  | {
      readonly kind: 'ariaLabels';
      readonly payload: Partial<CngxPaginatorAriaLabels> | Signal<Partial<CngxPaginatorAriaLabels>>;
    }
  | {
      readonly kind: 'announcements';
      readonly payload:
        | Partial<CngxPaginatorAnnouncements>
        | Signal<Partial<CngxPaginatorAnnouncements>>;
    }
  | {
      readonly kind: 'formats';
      readonly payload: Partial<CngxPaginatorFormats> | Signal<Partial<CngxPaginatorFormats>>;
    }
  | { readonly kind: 'pageSizeOptions'; readonly payload: readonly number[] }
  | { readonly kind: 'templates'; readonly payload: Partial<CngxPaginatorTemplates> };

/** One `formats` key as a feature payload, a value or a Signal. */
function formatPayload<K extends keyof CngxPaginatorFormats>(
  key: K,
  value: NonNullable<CngxPaginatorFormats[K]> | Signal<NonNullable<CngxPaginatorFormats[K]>>,
): Partial<CngxPaginatorFormats> | Signal<Partial<CngxPaginatorFormats>> {
  if (isSignal(value)) {
    return computed(() => ({ [key]: value() }) as Partial<CngxPaginatorFormats>);
  }
  return { [key]: value } as Partial<CngxPaginatorFormats>;
}

/** Reduce a feature list onto a base config, merging each sub-tree in isolation. */
const NO_ARIA_LABELS: Partial<CngxPaginatorAriaLabels> = {};
const NO_ANNOUNCEMENTS: Partial<CngxPaginatorAnnouncements> = {};
const NO_FORMATS: Partial<CngxPaginatorFormats> = {};

function applyFeatures(
  base: CngxPaginatorConfig,
  features: readonly CngxPaginatorConfigFeature[],
): CngxPaginatorConfig {
  let ariaLabels = base.ariaLabels;
  let announcements = base.announcements;
  let formats = base.formats;
  let pageSizeOptions = base.pageSizeOptions;
  let templates = base.templates;
  for (const feature of features) {
    if (feature.kind === 'ariaLabels') {
      ariaLabels = createOverrideMerge(ariaLabels ?? NO_ARIA_LABELS, feature.payload);
    } else if (feature.kind === 'announcements') {
      announcements = createOverrideMerge(announcements ?? NO_ANNOUNCEMENTS, feature.payload);
    } else if (feature.kind === 'formats') {
      formats = createOverrideMerge(formats ?? NO_FORMATS, feature.payload);
    } else if (feature.kind === 'pageSizeOptions') {
      // A size list is one atomic value - replace, do not merge.
      pageSizeOptions = feature.payload;
    } else {
      templates = { ...templates, ...feature.payload };
    }
  }
  return { ariaLabels, announcements, formats, pageSizeOptions, templates };
}

/**
 * Override any subset of the paginator accessible-name strings. Per-instance
 * `aria-label` bindings still win over the cascade for the landmark name. Pass
 * a `Signal` to switch the language at runtime.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorAriaLabels({ next: 'Nächste Seite', previous: 'Vorige Seite' }),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorAriaLabels(
  payload: Partial<CngxPaginatorAriaLabels> | Signal<Partial<CngxPaginatorAriaLabels>>,
): CngxPaginatorConfigFeature {
  return { kind: 'ariaLabels', payload };
}

/**
 * Override any subset of the paginator live-region announcement phrasing. Pass
 * a `Signal` to switch the language at runtime; the live region speaks the new
 * phrasing with its next change.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorAnnouncements({
 *     pageChange: (page, total) => `Seite ${page} von ${total}`,
 *     loading: 'Wird geladen',
 *     updated: 'Aktualisiert',
 *   }),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorAnnouncements(
  payload: Partial<CngxPaginatorAnnouncements> | Signal<Partial<CngxPaginatorAnnouncements>>,
): CngxPaginatorConfigFeature {
  return { kind: 'announcements', payload };
}

/**
 * Override the range-readout format. The `cngx-pgn-range` segment renders the
 * returned string verbatim, so this also localises the `of` connector.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorRangeFormat((start, end, total) => `${start}-${end} von ${total}`),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorRangeFormat(
  range: CngxPaginatorFormats['range'] | Signal<CngxPaginatorFormats['range']>,
): CngxPaginatorConfigFeature {
  return { kind: 'formats', payload: formatPayload('range', range) };
}

/**
 * Override the page-status format. The `cngx-pgn-status` segment renders the
 * returned string verbatim, so this localises the "Page n of m" readout that
 * the responsive collapse reveals.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorPageStatusFormat((page, totalPages) => `Seite ${page} von ${totalPages}`),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorPageStatusFormat(
  pageStatus: CngxPaginatorFormats['pageStatus'] | Signal<CngxPaginatorFormats['pageStatus']>,
): CngxPaginatorConfigFeature {
  return { kind: 'formats', payload: formatPayload('pageStatus', pageStatus) };
}

/**
 * Override the page-of-pages trigger readout. The `cngx-pgn-page-of-pages`
 * segment renders the returned string as sanitised HTML, so this localises the
 * `a / b` separator and its order.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorPageOfPagesFormat((page, totalPages) => `<b>${page}</b> von ${totalPages}`),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorPageOfPagesFormat(
  pageOfPagesReadout:
    | NonNullable<CngxPaginatorFormats['pageOfPagesReadout']>
    | Signal<NonNullable<CngxPaginatorFormats['pageOfPagesReadout']>>,
): CngxPaginatorConfigFeature {
  return { kind: 'formats', payload: formatPayload('pageOfPagesReadout', pageOfPagesReadout) };
}

/**
 * Override the load-more progress readout. The `cngx-pgn-load-more` segment
 * renders the returned string as plain text beside its label.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorLoadMoreFormat((shown, total) => `${shown} von ${total}`),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorLoadMoreFormat(
  loadMoreReadout:
    | NonNullable<CngxPaginatorFormats['loadMoreReadout']>
    | Signal<NonNullable<CngxPaginatorFormats['loadMoreReadout']>>,
): CngxPaginatorConfigFeature {
  return { kind: 'formats', payload: formatPayload('loadMoreReadout', loadMoreReadout) };
}

/**
 * Supply the default items-per-page choices for the `cngx-pgn-page-size`
 * dropdown app-wide. The segment renders these when no per-instance `[options]`
 * is bound; a non-empty `[options]` input still wins. The list replaces the
 * library default wholesale - it is one atomic value, not a merged sub-tree.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorPageSizeOptions([12, 24, 48]),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorPageSizeOptions(
  payload: readonly number[],
): CngxPaginatorConfigFeature {
  return { kind: 'pageSizeOptions', payload };
}

/**
 * Supply application-wide template-slot defaults for the paginator. The
 * per-instance `*cngxPaginatorLoading` slot still wins over this tier; it only
 * applies where no instance slot is projected.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorTemplates({ loading: myBrandedSpinnerTemplate }),
 * );
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function withPaginatorTemplates(
  payload: Partial<CngxPaginatorTemplates>,
): CngxPaginatorConfigFeature {
  return { kind: 'templates', payload };
}

/**
 * Application-root configuration cascade for the paginator. Pass any
 * combination of `with*` features in `bootstrapApplication`'s providers.
 * Supplied features deep-merge with the library defaults, so consumers only
 * declare the keys they want to override.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function provideCngxPaginatorConfig(
  ...features: CngxPaginatorConfigFeature[]
): EnvironmentProviders {
  // Empty-features: leave the root default reference untouched so downstream
  // identity comparisons stay stable.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  return makeEnvironmentProviders([
    { provide: CNGX_PAGINATOR_CONFIG, useValue: applyFeatures(CNGX_PAGINATOR_DEFAULTS, features) },
  ]);
}

/**
 * Component-scoped paginator configuration override. Pass into a component's
 * or directive's `viewProviders`; features merge on top of the parent config
 * (an enclosing scope or the application root), so a region can re-phrase its
 * announcements or labels without disturbing the rest of the app.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function provideCngxPaginatorConfigAt(
  ...features: CngxPaginatorConfigFeature[]
): Provider[] {
  return [
    {
      provide: CNGX_PAGINATOR_CONFIG,
      useFactory: (parent: CngxPaginatorConfig | null) =>
        applyFeatures(parent ?? CNGX_PAGINATOR_DEFAULTS, features),
      deps: [[new SkipSelf(), new Optional(), CNGX_PAGINATOR_CONFIG]],
    },
  ];
}

/**
 * Convenience accessor for the paginator configuration. Runs in injection
 * context; resolves through the cascade. Equivalent to
 * `inject(CNGX_PAGINATOR_CONFIG)`.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function injectPaginatorConfig(): CngxPaginatorConfig {
  return inject(CNGX_PAGINATOR_CONFIG);
}

/**
 * The resolved accessible-name strings of the paginator config in scope, as a
 * Signal that follows a runtime language switch. Runs in injection context.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function injectPaginatorAriaLabels(): Signal<CngxPaginatorAriaLabels> {
  return createFilledOverrideMerge(
    injectPaginatorSiteCopy().ariaLabels,
    injectPaginatorConfig().ariaLabels,
  );
}

/**
 * The resolved live-region phrasing of the paginator config in scope, as a
 * Signal. Read it untracked where it builds live-region text, so a language
 * switch does not re-speak the current message. Runs in injection context.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function injectPaginatorAnnouncements(): Signal<CngxPaginatorAnnouncements> {
  return createFilledOverrideMerge(
    injectPaginatorSiteCopy().announcements,
    injectPaginatorConfig().announcements,
  );
}

/**
 * The resolved readout formatters of the paginator config in scope, as a
 * Signal with every key filled from the `paginator` section of the language
 * pack. Runs in injection context.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-config.ts
 * @since 0.1.0
 */
export function injectPaginatorFormats(): Signal<Required<CngxPaginatorFormats>> {
  return createFilledOverrideMerge<Required<CngxPaginatorFormats>>(
    injectPaginatorSiteCopy().formats,
    injectPaginatorConfig().formats,
  );
}
