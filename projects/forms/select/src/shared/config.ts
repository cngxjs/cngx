import {
  InjectionToken,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
  makeEnvironmentProviders,
} from '@angular/core';

/**
 * Template contexts the select family exposes for override.
 *
 * @category interactive
 */
export interface CngxSelectTemplateContexts {
  readonly check?: unknown;
  readonly caret?: unknown;
  readonly optgroup?: unknown;
  readonly placeholder?: unknown;
  readonly empty?: unknown;
  readonly loading?: unknown;
  readonly triggerLabel?: unknown;
  readonly optionLabel?: unknown;
  readonly error?: unknown;
  readonly refreshing?: unknown;
}

/**
 * Announcer configuration — live-region politeness + formatter.
 *
 * @category interactive
 */
export interface CngxSelectAnnouncerConfig {
  /** Whether selection changes are announced via a global live region. */
  readonly enabled?: boolean;
  /** ARIA-live politeness level. */
  readonly politeness?: 'polite' | 'assertive';
  /**
   * Message formatter. Receives selection metadata and returns the
   * sentence read by assistive tech.
   */
  readonly format?: (input: {
    readonly selectedLabel: string | null;
    readonly fieldLabel: string;
    readonly multi: boolean;
  }) => string;
}

/**
 * Library-wide Select configuration. Populated via `provideSelectConfig()` at
 * app bootstrap, overridable per component via view-providers, per-instance
 * via inputs.
 *
 * @category interactive
 */
/**
 * Visual for the first-load ("skeleton") async view — picks one of the
 * built-in defaults. Per-instance `*cngxSelectLoading` overrides wins over
 * every variant.
 *
 * @category interactive
 */
export type CngxSelectLoadingVariant = 'skeleton' | 'spinner' | 'bar' | 'text';

/**
 * Visual for the subsequent-load ("refreshing") indicator that overlays
 * the still-visible options. Per-instance `*cngxSelectRefreshing` overrides
 * wins over every variant. `'none'` suppresses the indicator entirely.
 *
 * @category interactive
 */
export type CngxSelectRefreshingVariant = 'bar' | 'spinner' | 'dots' | 'none';

export interface CngxSelectConfig {
  /**
   * Panel width strategy:
   * - `'trigger'` (default): panel min-width matches trigger width via `anchor-size(width)`.
   * - `number`: fixed px min-width.
   * - `null`: natural — panel sizes to content.
   */
  readonly panelWidth?: 'trigger' | number | null;
  /** Default first-load indicator variant. */
  readonly loadingVariant?: CngxSelectLoadingVariant;
  /** Number of skeleton rows rendered when `loadingVariant === 'skeleton'`. */
  readonly skeletonRowCount?: number;
  /** Default subsequent-load (refreshing) indicator variant. */
  readonly refreshingVariant?: CngxSelectRefreshingVariant;
  /** Class(es) applied to the panel root for theming. */
  readonly panelClass?: string | readonly string[];
  /** Typeahead buffer reset window in ms. */
  readonly typeaheadDebounceInterval?: number;
  /** Whether typeahead commits value while panel is closed (native `<select>` parity). */
  readonly typeaheadWhileClosed?: boolean;
  /** Whether the default selected-indicator (checkmark) is shown at all. */
  readonly showSelectionIndicator?: boolean;
  /** Whether the default trigger caret (▾) is shown at all. */
  readonly showCaret?: boolean;
  /** Focus-restore to trigger on panel close. */
  readonly restoreFocus?: boolean;
  /** Dismiss strategy: click outside, Escape, or both. */
  readonly dismissOn?: 'outside' | 'escape' | 'both';
  /** Open strategy: click, focus, or both. */
  readonly openOn?: 'click' | 'focus' | 'click+focus';
  /** Live-region announcer config. */
  readonly announcer?: CngxSelectAnnouncerConfig;
  /**
   * Default template overrides (applied when a component instance doesn't
   * project its own). Each is a `TemplateRef` or `null`.
   */
  readonly templates?: {
    readonly check?: TemplateRef<CngxSelectTemplateContexts['check']> | null;
    readonly caret?: TemplateRef<CngxSelectTemplateContexts['caret']> | null;
    readonly optgroup?: TemplateRef<CngxSelectTemplateContexts['optgroup']> | null;
    readonly placeholder?: TemplateRef<CngxSelectTemplateContexts['placeholder']> | null;
    readonly empty?: TemplateRef<CngxSelectTemplateContexts['empty']> | null;
    readonly loading?: TemplateRef<CngxSelectTemplateContexts['loading']> | null;
    readonly error?: TemplateRef<CngxSelectTemplateContexts['error']> | null;
    readonly refreshing?: TemplateRef<CngxSelectTemplateContexts['refreshing']> | null;
  };
}

/**
 * Library defaults — merged with anything provided by `provideSelectConfig`.
 *
 * @internal
 */
export const CNGX_SELECT_DEFAULTS: Required<
  Omit<CngxSelectConfig, 'panelClass' | 'templates' | 'announcer'>
> & {
  readonly panelClass: string | readonly string[];
  readonly templates: Required<NonNullable<CngxSelectConfig['templates']>>;
  readonly announcer: Required<Omit<CngxSelectAnnouncerConfig, 'format'>> & {
    readonly format: NonNullable<CngxSelectAnnouncerConfig['format']>;
  };
} = {
  panelWidth: 'trigger',
  loadingVariant: 'skeleton',
  skeletonRowCount: 3,
  refreshingVariant: 'bar',
  panelClass: '',
  typeaheadDebounceInterval: 300,
  typeaheadWhileClosed: true,
  showSelectionIndicator: true,
  showCaret: true,
  restoreFocus: true,
  dismissOn: 'both',
  openOn: 'click',
  announcer: {
    enabled: true,
    politeness: 'polite',
    format: ({ selectedLabel, fieldLabel, multi }): string => {
      if (selectedLabel == null) {
        return `${fieldLabel}: Auswahl geleert`;
      }
      return multi ? `${fieldLabel}: ${selectedLabel}` : `${fieldLabel}: ${selectedLabel} gewählt`;
    },
  },
  templates: {
    check: null,
    caret: null,
    optgroup: null,
    placeholder: null,
    empty: null,
    loading: null,
    error: null,
    refreshing: null,
  },
};

/**
 * Injection token that carries the resolved {@link CngxSelectConfig} for the
 * current injector scope. Falls back to {@link CNGX_SELECT_DEFAULTS}.
 *
 * @category interactive
 */
export const CNGX_SELECT_CONFIG = new InjectionToken<CngxSelectConfig>('CngxSelectConfig');

/**
 * Feature returned by a `with*` function — merged by `provideSelectConfig`.
 *
 * @category interactive
 */
export interface CngxSelectConfigFeature {
  readonly config: Partial<CngxSelectConfig>;
}

function feature(config: Partial<CngxSelectConfig>): CngxSelectConfigFeature {
  return { config };
}

/**
 * Panel width: `'trigger'` (match), fixed px number, or `null` (natural).
 *
 * @category interactive
 */
export function withPanelWidth(width: CngxSelectConfig['panelWidth']): CngxSelectConfigFeature {
  return feature({ panelWidth: width });
}

/**
 * Visual for the first-load indicator. Defaults to `'skeleton'`.
 *
 * @category interactive
 */
export function withLoadingVariant(variant: CngxSelectLoadingVariant): CngxSelectConfigFeature {
  return feature({ loadingVariant: variant });
}

/**
 * Number of skeleton rows rendered when `loadingVariant === 'skeleton'`.
 * Defaults to `3`.
 *
 * @category interactive
 */
export function withSkeletonRowCount(count: number): CngxSelectConfigFeature {
  return feature({ skeletonRowCount: count });
}

/**
 * Visual for the subsequent-load indicator (refreshing, options stay visible).
 * Defaults to `'bar'`. Use `'none'` to suppress the indicator entirely.
 *
 * @category interactive
 */
export function withRefreshingVariant(
  variant: CngxSelectRefreshingVariant,
): CngxSelectConfigFeature {
  return feature({ refreshingVariant: variant });
}

/**
 * Class list applied to every select panel.
 *
 * @category interactive
 */
export function withPanelClass(
  panelClass: string | readonly string[],
): CngxSelectConfigFeature {
  return feature({ panelClass });
}

/**
 * Typeahead buffer debounce in ms (default `300`).
 *
 * @category interactive
 */
export function withTypeaheadDebounce(ms: number): CngxSelectConfigFeature {
  return feature({ typeaheadDebounceInterval: ms });
}

/**
 * Whether typing a character commits a value while the panel is closed
 * (native `<select>` parity). Default `true`.
 *
 * @category interactive
 */
export function withTypeaheadWhileClosed(enabled: boolean): CngxSelectConfigFeature {
  return feature({ typeaheadWhileClosed: enabled });
}

/**
 * Whether the selected-option checkmark is rendered at all. Default `true`.
 *
 * @category interactive
 */
export function withSelectionIndicator(enabled: boolean): CngxSelectConfigFeature {
  return feature({ showSelectionIndicator: enabled });
}

/**
 * Whether the trigger's dropdown caret glyph is rendered. Default `true`.
 *
 * @category interactive
 */
export function withCaret(enabled: boolean): CngxSelectConfigFeature {
  return feature({ showCaret: enabled });
}

/**
 * Whether the trigger is re-focused after the panel closes. Default `true`.
 *
 * @category interactive
 */
export function withRestoreFocus(enabled: boolean): CngxSelectConfigFeature {
  return feature({ restoreFocus: enabled });
}

/**
 * Dismiss strategy for the panel. Default `'both'`.
 *
 * @category interactive
 */
export function withDismissOn(mode: CngxSelectConfig['dismissOn']): CngxSelectConfigFeature {
  return feature({ dismissOn: mode });
}

/**
 * Open strategy for the trigger. Default `'click'`.
 *
 * @category interactive
 */
export function withOpenOn(mode: CngxSelectConfig['openOn']): CngxSelectConfigFeature {
  return feature({ openOn: mode });
}

/**
 * Configure the live-region announcer used for selection changes.
 *
 * @category interactive
 */
export function withAnnouncer(config: CngxSelectAnnouncerConfig): CngxSelectConfigFeature {
  return feature({ announcer: config });
}

/**
 * App-wide defaults for all Select-family components.
 *
 * Composable via feature functions (`withPanelWidth`, `withTypeaheadDebounce`,
 * `withSelectionIndicator`, …). Component-level overrides win, per-instance
 * inputs win over that.
 *
 * @category interactive
 */
export function provideSelectConfig(
  ...features: CngxSelectConfigFeature[]
): EnvironmentProviders {
  const merged: {
    -readonly [K in keyof CngxSelectConfig]?: CngxSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
    if (f.config.announcer) {
      merged.announcer = { ...merged.announcer, ...f.config.announcer };
    }
    if (f.config.templates) {
      merged.templates = { ...merged.templates, ...f.config.templates };
    }
  }
  return makeEnvironmentProviders([
    { provide: CNGX_SELECT_CONFIG, useValue: merged },
  ]);
}

/**
 * Component-scoped config override. Returned providers go into a component's
 * `providers` or `viewProviders`.
 *
 * @category interactive
 */
export function provideSelectConfigAt(
  ...features: CngxSelectConfigFeature[]
): Provider[] {
  const merged: {
    -readonly [K in keyof CngxSelectConfig]?: CngxSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
    if (f.config.announcer) {
      merged.announcer = { ...merged.announcer, ...f.config.announcer };
    }
    if (f.config.templates) {
      merged.templates = { ...merged.templates, ...f.config.templates };
    }
  }
  return [{ provide: CNGX_SELECT_CONFIG, useValue: merged }];
}
