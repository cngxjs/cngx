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
import type { CngxTabCloseIconContext } from './slots/tab-close-icon.directive';
import type { CngxTabErrorBadgeContext } from './slots/tab-error-badge.directive';
import type { CngxTabIconContext } from './slots/tab-icon.directive';
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
  readonly icon?: TemplateRef<CngxTabIconContext>;
  readonly closeIcon?: TemplateRef<CngxTabCloseIconContext>;
  readonly addIcon?: TemplateRef<void>;
}

/**
 * Selectable visual skin for `<cngx-tab-group>`. The skin is a pure
 * thematic concern - every value renders the same `tablist` / `tab` /
 * `tabpanel` structure, slots, ARIA, and keyboard behaviour, and only
 * redirects CSS via the `[data-skin]` host attribute. `'line'`
 * (default) is the underline indicator; `'contained'` fuses the active
 * tab with the panel surface; `'segmented'` sits the tabs in a muted
 * track and lifts the active tab onto a raised surface; `'pill'`
 * renders rounded solid fills; `'pill-outline'` renders the same pill
 * geometry with a tinted, outlined active state instead of a solid
 * fill. Sized to the tab use cases - not a 1:1 copy of the stepper's
 * seven skins. The Material twin (`[cngxMatTabs]`) ignores this setting.
 *
 * @category common/tabs
 */
export type CngxTabsSkin = 'line' | 'contained' | 'segmented' | 'pill' | 'pill-outline';

/**
 * Icon-layout axis for `<cngx-tab-group>`, orthogonal to both skin and
 * orientation. Positions the `*cngxTabIcon` slot relative to the tab
 * label: `'start'` (default) places the icon before the label in a row;
 * `'top'` stacks the icon above the label in a column; `'only'` hides
 * the label visually while keeping it in the DOM as the accessible name.
 * Redirected purely via the `[data-icon-layout]` host attribute.
 *
 * @category common/tabs
 */
export type CngxTabIconLayout = 'start' | 'top' | 'only';

/**
 * Panel render strategy for `<cngx-tab-group>`. The panel `<div>` (the
 * `aria-controls` target) always stays in the DOM; only its content is
 * rendered per mode. `'eager'` (default) renders every panel's content
 * up front and toggles visibility via `[hidden]` - today's behaviour,
 * byte-identical. `'lazy'` renders a panel's content the first time it
 * is activated and keeps it (keep-alive). `'lazy-destroy'` renders only
 * the active panel's content and destroys it on leave.
 *
 * @category common/tabs
 */
export type CngxTabsPanelMode = 'eager' | 'lazy' | 'lazy-destroy';

/**
 * Horizontal alignment of the tab cluster along the strip, set via the
 * `[tabAlign]` Input and reflected onto `[data-tab-align]`. `'start'`
 * (default), `'center'`, or `'end'`. Horizontal only - ignored under
 * `orientation="vertical"` (tabs fill the column) and when `[fitted]`
 * stretches them to the full width.
 *
 * @category common/tabs
 */
export type CngxTabAlign = 'start' | 'center' | 'end';

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
  /**
   * App-wide default visual skin. Default `'line'`. Per-instance
   * `[skin]` Input still wins; the cascade default itself lives in
   * `createTabsHostAttrs`, not here (mirrors the stepper). Override via
   * {@link withTabsSkin}.
   */
  readonly skin?: CngxTabsSkin;
  /**
   * App-wide default icon layout. Default `'start'`. Per-instance
   * `[iconLayout]` Input still wins; the cascade default lives in
   * `createTabsHostAttrs`. Override via {@link withTabsIconLayout}.
   */
  readonly iconLayout?: CngxTabIconLayout;
  /**
   * App-wide default panel render strategy. Default `'eager'`.
   * Per-instance `[panelMode]` Input still wins; the cascade default
   * lives in `createTabsHostAttrs`. Override via
   * {@link withTabsPanelMode}.
   */
  readonly panelMode?: CngxTabsPanelMode;
  /**
   * App-wide default for stretching tabs to the full strip width
   * (horizontal only). Default `false`. Per-instance `[fitted]` Input
   * wins; the cascade default lives in `createTabsHostAttrs`. Override
   * via {@link withTabsFitted}.
   */
  readonly fitted?: boolean;
  /**
   * App-wide default tab-cluster alignment (horizontal only). Default
   * `'start'`. Per-instance `[tabAlign]` Input wins; the cascade default
   * lives in `createTabsHostAttrs`. Override via {@link withTabsAlign}.
   */
  readonly tabAlign?: CngxTabAlign;
  /**
   * App-wide default for whether tabs render a close affordance.
   * Default `false`. Per-instance `[closable]` Input wins, and a
   * per-`CngxTab` `[closable]` override wins over both. The cascade
   * default lives in the organism. Override via {@link withTabsClosable}.
   */
  readonly closable?: boolean;
  /**
   * App-wide default for whether the group renders an add-tab button.
   * Default `false`. Per-instance `[addable]` Input wins. Override via
   * {@link withTabsAddable}.
   */
  readonly addable?: boolean;
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
  Omit<
    CngxTabsConfig,
    | 'ariaLabels'
    | 'fallbackLabels'
    | 'templates'
    | 'skin'
    | 'iconLayout'
    | 'panelMode'
    | 'fitted'
    | 'tabAlign'
    | 'closable'
    | 'addable'
  >
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
 * Select the app-wide default visual skin for `<cngx-tab-group>`.
 * Default `'line'`. Per-instance `[skin]` Input still wins; this moves
 * the cascade default. Structure, slots, ARIA, and keyboard behaviour
 * are identical across skins - only the `[data-skin]` host attribute
 * changes the CSS layer. The Material twin (`[cngxMatTabs]`) ignores it.
 *
 * @category common/tabs
 */
export function withTabsSkin(skin: CngxTabsSkin): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, skin }));
}

/**
 * Set the app-wide default icon layout for `<cngx-tab-group>`. Default
 * `'start'`. Per-instance `[iconLayout]` Input still wins. Orthogonal to
 * skin and orientation - only the `[data-icon-layout]` host attribute
 * changes.
 *
 * @category common/tabs
 */
export function withTabsIconLayout(layout: CngxTabIconLayout): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, iconLayout: layout }));
}

/**
 * Set the app-wide default panel render strategy for `<cngx-tab-group>`.
 * Default `'eager'` (every panel's content rendered up front, toggled
 * via `[hidden]`). `'lazy'` keep-alives content after first activation;
 * `'lazy-destroy'` renders only the active panel's content. Per-instance
 * `[panelMode]` Input still wins. The panel `<div>` always stays in the
 * DOM regardless of mode (the `aria-controls` target).
 *
 * @category common/tabs
 */
export function withTabsPanelMode(mode: CngxTabsPanelMode): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, panelMode: mode }));
}

/**
 * Set the app-wide default for stretching tabs to the full strip width
 * (horizontal only). Default `false`. Per-instance `[fitted]` Input still
 * wins. No effect under `orientation="vertical"`.
 *
 * @category common/tabs
 */
export function withTabsFitted(fitted: boolean): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, fitted }));
}

/**
 * Set the app-wide default tab-cluster alignment (horizontal only).
 * Default `'start'`. Per-instance `[tabAlign]` Input still wins. Ignored
 * under `orientation="vertical"` and when the group is `fitted`.
 *
 * @category common/tabs
 */
export function withTabsAlign(align: CngxTabAlign): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, tabAlign: align }));
}

/**
 * Set the app-wide default for whether tabs render a close affordance.
 * Default `false`. Per-instance `[closable]` Input wins; a per-`CngxTab`
 * `[closable]` override wins over both.
 *
 * @category common/tabs
 */
export function withTabsClosable(closable: boolean): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, closable }));
}

/**
 * Set the app-wide default for whether the group renders an add-tab
 * button. Default `false`. Per-instance `[addable]` Input wins.
 *
 * @category common/tabs
 */
export function withTabsAddable(addable: boolean): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({ ...cfg, addable }));
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

/**
 * App-wide override for the tab-icon slot. Middle tier of the 3-stage
 * cascade; per-instance `*cngxTabIcon` still wins. Sibling of
 * {@link withStepIndicatorTemplate}.
 *
 * @category common/tabs
 */
export function withTabIconTemplate(
  template: TemplateRef<CngxTabIconContext>,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, icon: template },
  }));
}

/**
 * App-wide override for a tab's close-button glyph. Middle tier;
 * per-instance `*cngxTabCloseIcon` still wins.
 *
 * @category common/tabs
 */
export function withTabCloseIconTemplate(
  template: TemplateRef<CngxTabCloseIconContext>,
): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, closeIcon: template },
  }));
}

/**
 * App-wide override for the add-tab button glyph. Middle tier;
 * per-instance `*cngxTabAddIcon` still wins.
 *
 * @category common/tabs
 */
export function withTabAddIconTemplate(template: TemplateRef<void>): CngxTabsConfigFeature {
  return defineTabsConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, addIcon: template },
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
