import {
  computed,
  inject,
  InjectionToken,
  isSignal,
  makeEnvironmentProviders,
  Optional,
  SkipSelf,
  type EnvironmentProviders,
  type Provider,
  type Signal,
} from '@angular/core';
import { coerceSignal } from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

import {
  injectCommandPaletteSiteCopy,
  type CngxCommandPaletteSiteCopy,
} from '../i18n/command-palette-i18n';
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
 * Configuration for the command palette. The copy keys hold overrides only:
 * unset by default, a value or a `Signal` once a `with*` feature ran. Every
 * copy key they leave out reads the `commandPalette` section of the language
 * pack (English without one), so the palette follows a runtime language
 * switch.
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
  readonly searchPlaceholder?: string | Signal<string>;
  /** Accessible label for the results listbox. */
  readonly listboxLabel?: string | Signal<string>;
  /** Empty-state copy (async source returned no results). */
  readonly emptyLabel?: string | Signal<string>;
  /** First-load skeleton copy. */
  readonly loadingLabel?: string | Signal<string>;
  /** Error-state copy. */
  readonly errorLabel?: string | Signal<string>;
  /** Retry-button copy in the error state. */
  readonly retryLabel?: string | Signal<string>;
  /** Accessible name of the palette dialog while its `[ariaLabel]` is unbound. */
  readonly paletteLabel?: string | Signal<string>;
  /** Builds the polite `aria-live` result-count message. */
  readonly resultCount?: ((count: number) => string) | Signal<(count: number) => string>;
  /** Keyboard-legend rows rendered in the footer. */
  readonly footerLegend?:
    | readonly CngxCommandPaletteLegendEntry[]
    | Signal<readonly CngxCommandPaletteLegendEntry[]>;
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
 * Library-default palette configuration. Carries no copy: the copy defaults
 * are the `commandPalette` section of the language pack.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export const DEFAULT_COMMAND_PALETTE_CONFIG: CngxCommandPaletteConfig = {
  openShortcut: CNGX_COMMAND_PALETTE_DEFAULTS.openShortcut,
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

const valueOf = <T>(source: T | Signal<T>): T => (isSignal(source) ? source() : source);

/**
 * @internal - the config with every copy key unwrapped to a plain value. Still
 * a {@link CngxCommandPaletteConfig}, so a reader keeps one config shape.
 */
export type CngxCommandPaletteResolvedConfig = CngxCommandPaletteConfig &
  CngxCommandPaletteSiteCopy;

const RESOLVED_COPY = new WeakMap<
  Signal<CngxCommandPaletteSiteCopy>,
  WeakMap<CngxCommandPaletteConfig, Signal<CngxCommandPaletteResolvedConfig>>
>();

/**
 * @internal - one Signal of the config's copy keys, each unwrapped, over the
 * `commandPalette` section of the active pack at the reading site's locale, so
 * a language switch reaches every reader. A key the config leaves unset reads
 * the section. Memoized per site copy and config object: every palette part
 * under one injector reads the same `computed()`. Injection context required;
 * read the result inside a `computed()`, a template or a handler.
 */
export function resolveCommandPaletteCopy(
  config: CngxCommandPaletteConfig,
): Signal<CngxCommandPaletteResolvedConfig> {
  const site = injectCommandPaletteSiteCopy();
  let byConfig = RESOLVED_COPY.get(site);
  if (!byConfig) {
    byConfig = new WeakMap();
    RESOLVED_COPY.set(site, byConfig);
  }
  const cached = byConfig.get(config);
  if (cached) {
    return cached;
  }
  const copy = computed<CngxCommandPaletteResolvedConfig>(
    () => {
      const defaults = site();
      return {
        ...config,
        searchPlaceholder: valueOf(config.searchPlaceholder) ?? defaults.searchPlaceholder,
        listboxLabel: valueOf(config.listboxLabel) ?? defaults.listboxLabel,
        emptyLabel: valueOf(config.emptyLabel) ?? defaults.emptyLabel,
        loadingLabel: valueOf(config.loadingLabel) ?? defaults.loadingLabel,
        errorLabel: valueOf(config.errorLabel) ?? defaults.errorLabel,
        retryLabel: valueOf(config.retryLabel) ?? defaults.retryLabel,
        paletteLabel: valueOf(config.paletteLabel) ?? defaults.paletteLabel,
        resultCount: valueOf(config.resultCount) ?? defaults.resultCount,
        footerLegend: valueOf(config.footerLegend) ?? defaults.footerLegend,
        legendEntry: defaults.legendEntry,
      };
    },
    { equal: recordEqual },
  );
  byConfig.set(config, copy);
  return copy;
}

/**
 * The text-label keys {@link withCommandPaletteLabels} overrides.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export type CngxCommandPaletteLabelKey =
  | 'searchPlaceholder'
  | 'listboxLabel'
  | 'emptyLabel'
  | 'loadingLabel'
  | 'errorLabel'
  | 'retryLabel'
  | 'paletteLabel';

const LABEL_KEYS: readonly CngxCommandPaletteLabelKey[] = [
  'searchPlaceholder',
  'listboxLabel',
  'emptyLabel',
  'loadingLabel',
  'errorLabel',
  'retryLabel',
  'paletteLabel',
];

/**
 * Override any subset of the palette's text labels. Unset labels keep the
 * inherited value. Pass a `Signal` of the overrides to switch the language at
 * runtime; a key the Signal sets wins over the inherited value, an unset key
 * follows it.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withCommandPaletteLabels(
  labels:
    | Partial<Pick<CngxCommandPaletteConfig, CngxCommandPaletteLabelKey>>
    | Signal<Partial<Record<CngxCommandPaletteLabelKey, string>>>,
): CngxCommandPaletteConfigFeature {
  if (!isSignal(labels)) {
    return (config) => ({ ...config, ...labels });
  }
  return (config) => {
    const next: Record<string, unknown> = { ...config };
    for (const key of LABEL_KEYS) {
      const inherited = coerceSignal(config[key]);
      next[key] = computed(() => {
        const patch = labels();
        return key in patch ? patch[key] : inherited();
      });
    }
    return next as unknown as CngxCommandPaletteConfig;
  };
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
 * Replace the footer keyboard legend. Pass a `Signal` to switch the language at
 * runtime.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withKeyboardLegend(
  entries:
    | readonly CngxCommandPaletteLegendEntry[]
    | Signal<readonly CngxCommandPaletteLegendEntry[]>,
): CngxCommandPaletteConfigFeature {
  return (config) => ({ ...config, footerLegend: entries });
}

/**
 * Replace the `aria-live` result-count formatter (e.g. for pluralisation in
 * another locale). Pass a `Signal` of the formatter to switch the language at
 * runtime; the live count speaks the new formatter on its next change.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function withResultCountFormatter(
  formatter: ((count: number) => string) | Signal<(count: number) => string>,
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
