import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Optional,
  SkipSelf,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
} from '@angular/core';

/**
 * Accessible-name / visible-label strings for the incremental-list view states.
 * Each doubles as the live-region announcement and the built-in view text, so
 * an override stays in sync across both surfaces. Library defaults are English;
 * consumers localise via {@link withIncrementalListAriaLabels}.
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export interface CngxIncrementalListAriaLabels {
  /** Busy indicator label while the first load runs. */
  readonly loading: string;
  /** Empty-view text shown when the bound state settles with no data. */
  readonly empty: string;
  /** Error-view text shown when the first load fails. */
  readonly error: string;
  /**
   * Error text shown when a subsequent page fails but the accumulated rows stay
   * visible (`content+error`). Distinct from `error` so assistive tech can tell
   * a page-N failure (list preserved) from a first-load failure (nothing shown).
   */
  readonly pageError: string;
  /** Retry-button label on the built-in error view. */
  readonly retry: string;
  /** End-reached label once every page is revealed, given the total item count. */
  readonly endReached: (total: number) => string;
}

/**
 * Application-wide template-slot defaults. A per-instance projected slot still
 * wins over this tier; it supplies a shared override when no instance slot is
 * projected. Library default is unset (the built-in views render).
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export interface CngxIncrementalListTemplates {
  /** Row template for each accumulated item. */
  readonly item?: TemplateRef<unknown>;
  /** Empty view. */
  readonly empty?: TemplateRef<unknown>;
  /** Error + retry view. */
  readonly error?: TemplateRef<unknown>;
  /** End-reached view. */
  readonly end?: TemplateRef<unknown>;
  /** First-load busy indicator. */
  readonly loading?: TemplateRef<unknown>;
}

/**
 * Resolved incremental-list configuration - the accessible-name strings plus an
 * optional `templates` slot tree, each merged independently by the reducer in
 * {@link provideIncrementalListConfig}.
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export interface CngxIncrementalListConfig {
  readonly ariaLabels: CngxIncrementalListAriaLabels;
  readonly templates?: CngxIncrementalListTemplates;
}

/** Library defaults - English. Override via {@link provideIncrementalListConfig}. */
export const CNGX_INCREMENTAL_LIST_DEFAULTS: CngxIncrementalListConfig = {
  ariaLabels: {
    loading: 'Loading',
    empty: 'Nothing here yet',
    error: 'Failed to load',
    pageError: 'Failed to load more',
    retry: 'Retry',
    endReached: (total) => `All ${total} loaded`,
  },
};

/**
 * Configuration cascade token. Resolution priority (high to low):
 * per-instance projected slot, then `provideIncrementalListConfigAt(...)` at
 * component scope, then `provideIncrementalListConfig(...)` at the application
 * root, then the library defaults.
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export const CNGX_INCREMENTAL_LIST_CONFIG = new InjectionToken<CngxIncrementalListConfig>(
  'CngxIncrementalListConfig',
  {
    providedIn: 'root',
    factory: () => CNGX_INCREMENTAL_LIST_DEFAULTS,
  },
);

/**
 * A single configuration override produced by a `with*` feature factory. The
 * reducer in {@link provideIncrementalListConfig} matches on `kind` and
 * shallow-merges `payload` into the matching sub-tree.
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export type CngxIncrementalListConfigFeature =
  | { readonly kind: 'ariaLabels'; readonly payload: Partial<CngxIncrementalListAriaLabels> }
  | { readonly kind: 'templates'; readonly payload: Partial<CngxIncrementalListTemplates> };

/** Reduce a feature list onto a base config, merging each sub-tree in isolation. */
function applyFeatures(
  base: CngxIncrementalListConfig,
  features: readonly CngxIncrementalListConfigFeature[],
): CngxIncrementalListConfig {
  let ariaLabels = base.ariaLabels;
  let templates = base.templates;
  for (const feature of features) {
    if (feature.kind === 'ariaLabels') {
      ariaLabels = { ...ariaLabels, ...feature.payload };
    } else {
      templates = { ...templates, ...feature.payload };
    }
  }
  return { ariaLabels, templates };
}

/**
 * Override any subset of the incremental-list labels. The override applies to
 * both the visible built-in views and the live-region announcements.
 *
 * ```ts
 * provideIncrementalListConfig(
 *   withIncrementalListAriaLabels({
 *     empty: 'Noch nichts hier',
 *     endReached: (total) => `Alle ${total} geladen`,
 *   }),
 * );
 * ```
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export function withIncrementalListAriaLabels(
  payload: Partial<CngxIncrementalListAriaLabels>,
): CngxIncrementalListConfigFeature {
  return { kind: 'ariaLabels', payload };
}

/**
 * Supply application-wide template-slot defaults. A per-instance projected slot
 * still wins over this tier; it only applies where no instance slot is present.
 *
 * ```ts
 * provideIncrementalListConfig(
 *   withIncrementalListTemplates({ empty: myBrandedEmptyTemplate }),
 * );
 * ```
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export function withIncrementalListTemplates(
  payload: Partial<CngxIncrementalListTemplates>,
): CngxIncrementalListConfigFeature {
  return { kind: 'templates', payload };
}

/**
 * Application-root configuration cascade for the incremental list. Pass any
 * combination of `with*` features in `bootstrapApplication`'s providers.
 * Supplied features merge with the library defaults, so consumers only declare
 * the keys they override.
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export function provideIncrementalListConfig(
  ...features: CngxIncrementalListConfigFeature[]
): EnvironmentProviders {
  // Empty-features: leave the root default reference untouched so downstream
  // identity comparisons stay stable.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  return makeEnvironmentProviders([
    {
      provide: CNGX_INCREMENTAL_LIST_CONFIG,
      useValue: applyFeatures(CNGX_INCREMENTAL_LIST_DEFAULTS, features),
    },
  ]);
}

/**
 * Component-scoped incremental-list configuration override. Pass into a
 * component's or directive's `viewProviders`; features merge on top of the
 * parent config (an enclosing scope or the application root), so a region can
 * re-phrase its labels without disturbing the rest of the app.
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export function provideIncrementalListConfigAt(
  ...features: CngxIncrementalListConfigFeature[]
): Provider[] {
  return [
    {
      provide: CNGX_INCREMENTAL_LIST_CONFIG,
      useFactory: (parent: CngxIncrementalListConfig | null) =>
        applyFeatures(parent ?? CNGX_INCREMENTAL_LIST_DEFAULTS, features),
      deps: [[new SkipSelf(), new Optional(), CNGX_INCREMENTAL_LIST_CONFIG]],
    },
  ];
}

/**
 * Convenience accessor for the incremental-list configuration. Runs in
 * injection context; resolves through the cascade. Equivalent to
 * `inject(CNGX_INCREMENTAL_LIST_CONFIG)`.
 *
 * @category ui/collection
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/collection/incremental-list-config.ts
 * @since 0.1.0
 */
export function injectIncrementalListConfig(): CngxIncrementalListConfig {
  return inject(CNGX_INCREMENTAL_LIST_CONFIG);
}
