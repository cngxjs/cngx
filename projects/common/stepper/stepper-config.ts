import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type Provider,
  type TemplateRef,
} from '@angular/core';

import type { CngxDotStepperDotContext } from './slots/dot-stepper-dot.directive';
import type { CngxStepBadgeContext } from './slots/step-badge.directive';
import type { CngxStepBusySpinnerContext } from './slots/step-busy-spinner.directive';
import type { CngxStepGroupHeaderContext } from './slots/step-group-header.directive';
import type { CngxStepIndicatorContext } from './slots/step-indicator.directive';
import type { CngxStepRejectionContext } from './slots/step-rejection.directive';

/**
 * Aria-label overrides for the stepper landmark region. Library
 * defaults are English; locales come from consumer overrides.
 *
 * Per-step navigation labels (`previousStep`, `nextStep`) live in
 * {@link CngxStepperI18n} - SR phrasing, not landmark naming.
 * Splitting the surfaces avoids a dual-override path for the same string.
 *
 * @category common/stepper
 */
export interface CngxStepperAriaLabels {
  readonly stepperRegion?: string;
}

/**
 * Fallback labels for derived strings (group descriptors, badge SR
 * announcements). English defaults; consumer overrides per locale.
 *
 * @category common/stepper
 */
export interface CngxStepperFallbackLabels {
  readonly groupRoleDescription?: string;
  readonly stepRoleDescription?: string;
}

/**
 * Per-slot template overrides for `<cngx-stepper>`. Middle tier of
 * the 3-stage cascade: per-instance directive > this field > built-in
 * markup. Apply via the `with*Template` feature builders below.
 *
 * @category common/stepper
 */
export interface CngxStepperTemplates {
  readonly indicator?: TemplateRef<CngxStepIndicatorContext>;
  readonly badge?: TemplateRef<CngxStepBadgeContext>;
  readonly busySpinner?: TemplateRef<CngxStepBusySpinnerContext>;
  readonly rejection?: TemplateRef<CngxStepRejectionContext>;
  readonly groupHeader?: TemplateRef<CngxStepGroupHeaderContext>;
  readonly empty?: TemplateRef<void>;
  readonly dotStepperDot?: TemplateRef<CngxDotStepperDotContext>;
}

/**
 * Selectable visual skin for the cngx-standard stepper. The skin is a
 * pure thematic concern - every value renders the same structure, same
 * slots, same ARIA, same keyboard behaviour, and only redirects CSS via
 * the `[data-skin]` host attribute. The Material twin
 * (`<cngx-mat-stepper>`) ignores this setting.
 *
 * @category common/stepper
 */
export type CngxStepperSkin =
  | 'classic'
  | 'linear-minimal'
  | 'stripe-status-rich'
  | 'path-chevron'
  | 'pill-segment';

/**
 * Mobile auto-collapse target. Under a narrow viewport
 * (`max-width: 480px`), `<cngx-stepper>` falls back to one of the
 * compact variants instead of rendering the full strip. Set to
 * `'off'` to retain the classic strip on every viewport.
 *
 * @category common/stepper
 */
export type CngxStepperMobileCollapse = 'text' | 'dots' | 'off';

/**
 * Where the mobile auto-collapse indicator (text caption or dot row)
 * sits relative to the active step's panel content under narrow
 * viewports. `'top'` (default) keeps the indicator above the panel;
 * `'bottom'` flips it below so the user reads content first and the
 * navigation cue sits at the thumb zone. Ignored when the classic
 * strip is on screen (`displayMode === 'classic'`).
 *
 * @category common/stepper
 */
export type CngxStepperMobileIndicatorPosition = 'top' | 'bottom';

/**
 * Default media query the mobile auto-collapse policy reacts to. The
 * literal lives on a single exported const so the runtime, the config
 * default, and any JSDoc cross-references stay in lockstep. Consumers
 * override the query via {@link withStepperMobileBreakpoint}.
 *
 * @category common/stepper
 */
export const STEPPER_DEFAULT_MOBILE_BREAKPOINT = '(max-width: 480px)';

/**
 * Stepper config surface. Resolution priority: per-instance Input
 * > `provideStepperConfigAt` (viewProviders) > `provideStepperConfig`
 * (root) > library default. Canonical cngx config shape.
 *
 * @category common/stepper
 */
export interface CngxStepperConfig {
  readonly defaultOrientation?: 'horizontal' | 'vertical';
  readonly defaultLinear?: boolean;
  readonly defaultCommitMode?: 'optimistic' | 'pessimistic';
  readonly routerSyncMode?: 'fragment' | 'queryParam';
  readonly routerSyncParam?: string;
  readonly skin?: CngxStepperSkin;
  /**
   * Opt-in connector rail between adjacent step indicators on the
   * classic skin. Off by default. The rule is double-scoped on
   * `[data-skin='classic']`, so the four other skins are mechanically
   * untouched (each ships its own inter-step decoration). Per-instance
   * `[connectors]` Input still wins.
   */
  readonly connectors?: boolean;
  readonly mobileCollapse?: CngxStepperMobileCollapse;
  /**
   * Media query the mobile auto-collapse policy reacts to. Default
   * {@link STEPPER_DEFAULT_MOBILE_BREAKPOINT}. Tablet consumers can
   * re-aim the trigger via {@link withStepperMobileBreakpoint}.
   */
  readonly mobileBreakpoint?: string;
  /**
   * Where the mobile auto-collapse indicator sits relative to the
   * panel content. Default `'top'`. Override per-instance via the
   * `[mobileIndicatorPosition]` input or app-wide via
   * {@link withStepperMobileIndicatorPosition}.
   */
  readonly mobileIndicatorPosition?: CngxStepperMobileIndicatorPosition;
  /**
   * Whether horizontal swipe gestures advance/retreat the active step
   * while the stepper is in mobile-collapse mode (`'dots'` / `'text'`).
   * Default `true`. Override per-instance via the `[mobileSwipe]` input
   * or app-wide via {@link withStepperMobileSwipe}. Ignored on the
   * classic strip and on the Material twin (`<cngx-mat-stepper>`).
   */
  readonly mobileSwipe?: boolean;
  readonly ariaLabels?: CngxStepperAriaLabels;
  readonly fallbackLabels?: CngxStepperFallbackLabels;
  readonly templates?: CngxStepperTemplates;
}

/** @internal */
const STEPPER_CONFIG_DEFAULTS: Required<
  Omit<CngxStepperConfig, 'ariaLabels' | 'fallbackLabels' | 'templates'>
> & {
  ariaLabels: CngxStepperAriaLabels;
  fallbackLabels: CngxStepperFallbackLabels;
  templates: CngxStepperTemplates;
} = {
  defaultOrientation: 'horizontal',
  defaultLinear: false,
  defaultCommitMode: 'pessimistic',
  routerSyncMode: 'fragment',
  routerSyncParam: 'step',
  skin: 'classic',
  connectors: false,
  mobileCollapse: 'text',
  mobileBreakpoint: STEPPER_DEFAULT_MOBILE_BREAKPOINT,
  mobileIndicatorPosition: 'top',
  mobileSwipe: true,
  ariaLabels: {
    stepperRegion: 'Stepper',
  },
  fallbackLabels: {
    groupRoleDescription: 'step group',
    stepRoleDescription: 'stepper',
  },
  templates: {},
};

/**
 * DI token for the resolved stepper config. `providedIn: 'root'` with
 * library defaults; override via {@link provideStepperConfig} (root)
 * or {@link provideStepperConfigAt} (component scope).
 *
 * @category common/stepper
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/stepper-config.ts
 * @since 0.1.0
 */
export const CNGX_STEPPER_CONFIG = new InjectionToken<CngxStepperConfig>('CngxStepperConfig', {
  providedIn: 'root',
  factory: () => STEPPER_CONFIG_DEFAULTS,
});

/**
 * Feature signature - each `with*` builder reduces over the config.
 * Hidden `_target: 'config'` discriminator routes through the family
 * aggregator {@link provideCngxStepper}.
 *
 * @category common/stepper
 */
export type CngxStepperConfigFeature = ((config: CngxStepperConfig) => CngxStepperConfig) & {
  readonly _target: 'config';
};

/**
 * Brands a config mutator with `_target: 'config'`. Every `with*`
 * config feature returns one of these.
 *
 * @internal
 */
function defineStepperConfigFeature(
  fn: (config: CngxStepperConfig) => CngxStepperConfig,
): CngxStepperConfigFeature {
  return Object.assign(fn, { _target: 'config' as const });
}

/**
 * Override the default orientation. Per-instance `[orientation]`
 * Input still wins; this only moves the cascade default.
 *
 * @category common/stepper
 */
export function withStepperDefaultOrientation(
  orientation: 'horizontal' | 'vertical',
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    defaultOrientation: orientation,
  }));
}

/**
 * Override the default linear-progression setting. Per-instance
 * `[linear]` Input still wins.
 *
 * @category common/stepper
 */
export function withStepperLinear(linear: boolean): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, defaultLinear: linear }));
}

/**
 * Override the default commit mode for async step transitions.
 * `'optimistic'` advances on action dispatch and rolls back on error;
 * `'pessimistic'` waits for success. Per-instance `[commitMode]`
 * Input still wins.
 *
 * @category common/stepper
 */
export function withStepperCommitMode(
  mode: 'optimistic' | 'pessimistic',
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    defaultCommitMode: mode,
  }));
}

/**
 * Configure router synchronisation for the active step. `mode` chooses
 * the URL surface (URL fragment or query parameter); `param` names the
 * key (default `'step'`).
 *
 * @category common/stepper
 */
export function withStepperRouterSync(
  mode: 'fragment' | 'queryParam',
  param = 'step',
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    routerSyncMode: mode,
    routerSyncParam: param,
  }));
}

/**
 * Select the visual skin for the cngx-standard `<cngx-stepper>`. The
 * default is `'classic'`. Per-instance `[skin]` Input still wins; this
 * moves the cascade default. Structure, slots, ARIA, and keyboard
 * behaviour are identical across skins - only the `[data-skin]` host
 * attribute changes the CSS layer that paints the strip.
 *
 * @category common/stepper
 */
export function withStepperSkin(skin: CngxStepperSkin): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, skin }));
}

/**
 * Opt the classic `<cngx-stepper>` skin into the connector-rail
 * presentation: a solid completed/upcoming rail between adjacent step
 * indicators, horizontal and vertical, with per-segment coloring driven
 * by the preceding step's `[data-state]`. The rule is double-scoped on
 * `[data-skin='classic']`; the four other skins each ship their own
 * inter-step decoration and ignore this flag. Per-instance
 * `[connectors]` Input still wins.
 *
 * @category common/stepper
 */
export function withStepperConnectors(on: boolean): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, connectors: on }));
}

/**
 * Configure the mobile auto-collapse target for `<cngx-stepper>`. Under
 * a narrow viewport (`max-width: 480px`), the classic strip swaps to
 * the chosen variant - `'text'` (default) renders `<cngx-text-stepper>`,
 * `'dots'` renders `<cngx-dot-stepper>`, `'off'` keeps the classic
 * strip. The Material twin `<cngx-mat-stepper>` ignores this setting.
 *
 * @category common/stepper
 */
export function withStepperMobileCollapse(
  mode: CngxStepperMobileCollapse,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, mobileCollapse: mode }));
}

/**
 * Override the media query the mobile auto-collapse policy reacts to.
 * Default `'(max-width: 480px)'`. Useful for tablet-tier consumers
 * who want the collapse to engage at 768px or for design systems
 * aligned with `--mat-sys-breakpoint-*` tokens.
 *
 * @category common/stepper
 */
export function withStepperMobileBreakpoint(query: string): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, mobileBreakpoint: query }));
}

/**
 * Set the app-wide default position of the mobile auto-collapse
 * indicator relative to panel content. `'top'` keeps the indicator
 * above (library default); `'bottom'` flips it below so panel content
 * reads first and the navigation cue sits at thumb height. Per-
 * instance `[mobileIndicatorPosition]` on `<cngx-stepper>` still
 * wins.
 *
 * @category common/stepper
 */
export function withStepperMobileIndicatorPosition(
  position: CngxStepperMobileIndicatorPosition,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, mobileIndicatorPosition: position }));
}

/**
 * Toggle the built-in horizontal-swipe navigation on `<cngx-stepper>`
 * in mobile-collapse mode. Default `true` - the `'dots'` and `'text'`
 * variants read as carousels, so users expect to swipe. Per-instance
 * `[mobileSwipe]` Input still wins; the classic strip is unaffected.
 *
 * @category common/stepper
 */
export function withStepperMobileSwipe(enabled: boolean): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, mobileSwipe: enabled }));
}

/**
 * Merge ARIA labels into the cascade. Keys not provided keep their
 * library defaults; per-instance overrides on the stepper still win.
 *
 * @category common/stepper
 */
export function withStepperAriaLabels(labels: CngxStepperAriaLabels): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...labels },
  }));
}

/**
 * Merge text fallback labels (button captions, error strings) into the
 * cascade. Used when a slot directive is not present.
 *
 * @category common/stepper
 */
export function withStepperFallbackLabels(
  labels: CngxStepperFallbackLabels,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    fallbackLabels: { ...cfg.fallbackLabels, ...labels },
  }));
}

/**
 * Override the default `*cngxStepIndicator` template app-wide.
 * Per-instance directive still wins; this only moves the cascade
 * middle tier.
 *
 * @category common/stepper
 */
export function withStepIndicatorTemplate(
  template: TemplateRef<CngxStepIndicatorContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, indicator: template },
  }));
}

/**
 * Override the default `*cngxStepBadge` template app-wide.
 *
 * @category common/stepper
 */
export function withStepBadgeTemplate(
  template: TemplateRef<CngxStepBadgeContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, badge: template },
  }));
}

/**
 * Override the default `*cngxStepBusySpinner` template app-wide.
 *
 * @category common/stepper
 */
export function withStepBusySpinnerTemplate(
  template: TemplateRef<CngxStepBusySpinnerContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, busySpinner: template },
  }));
}

/**
 * Override the default `*cngxStepRejection` template app-wide.
 * Symmetric with the upcoming tabs `cngxTabRejectionIcon` (Phase 4).
 *
 * @category common/stepper
 */
export function withStepRejectionTemplate(
  template: TemplateRef<CngxStepRejectionContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, rejection: template },
  }));
}

/**
 * Override the default `*cngxStepGroupHeader` template app-wide.
 *
 * @category common/stepper
 */
export function withStepGroupHeaderTemplate(
  template: TemplateRef<CngxStepGroupHeaderContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, groupHeader: template },
  }));
}

/**
 * Override the default `*cngxStepperEmpty` template app-wide.
 *
 * @category common/stepper
 */
export function withStepperEmptyTemplate(template: TemplateRef<void>): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, empty: template },
  }));
}

/**
 * Override the default `*cngxDotStepperDot` template app-wide. The
 * `<cngx-dot-stepper>` variant resolves the cascade per dot:
 * per-instance directive > this feature > built-in empty body
 * (the dot fill is painted by `.cngx-dot-stepper__dot` regardless).
 *
 * @category common/stepper
 */
export function withDotStepperDotTemplate(
  template: TemplateRef<CngxDotStepperDotContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, dotStepperDot: template },
  }));
}

/** @internal */
function resolveFeatures(features: readonly CngxStepperConfigFeature[]): CngxStepperConfig {
  return features.reduce<CngxStepperConfig>((cfg, feat) => feat(cfg), STEPPER_CONFIG_DEFAULTS);
}

/**
 * Root-level provider for the stepper config. Apply once in the
 * application providers array. Sibling of `provideTabsConfig` /
 * `provideSelectConfig`.
 *
 * @category common/stepper
 */
export function provideStepperConfig(
  ...features: readonly CngxStepperConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_STEPPER_CONFIG, useValue: resolveFeatures(features) },
  ]);
}

/**
 * Component-scoped config override. Spread the returned `Provider[]`
 * into `providers` or `viewProviders` - `viewProviders` cannot accept
 * opaque {@link EnvironmentProviders}, so the twin returns a list.
 * Sibling of `provideTabsConfigAt`.
 *
 * Resolution priority: per-instance Input > viewProviders (`At`) >
 * root provider > library default.
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideStepperConfigAt(withStepperLinear(true))],
 * })
 * ```
 *
 * @category common/stepper
 */
export function provideStepperConfigAt(
  ...features: readonly CngxStepperConfigFeature[]
): Provider[] {
  return [{ provide: CNGX_STEPPER_CONFIG, useValue: resolveFeatures(features) }];
}

/**
 * Inject the resolved stepper config in an injection context.
 *
 * @category common/stepper
 */
export function injectStepperConfig(): CngxStepperConfig {
  return inject(CNGX_STEPPER_CONFIG);
}
