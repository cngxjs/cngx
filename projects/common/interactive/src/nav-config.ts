import { inject, InjectionToken, type Provider } from '@angular/core';
import { CngxNavGroupRegistry } from './nav-group-registry';

/** Configuration options for the cngx nav system. */
export interface CngxNavConfig {
  /**
   * Indentation in px per depth level.
   * Applied via `--cngx-nav-indent` CSS custom property.
   * @default 12
   */
  indent?: number;

  /**
   * When `true`, only one `CngxNavGroup` can be open at a time within
   * the same provider scope. Opening one group closes the others.
   * @default false
   */
  singleAccordion?: boolean;

  /**
   * Default animation duration in ms for disclosure transitions.
   * Applied via `--cngx-nav-transition` CSS custom property.
   * @default 150
   */
  animationDuration?: number;
}

/** A feature configuration function returned by `withXxx()` helpers. */
export interface NavConfigFeature {
  /** @internal */
  readonly apply: (config: CngxNavConfig) => CngxNavConfig;
  /** @internal */
  readonly providers?: Provider[];
}

/** Default nav configuration values. */
export const CNGX_NAV_DEFAULTS: Readonly<Required<CngxNavConfig>> = {
  indent: 12,
  singleAccordion: false,
  animationDuration: 150,
};

/**
 * Injection token for nav system configuration.
 *
 * @usageNotes
 *
 * ### Using feature functions
 * ```typescript
 * @Component({
 *   providers: [provideNavConfig(withSingleAccordion(), withNavIndent(16))],
 * })
 * class SidebarComponent { }
 * ```
 */
export const CNGX_NAV_CONFIG = new InjectionToken<CngxNavConfig>('CNGX_NAV_CONFIG');

/**
 * Provides nav system configuration. Accepts `withXxx()` feature functions
 * for composable setup.
 *
 * Automatically includes `CngxNavGroupRegistry` when `singleAccordion` is enabled
 * (either directly or via `withSingleAccordion()`).
 *
 * @example
 * ```typescript
 * providers: [provideNavConfig(withSingleAccordion(), withNavIndent(16))]
 * ```
 */
export function provideNavConfig(...features: NavConfigFeature[]): Provider[] {
  let config: CngxNavConfig = {};
  const extraProviders: Provider[] = [];
  for (const f of features) {
    config = f.apply(config);
    if (f.providers) {
      extraProviders.push(...f.providers);
    }
  }
  const providers: Provider[] = [
    { provide: CNGX_NAV_CONFIG, useValue: config },
    ...extraProviders,
  ];
  if (config.singleAccordion) {
    providers.push(CngxNavGroupRegistry);
  }
  return providers;
}

/** Enable single-accordion mode (only one nav group open at a time). */
export function withSingleAccordion(): NavConfigFeature {
  return { apply: (c) => ({ ...c, singleAccordion: true }) };
}

/** Set the indentation per depth level in px. */
export function withNavIndent(px: number): NavConfigFeature {
  return { apply: (c) => ({ ...c, indent: px }) };
}

/** Set the animation duration for nav group expand/collapse in ms. */
export function withNavAnimation(ms: number): NavConfigFeature {
  return { apply: (c) => ({ ...c, animationDuration: ms }) };
}

/**
 * Injects the resolved nav config, merging provided values with defaults.
 * Must be called in an injection context.
 */
export function injectNavConfig(): Readonly<Required<CngxNavConfig>> {
  return { ...CNGX_NAV_DEFAULTS, ...inject(CNGX_NAV_CONFIG, { optional: true }) };
}
