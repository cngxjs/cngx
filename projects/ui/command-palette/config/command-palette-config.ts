import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Optional,
  SkipSelf,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import { CNGX_COMMAND_PALETTE_DEFAULTS } from '../panel/command-palette-defaults';
import type {
  CngxCommandGroupHeaderContext,
  CngxCommandPaletteEmptyContext,
  CngxCommandPaletteErrorContext,
  CngxCommandPaletteFooterContext,
  CngxCommandPaletteLoadingContext,
  CngxCommandRowContext,
} from '../slots/command-slots';
import type { TemplateRef } from '@angular/core';

/**
 * Global default template overrides, keyed by slot. Resolution order for any
 * fragment is instance `*cngxCommand*` slot > this map > the built-in default.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export interface CngxCommandPaletteTemplates {
  readonly row?: TemplateRef<CngxCommandRowContext>;
  readonly groupHeader?: TemplateRef<CngxCommandGroupHeaderContext>;
  readonly empty?: TemplateRef<CngxCommandPaletteEmptyContext>;
  readonly loading?: TemplateRef<CngxCommandPaletteLoadingContext>;
  readonly error?: TemplateRef<CngxCommandPaletteErrorContext>;
  readonly footer?: TemplateRef<CngxCommandPaletteFooterContext>;
}

/**
 * One keyboard-legend row in the palette footer: the key glyphs and what they
 * do.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export interface CngxCommandPaletteLegendEntry {
  readonly keys: string;
  readonly label: string;
}

/**
 * Resolved, localisable configuration for the command palette. English by
 * default (sourced from the internal defaults); German or any other locale is
 * consumer-supplied through {@link provideCommandPaletteConfig} and the `with*`
 * features - never hard-coded (`feedback_en_default_locale`).
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export interface CngxCommandPaletteConfig {
  /**
   * Combo string that opens the palette (parsed via `parseKeyCombo`, e.g.
   * `'mod+k'`, `'mod+shift+p'`). A per-instance `[openShortcut]` wins over this.
   */
  readonly openShortcut: string;
  /** Placeholder + accessible name for the search input. */
  readonly searchPlaceholder: string;
  /** Accessible label for the results listbox. */
  readonly listboxLabel: string;
  /** Empty-state copy (async source returned no results). */
  readonly emptyLabel: string;
  /** First-load skeleton copy. */
  readonly loadingLabel: string;
  /** Error-state copy. */
  readonly errorLabel: string;
  /** Retry-button copy in the error state. */
  readonly retryLabel: string;
  /** Builds the polite `aria-live` result-count message. */
  readonly resultCount: (count: number) => string;
  /** Keyboard-legend rows rendered in the footer. */
  readonly footerLegend: readonly CngxCommandPaletteLegendEntry[];
  /** Global default slot templates (config = strings, slots = structure). */
  readonly templates?: CngxCommandPaletteTemplates;
}

/**
 * A partial-config override produced by a `with*` helper.
 *
 * There is one config surface today, so this is a plain mutator - no
 * `_target` discriminator. If a second palette config surface ever lands and a
 * `provideCngxCommandPalette` aggregator is introduced, add the discriminator
 * then (the menu family's `_target` pattern), not preemptively.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export type CngxCommandPaletteConfigFeature = (
  config: CngxCommandPaletteConfig,
) => CngxCommandPaletteConfig;

/**
 * Library-default palette configuration, built from the internal defaults
 * const. English-only.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export const DEFAULT_COMMAND_PALETTE_CONFIG: CngxCommandPaletteConfig = {
  openShortcut: CNGX_COMMAND_PALETTE_DEFAULTS.openShortcut,
  searchPlaceholder: CNGX_COMMAND_PALETTE_DEFAULTS.searchPlaceholder,
  listboxLabel: CNGX_COMMAND_PALETTE_DEFAULTS.listboxLabel,
  emptyLabel: CNGX_COMMAND_PALETTE_DEFAULTS.emptyLabel,
  loadingLabel: CNGX_COMMAND_PALETTE_DEFAULTS.loadingLabel,
  errorLabel: CNGX_COMMAND_PALETTE_DEFAULTS.errorLabel,
  retryLabel: CNGX_COMMAND_PALETTE_DEFAULTS.retryLabel,
  resultCount: CNGX_COMMAND_PALETTE_DEFAULTS.resultCount,
  footerLegend: CNGX_COMMAND_PALETTE_DEFAULTS.footerLegend,
};

/**
 * DI token carrying the resolved {@link CngxCommandPaletteConfig}. Defaults to
 * {@link DEFAULT_COMMAND_PALETTE_CONFIG} at root; override app-wide via
 * {@link provideCommandPaletteConfig} or per-scope via
 * {@link provideCommandPaletteConfigAt}.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export const CNGX_COMMAND_PALETTE_CONFIG = new InjectionToken<CngxCommandPaletteConfig>(
  'CngxCommandPaletteConfig',
  { providedIn: 'root', factory: () => DEFAULT_COMMAND_PALETTE_CONFIG },
);

/** @internal */
function applyFeatures(
  base: CngxCommandPaletteConfig,
  features: readonly CngxCommandPaletteConfigFeature[],
): CngxCommandPaletteConfig {
  return features.reduce((config, feature) => feature(config), base);
}

/**
 * Provide a palette configuration at app root.
 *
 * ```ts
 * provideCommandPaletteConfig(
 *   withCommandPaletteLabels({ emptyLabel: 'Keine Treffer.' }),
 *   withKeyboardLegend([{ keys: 'enter', label: 'Ausführen' }]),
 * )
 * ```
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function provideCommandPaletteConfig(
  ...features: CngxCommandPaletteConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CNGX_COMMAND_PALETTE_CONFIG,
      useFactory: () => applyFeatures(DEFAULT_COMMAND_PALETTE_CONFIG, features),
    },
  ]);
}

/**
 * Component-scoped palette configuration override. Features merge on top of the
 * enclosing scope (root or a parent `viewProviders`).
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function provideCommandPaletteConfigAt(
  ...features: CngxCommandPaletteConfigFeature[]
): Provider[] {
  return [
    {
      provide: CNGX_COMMAND_PALETTE_CONFIG,
      useFactory: (parent: CngxCommandPaletteConfig | null) =>
        applyFeatures(parent ?? DEFAULT_COMMAND_PALETTE_CONFIG, features),
      deps: [[new SkipSelf(), new Optional(), CNGX_COMMAND_PALETTE_CONFIG]],
    },
  ];
}

/**
 * Resolves the {@link CngxCommandPaletteConfig} from the current injection
 * scope. Must run in an injection context.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function injectCommandPaletteConfig(): CngxCommandPaletteConfig {
  return inject(CNGX_COMMAND_PALETTE_CONFIG);
}

/**
 * Override any subset of the palette's text labels. Unset labels keep the
 * English defaults.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withCommandPaletteLabels(
  labels: Partial<
    Pick<
      CngxCommandPaletteConfig,
      'searchPlaceholder' | 'listboxLabel' | 'emptyLabel' | 'loadingLabel' | 'errorLabel' | 'retryLabel'
    >
  >,
): CngxCommandPaletteConfigFeature {
  return (config) => ({ ...config, ...labels });
}

/**
 * Set the combo that opens the palette (parsed via `parseKeyCombo`, e.g.
 * `'mod+k'`, `'mod+shift+p'`). Applies app-wide via `provideCommandPaletteConfig`
 * or per-scope via `provideCommandPaletteConfigAt`. A per-instance
 * `[openShortcut]` input still wins over this.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withPaletteShortcut(combo: string): CngxCommandPaletteConfigFeature {
  return (config) => ({ ...config, openShortcut: combo });
}

/**
 * Replace the footer keyboard legend.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withKeyboardLegend(
  entries: readonly CngxCommandPaletteLegendEntry[],
): CngxCommandPaletteConfigFeature {
  return (config) => ({ ...config, footerLegend: entries });
}

/**
 * Replace the `aria-live` result-count formatter (e.g. for pluralisation in
 * another locale).
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withResultCountFormatter(
  formatter: (count: number) => string,
): CngxCommandPaletteConfigFeature {
  return (config) => ({ ...config, resultCount: formatter });
}

/**
 * Register global default slot templates. Merged over any already set; a
 * per-instance `*cngxCommand*` slot still wins over these.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withCommandPaletteTemplates(
  templates: CngxCommandPaletteTemplates,
): CngxCommandPaletteConfigFeature {
  return (config) => ({
    ...config,
    templates: { ...config.templates, ...templates },
  });
}
