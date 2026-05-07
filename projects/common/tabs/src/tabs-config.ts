import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';

/**
 * Aria-label overrides for the tab-group landmark region. Library
 * defaults are English (per `feedback_en_default_locale`); German /
 * other locales come from consumer overrides via
 * {@link withTabsAriaLabels}.
 *
 * Per-tab navigation labels (`previousTab`, `nextTab`) live in
 * {@link CngxTabsI18n} — they're SR phrasing, not landmark naming,
 * and belong with the rest of the i18n surface to avoid a dual-
 * override path for the same string.
 *
 * @category interactive
 */
export interface CngxTabsAriaLabels {
  readonly tabsRegion?: string;
}

/**
 * Fallback labels for derived strings (role descriptions, badge SR
 * announcements). Library defaults are English; consumers override
 * per locale.
 *
 * @category interactive
 */
export interface CngxTabsFallbackLabels {
  readonly tabRoleDescription?: string;
  readonly tabPanelRoleDescription?: string;
}

/**
 * Tab-group config surface. Resolution priority: per-instance Input
 * → `provideTabsConfigAt` (viewProviders) → `provideTabsConfig`
 * (root) → library default. Mirrors the canonical config shape used
 * by every cngx feature family.
 *
 * @category interactive
 */
export interface CngxTabsConfig {
  readonly defaultOrientation?: 'horizontal' | 'vertical';
  readonly defaultLoop?: boolean;
  readonly defaultCommitMode?: 'optimistic' | 'pessimistic';
  readonly routerSyncMode?: 'fragment' | 'queryParam';
  readonly routerSyncParam?: string;
  readonly ariaLabels?: CngxTabsAriaLabels;
  readonly fallbackLabels?: CngxTabsFallbackLabels;
  /**
   * Quiescence window (ms) for `<cngx-tab-overflow>`'s
   * IntersectionObserver-driven visibility map. Burst emissions
   * during strip animations (Material tab transitions, cngx
   * active-bar slide, pagination scroll) collapse to one signal
   * write — the More button's counter only re-renders once IO has
   * been quiet for this many ms. Library default is 100ms; raise
   * to ~250ms for slower strip animations or content-driven reflow.
   * The molecule's max-defer cap (250ms) caps how long a sustained
   * burst can delay the commit regardless of this value.
   */
  readonly overflowStabilizeMs?: number;
}

const TABS_CONFIG_DEFAULTS: Required<
  Omit<CngxTabsConfig, 'ariaLabels' | 'fallbackLabels'>
> & {
  ariaLabels: CngxTabsAriaLabels;
  fallbackLabels: CngxTabsFallbackLabels;
} = {
  defaultOrientation: 'horizontal',
  defaultLoop: true,
  defaultCommitMode: 'optimistic',
  routerSyncMode: 'fragment',
  routerSyncParam: 'tab',
  ariaLabels: {
    tabsRegion: 'Tabs',
  },
  fallbackLabels: {
    // 'tab list' (W3C ARIA tablist convention) — deliberately distinct
    // from `i18n.tabsLabel` so `aria-roledescription` and `aria-label`
    // never collapse onto the same string. AT reads them
    // back-to-back; identical strings make the announcement
    // ungrammatical ("Bereiche, Bereiche, A selected").
    tabRoleDescription: 'tab list',
    tabPanelRoleDescription: 'tab panel',
  },
  overflowStabilizeMs: 100,
};

/**
 * DI token for the resolved tabs config. `providedIn: 'root'` with
 * the library defaults; override via {@link provideTabsConfig}
 * (root) or {@link provideTabsConfigAt} (component scope).
 *
 * @category interactive
 */
export const CNGX_TABS_CONFIG = new InjectionToken<CngxTabsConfig>(
  'CngxTabsConfig',
  { providedIn: 'root', factory: () => TABS_CONFIG_DEFAULTS },
);

/**
 * Feature signature — each `with*` builder returns a partial config
 * the aggregator merges into the final value. Carries a hidden
 * `_target` discriminator so the family aggregator
 * {@link provideCngxTabs} can dispatch config features to
 * {@link provideTabsConfig} alongside i18n features routed to
 * {@link provideTabsI18n}.
 *
 * @category interactive
 */
export type CngxTabsConfigFeature = ((
  config: CngxTabsConfig,
) => CngxTabsConfig) & {
  readonly _target?: 'config';
};

/**
 * Internal helper that brands a config-mutator function with the
 * `_target` discriminator. Every `with*` config feature returns one
 * of these.
 *
 * @internal
 */
function defineTabsConfigFeature(
  fn: (config: CngxTabsConfig) => CngxTabsConfig,
): CngxTabsConfigFeature {
  return Object.assign(fn, { _target: 'config' as const });
}

export function withDefaultOrientation(
  orientation: 'horizontal' | 'vertical',
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    defaultOrientation: orientation,
  }));
}

export function withTabsRovingLoop(loop: boolean): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, defaultLoop: loop }));
}

export function withTabsCommitMode(
  mode: 'optimistic' | 'pessimistic',
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    defaultCommitMode: mode,
  }));
}

export function withTabsRouterSync(
  mode: 'fragment' | 'queryParam',
  param = 'tab',
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    routerSyncMode: mode,
    routerSyncParam: param,
  }));
}

export function withTabsAriaLabels(
  labels: CngxTabsAriaLabels,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...labels },
  }));
}

export function withTabsFallbackLabels(
  labels: CngxTabsFallbackLabels,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    fallbackLabels: { ...cfg.fallbackLabels, ...labels },
  }));
}

/**
 * Override `<cngx-tab-overflow>`'s IntersectionObserver-debounce
 * window (ms). See {@link CngxTabsConfig.overflowStabilizeMs} for the
 * full semantics. Library default is 100ms.
 *
 * @category interactive
 */
export function withTabOverflowStabilizeMs(ms: number): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    overflowStabilizeMs: ms,
  }));
}

function resolveFeatures(
  features: readonly CngxTabsConfigFeature[],
): CngxTabsConfig {
  return features.reduce<CngxTabsConfig>(
    (cfg, feat) => feat(cfg),
    TABS_CONFIG_DEFAULTS,
  );
}

/**
 * Root-level provider for the tabs config. Apply once in the
 * application providers array (`bootstrapApplication` /
 * `appConfig.providers`).
 *
 * Returns {@link EnvironmentProviders} per the canonical cngx
 * config-cascade signature — matches `provideSelectConfig` /
 * `provideRecyclerI18n` and the architecture-summary contract.
 *
 * @category interactive
 */
export function provideTabsConfig(
  ...features: readonly CngxTabsConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_TABS_CONFIG, useValue: resolveFeatures(features) },
  ]);
}

/**
 * Component-scoped config override. The returned `Provider[]` goes
 * into a component's `providers` or `viewProviders` via spread —
 * `viewProviders` cannot accept opaque {@link EnvironmentProviders},
 * so this twin keeps the same merge semantics with a list shape
 * (matches `provideSelectConfigAt`).
 *
 * Resolution priority across both helpers:
 *   per-instance Input > viewProviders (`At`) > root provider >
 *   library default.
 *
 * @example
 * ```ts
 * @Component({
 *   viewProviders: [...provideTabsConfigAt(withDefaultOrientation('vertical'))],
 * })
 * ```
 *
 * @category interactive
 */
export function provideTabsConfigAt(
  ...features: readonly CngxTabsConfigFeature[]
): Provider[] {
  return [{ provide: CNGX_TABS_CONFIG, useValue: resolveFeatures(features) }];
}

/**
 * Inject the resolved tabs config in an injection context.
 *
 * @category interactive
 */
export function injectTabsConfig(): CngxTabsConfig {
  return inject(CNGX_TABS_CONFIG);
}
