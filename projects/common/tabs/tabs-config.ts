import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type Provider,
  type TemplateRef,
} from '@angular/core';

import type { CngxTabOverflowItemContext } from './overflow/tab-overflow-item.directive';
import type { CngxTabOverflowTriggerContext } from './overflow/tab-overflow-trigger.directive';
import type { CngxTabBusySpinnerContext } from './slots/tab-busy-spinner.directive';
import type { CngxTabErrorBadgeContext } from './slots/tab-error-badge.directive';
import type { CngxTabRejectionIconContext } from './slots/tab-rejection-icon.directive';

/**
 * Aria-label overrides for the tab-group landmark region. Library
 * defaults are English; consumers override via
 * {@link withTabsAriaLabels}.
 *
 * Per-tab nav phrasing (`previousTab`, `nextTab`) lives in
 * {@link CngxTabsI18n}, not here - landmark naming and SR phrasing
 * stay on separate override paths.
 *
 * @category common/tabs
 */
export interface CngxTabsAriaLabels {
  readonly tabsRegion?: string;
}

/**
 * Fallback labels for derived strings (role descriptions, badge SR
 * announcements). Library defaults are English; consumers override
 * per locale.
 *
 * @category common/tabs
 */
export interface CngxTabsFallbackLabels {
  readonly tabRoleDescription?: string;
  readonly tabPanelRoleDescription?: string;
}

/**
 * App-wide template overrides for `<cngx-tab-group>` and
 * `<cngx-tab-overflow>` skin regions. Middle tier of the 3-stage
 * cascade - per-instance directive > this field > built-in markup.
 * Apply via the matching `with*Template` builders. Shape mirrors
 * `CngxStepperTemplates` so consumer templates port across
 * families.
 *
 * @category common/tabs
 */
export interface CngxTabsTemplates {
  readonly overflowTrigger?: TemplateRef<CngxTabOverflowTriggerContext>;
  readonly overflowItem?: TemplateRef<CngxTabOverflowItemContext>;
  readonly errorBadge?: TemplateRef<CngxTabErrorBadgeContext>;
  readonly rejectionIcon?: TemplateRef<CngxTabRejectionIconContext>;
  readonly busySpinner?: TemplateRef<CngxTabBusySpinnerContext>;
}

/**
 * Tab-group config surface. Resolution priority: per-instance Input
 * → `provideTabsConfigAt` (viewProviders) → `provideTabsConfig`
 * (root) → library default.
 *
 * @category common/tabs
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
   * Quiescence window (ms) for the overflow IO debounce. Burst
   * emissions during strip animations collapse to one write; the
   * More counter re-renders once IO has been quiet this long.
   * Default 100ms. Capped by {@link overflowMaxDeferMs}.
   */
  readonly overflowStabilizeMs?: number;
  /**
   * Hard ceiling (ms) on commit deferral while IO bursts keep
   * arriving - without it, sustained churn (momentum scroll,
   * continuous resize) would clear the stabilize timer forever and
   * the More counter would freeze on a stale value, breaking
   * Pillar 2. Default 250ms.
   */
  readonly overflowMaxDeferMs?: number;
  /**
   * App-wide template overrides for `<cngx-tab-overflow>` regions.
   * Middle tier of the family-standard 3-stage cascade. See
   * {@link CngxTabsTemplates}.
   */
  readonly templates?: CngxTabsTemplates;
}

const TABS_CONFIG_DEFAULTS: Required<
  Omit<CngxTabsConfig, 'ariaLabels' | 'fallbackLabels' | 'templates'>
> & {
  ariaLabels: CngxTabsAriaLabels;
  fallbackLabels: CngxTabsFallbackLabels;
  templates: CngxTabsTemplates;
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
    // W3C ARIA tablist convention - kept distinct from
    // `i18n.tabsLabel` so AT doesn't read the same string twice
    // back-to-back across `aria-roledescription` and `aria-label`.
    tabRoleDescription: 'tab list',
    tabPanelRoleDescription: 'tab panel',
  },
  overflowStabilizeMs: 100,
  overflowMaxDeferMs: 250,
  templates: {},
};

/**
 * DI token for the resolved tabs config. `providedIn: 'root'` with
 * the library defaults; override via {@link provideTabsConfig}
 * (root) or {@link provideTabsConfigAt} (component scope).
 *
 * @category common/tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/tabs-config.ts
 * @since 0.1.0
 */
export const CNGX_TABS_CONFIG = new InjectionToken<CngxTabsConfig>('CngxTabsConfig', {
  providedIn: 'root',
  factory: () => TABS_CONFIG_DEFAULTS,
});

/**
 * Feature signature for `with*` config builders. The hidden
 * `_target` discriminator lets {@link provideCngxTabs} dispatch
 * config features to {@link provideTabsConfig} while i18n features
 * route to {@link provideTabsI18n}.
 *
 * @category common/tabs
 */
export type CngxTabsConfigFeature = ((config: CngxTabsConfig) => CngxTabsConfig) & {
  readonly _target: 'config';
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

/**
 * Override the default orientation. Per-instance `[orientation]`
 * still wins; this changes the cascade default only.
 *
 * @category common/tabs
 */
export function withTabsDefaultOrientation(
  orientation: 'horizontal' | 'vertical',
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    defaultOrientation: orientation,
  }));
}

/**
 * @deprecated Use {@link withTabsDefaultOrientation}. The unprefixed name
 * collides with the stepper family's identical symbol when both libs
 * are auto-imported. The alias stays for one minor release before
 * removal.
 *
 * @category common/tabs
 */
export const withDefaultOrientation = withTabsDefaultOrientation;

/**
 * Override whether roving-tabindex navigation loops from last back to
 * first (and vice versa). Per-instance `[loop]` Input still wins.
 *
 * @category common/tabs
 */
export function withTabsRovingLoop(loop: boolean): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, defaultLoop: loop }));
}

/**
 * Override the default commit mode for async tab transitions.
 * `'optimistic'` activates the tab on action dispatch and rolls back
 * on error; `'pessimistic'` waits for success. Per-instance
 * `[commitMode]` Input still wins.
 *
 * @category common/tabs
 */
export function withTabsCommitMode(mode: 'optimistic' | 'pessimistic'): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    defaultCommitMode: mode,
  }));
}

/**
 * Configure router synchronisation for the active tab. `mode` chooses
 * the URL surface (URL fragment or query parameter); `param` names
 * the key (default `'tab'`).
 *
 * @category common/tabs
 */
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

/**
 * Merge ARIA labels into the cascade. Keys not provided keep their
 * library defaults; per-instance overrides on the tab group still win.
 *
 * @category common/tabs
 */
export function withTabsAriaLabels(labels: CngxTabsAriaLabels): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...labels },
  }));
}

/**
 * Merge text fallback labels (overflow trigger, busy / rejection text)
 * into the cascade. Used when a slot directive is not present.
 *
 * @category common/tabs
 */
export function withTabsFallbackLabels(labels: CngxTabsFallbackLabels): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    fallbackLabels: { ...cfg.fallbackLabels, ...labels },
  }));
}

/**
 * Override the IO-debounce window (ms). See
 * {@link CngxTabsConfig.overflowStabilizeMs}.
 *
 * @category common/tabs
 */
export function withTabOverflowStabilizeMs(ms: number): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    overflowStabilizeMs: ms,
  }));
}

/**
 * Override the worst-case staleness ceiling on the visibility-map
 * commit. See {@link CngxTabsConfig.overflowMaxDeferMs}.
 *
 * @category common/tabs
 */
export function withTabOverflowMaxDeferMs(ms: number): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    overflowMaxDeferMs: ms,
  }));
}

/**
 * App-wide override for the More-button label. Middle tier;
 * per-instance `*cngxTabOverflowTrigger` still wins.
 *
 * ```ts
 * @ViewChild('moreTrigger', { static: true, read: TemplateRef })
 * moreTrigger!: TemplateRef<CngxTabOverflowTriggerContext>;
 *
 * providers: [provideTabsConfig(withTabOverflowTriggerTemplate(this.moreTrigger))]
 * ```
 *
 * @category common/tabs
 */
export function withTabOverflowTriggerTemplate(
  template: TemplateRef<CngxTabOverflowTriggerContext>,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, overflowTrigger: template },
  }));
}

/**
 * App-wide override for each row inside the overflow popover.
 * Middle tier; per-instance `*cngxTabOverflowItem` still wins.
 *
 * @category common/tabs
 */
export function withTabOverflowItemTemplate(
  template: TemplateRef<CngxTabOverflowItemContext>,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, overflowItem: template },
  }));
}

/**
 * App-wide override for the error-badge decoration. Middle tier;
 * per-instance `*cngxTabErrorBadge` still wins. Sibling of the
 * stepper family's `withStepBadgeTemplate`.
 *
 * @category common/tabs
 */
export function withTabErrorBadgeTemplate(
  template: TemplateRef<CngxTabErrorBadgeContext>,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, errorBadge: template },
  }));
}

/**
 * App-wide override for the rejection-icon decoration. Middle
 * tier; per-instance `*cngxTabRejectionIcon` still wins. Sibling
 * of {@link withStepRejectionTemplate}.
 *
 * @category common/tabs
 */
export function withTabRejectionIconTemplate(
  template: TemplateRef<CngxTabRejectionIconContext>,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, rejectionIcon: template },
  }));
}

/**
 * App-wide override for the commit-pending busy-spinner overlay.
 * Middle tier; per-instance `*cngxTabBusySpinner` still wins.
 * Sibling of {@link withStepBusySpinnerTemplate}.
 *
 * @category common/tabs
 */
export function withTabBusySpinnerTemplate(
  template: TemplateRef<CngxTabBusySpinnerContext>,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, busySpinner: template },
  }));
}

function resolveFeatures(features: readonly CngxTabsConfigFeature[]): CngxTabsConfig {
  return features.reduce<CngxTabsConfig>((cfg, feat) => feat(cfg), TABS_CONFIG_DEFAULTS);
}

/**
 * Root-level provider. Apply once in `bootstrapApplication` /
 * `appConfig.providers`. Returns {@link EnvironmentProviders} per
 * the canonical cngx config-cascade signature.
 *
 * @category common/tabs
 */
export function provideTabsConfig(
  ...features: readonly CngxTabsConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_TABS_CONFIG, useValue: resolveFeatures(features) },
  ]);
}

/**
 * Component-scoped override. Returns `Provider[]` (not
 * {@link EnvironmentProviders}) because `viewProviders` rejects
 * opaque environment providers. Resolution priority: per-instance
 * Input > viewProviders (`At`) > root > default.
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideTabsConfigAt(withTabsDefaultOrientation('vertical'))],
 * })
 * ```
 *
 * @category common/tabs
 */
export function provideTabsConfigAt(...features: readonly CngxTabsConfigFeature[]): Provider[] {
  return [{ provide: CNGX_TABS_CONFIG, useValue: resolveFeatures(features) }];
}

/**
 * Inject the resolved tabs config in an injection context.
 *
 * @category common/tabs
 */
export function injectTabsConfig(): CngxTabsConfig {
  return inject(CNGX_TABS_CONFIG);
}
