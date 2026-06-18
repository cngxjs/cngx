import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Optional,
  SkipSelf,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

/**
 * Accessible-name strings for the paginator landmark and its segment parts.
 * Library defaults are English; consumers localise via
 * {@link withPaginatorAriaLabels}.
 *
 * @category ui/paginator
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
}

/**
 * Display-text formatters for the data-readout segments. Library defaults are
 * English; consumers localise via {@link withPaginatorRangeFormat}.
 *
 * @category ui/paginator
 */
export interface CngxPaginatorFormats {
  /**
   * Range-readout text, given the 1-based first item, last item, and total.
   * The `cngx-pgn-range` segment renders the returned string verbatim.
   */
  readonly range: (start: number, end: number, total: number) => string;
}

/**
 * Live-region announcement phrasing. The paginator announces the effective page
 * on every change (navigation or a `total`-shrink clamp, so the clamp is never
 * silent) and the async busy / settle transitions. Library defaults are
 * English; consumers localise via {@link withPaginatorAnnouncements}.
 *
 * @category ui/paginator
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
 * Resolved paginator configuration. Three sub-trees - accessible-name strings,
 * live-region announcement phrasing, and data-readout formatters - each merged
 * independently by the reducer in {@link provideCngxPaginatorConfig}.
 *
 * @category ui/paginator
 */
export interface CngxPaginatorConfig {
  readonly ariaLabels: CngxPaginatorAriaLabels;
  readonly announcements: CngxPaginatorAnnouncements;
  readonly formats: CngxPaginatorFormats;
}

/** Library defaults - English. Override via {@link provideCngxPaginatorConfig}. */
export const CNGX_PAGINATOR_DEFAULTS: CngxPaginatorConfig = {
  ariaLabels: {
    label: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    page: (page) => `Page ${page}`,
    morePages: 'More pages',
    itemsPerPage: 'Items per page',
    goToPage: 'Go to page',
    pageOfPages: 'Select page',
  },
  announcements: {
    pageChange: (page, totalPages) => `Page ${page} of ${totalPages}`,
    loading: 'Loading',
    updated: 'Updated',
  },
  formats: {
    range: (start, end, total) => `${start}-${end} of ${total}`,
  },
};

/**
 * Configuration cascade token. Resolution priority (high to low):
 * per-instance Input, then `provideCngxPaginatorConfig(...)` at the
 * application root, then the library defaults.
 *
 * @category ui/paginator
 */
export const CNGX_PAGINATOR_CONFIG = new InjectionToken<CngxPaginatorConfig>('CngxPaginatorConfig', {
  providedIn: 'root',
  factory: () => CNGX_PAGINATOR_DEFAULTS,
});

/**
 * A single configuration override produced by a `with*` feature factory.
 * The reducer in {@link provideCngxPaginatorConfig} matches on `kind` and
 * shallow-merges `payload` into the matching sub-tree.
 *
 * @category ui/paginator
 */
export type CngxPaginatorConfigFeature =
  | { readonly kind: 'ariaLabels'; readonly payload: Partial<CngxPaginatorAriaLabels> }
  | { readonly kind: 'announcements'; readonly payload: Partial<CngxPaginatorAnnouncements> }
  | { readonly kind: 'formats'; readonly payload: Partial<CngxPaginatorFormats> };

/** Reduce a feature list onto a base config, merging each sub-tree in isolation. */
function applyFeatures(
  base: CngxPaginatorConfig,
  features: readonly CngxPaginatorConfigFeature[],
): CngxPaginatorConfig {
  let ariaLabels = base.ariaLabels;
  let announcements = base.announcements;
  let formats = base.formats;
  for (const feature of features) {
    if (feature.kind === 'ariaLabels') {
      ariaLabels = { ...ariaLabels, ...feature.payload };
    } else if (feature.kind === 'announcements') {
      announcements = { ...announcements, ...feature.payload };
    } else {
      formats = { ...formats, ...feature.payload };
    }
  }
  return { ariaLabels, announcements, formats };
}

/**
 * Override any subset of the paginator accessible-name strings. Per-instance
 * `aria-label` bindings still win over the cascade for the landmark name.
 *
 * ```ts
 * provideCngxPaginatorConfig(
 *   withPaginatorAriaLabels({ next: 'Nächste Seite', previous: 'Vorige Seite' }),
 * );
 * ```
 *
 * @category ui/paginator
 */
export function withPaginatorAriaLabels(
  payload: Partial<CngxPaginatorAriaLabels>,
): CngxPaginatorConfigFeature {
  return { kind: 'ariaLabels', payload };
}

/**
 * Override any subset of the paginator live-region announcement phrasing.
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
 */
export function withPaginatorAnnouncements(
  payload: Partial<CngxPaginatorAnnouncements>,
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
 */
export function withPaginatorRangeFormat(
  range: CngxPaginatorFormats['range'],
): CngxPaginatorConfigFeature {
  return { kind: 'formats', payload: { range } };
}

/**
 * Application-root configuration cascade for the paginator. Pass any
 * combination of `with*` features in `bootstrapApplication`'s providers.
 * Supplied features deep-merge with the library defaults, so consumers only
 * declare the keys they want to override.
 *
 * @category ui/paginator
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
 */
export function injectPaginatorConfig(): CngxPaginatorConfig {
  return inject(CNGX_PAGINATOR_CONFIG);
}
