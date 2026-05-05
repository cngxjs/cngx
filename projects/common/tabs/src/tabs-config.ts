import { inject, InjectionToken, type Provider } from '@angular/core';

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
    tabRoleDescription: 'tab',
    tabPanelRoleDescription: 'tab panel',
  },
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
 * the aggregator merges into the final value.
 *
 * @category interactive
 */
export type CngxTabsConfigFeature = (config: CngxTabsConfig) => CngxTabsConfig;

export function withDefaultOrientation(
  orientation: 'horizontal' | 'vertical',
): CngxTabsConfigFeature {
  return (cfg) => ({ ...cfg, defaultOrientation: orientation });
}

export function withTabsRovingLoop(loop: boolean): CngxTabsConfigFeature {
  return (cfg) => ({ ...cfg, defaultLoop: loop });
}

export function withTabsCommitMode(
  mode: 'optimistic' | 'pessimistic',
): CngxTabsConfigFeature {
  return (cfg) => ({ ...cfg, defaultCommitMode: mode });
}

export function withTabsRouterSync(
  mode: 'fragment' | 'queryParam',
  param = 'tab',
): CngxTabsConfigFeature {
  return (cfg) => ({ ...cfg, routerSyncMode: mode, routerSyncParam: param });
}

export function withTabsAriaLabels(
  labels: CngxTabsAriaLabels,
): CngxTabsConfigFeature {
  return (cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...labels },
  });
}

export function withTabsFallbackLabels(
  labels: CngxTabsFallbackLabels,
): CngxTabsConfigFeature {
  return (cfg) => ({
    ...cfg,
    fallbackLabels: { ...cfg.fallbackLabels, ...labels },
  });
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
 * Returns the same `Provider` shape as {@link provideTabsConfigAt} —
 * the difference is the placement site, not the provider literal.
 *
 * @category interactive
 */
export function provideTabsConfig(
  ...features: readonly CngxTabsConfigFeature[]
): Provider {
  return { provide: CNGX_TABS_CONFIG, useValue: resolveFeatures(features) };
}

/**
 * Component-scoped provider for the tabs config. Apply via
 * `viewProviders` on a component to override the config for the
 * subtree rooted at that component.
 *
 * Resolution priority across both helpers:
 *   per-instance Input > viewProviders (`At`) > root provider >
 *   library default.
 *
 * @category interactive
 */
export function provideTabsConfigAt(
  ...features: readonly CngxTabsConfigFeature[]
): Provider {
  return { provide: CNGX_TABS_CONFIG, useValue: resolveFeatures(features) };
}

/**
 * Inject the resolved tabs config in an injection context.
 *
 * @category interactive
 */
export function injectTabsConfig(): CngxTabsConfig {
  return inject(CNGX_TABS_CONFIG);
}
