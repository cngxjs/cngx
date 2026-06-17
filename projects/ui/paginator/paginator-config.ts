import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
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
}

/**
 * Resolved paginator configuration. Currently a single `ariaLabels`
 * sub-tree; further sub-trees follow the same merge shape if added.
 *
 * @category ui/paginator
 */
export interface CngxPaginatorConfig {
  readonly ariaLabels: CngxPaginatorAriaLabels;
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
 * merges `payload` into the matching sub-tree.
 *
 * @category ui/paginator
 */
export interface CngxPaginatorConfigFeature {
  readonly kind: 'ariaLabels';
  readonly payload: Partial<CngxPaginatorAriaLabels>;
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
  let ariaLabels = { ...CNGX_PAGINATOR_DEFAULTS.ariaLabels };
  for (const feature of features) {
    ariaLabels = { ...ariaLabels, ...feature.payload };
  }
  return makeEnvironmentProviders([
    { provide: CNGX_PAGINATOR_CONFIG, useValue: { ariaLabels } },
  ]);
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
