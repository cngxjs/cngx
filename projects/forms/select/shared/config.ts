import {
  InjectionToken,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
  makeEnvironmentProviders,
} from '@angular/core';

import type { PopoverPlacement } from '@cngx/common/popover';

import type { CngxSelectCommitErrorDisplay } from './commit-action.types';
import type { CngxCommitErrorAnnouncePolicy } from './commit-error-announcer';
import type {
  CngxSelectActionContext,
  CngxSelectCaretContext,
  CngxSelectCheckContext,
  CngxSelectClearButtonContext,
  CngxSelectCommitErrorContext,
  CngxSelectEmptyContext,
  CngxSelectErrorContext,
  CngxSelectLoadingContext,
  CngxSelectRetryButtonContext,
  CngxSelectOptgroupContext,
  CngxSelectOptionErrorContext,
  CngxSelectOptionLabelContext,
  CngxSelectOptionPendingContext,
  CngxSelectPlaceholderContext,
  CngxSelectRefreshingContext,
  CngxSelectTriggerLabelContext,
} from './template-slots';

/**
 * Override contexts mirroring the per-instance `*cngxSelect*` slots.
 *
 * @category forms/select/config
 */
export interface CngxSelectTemplateContexts {
  readonly check?: CngxSelectCheckContext;
  readonly caret?: CngxSelectCaretContext;
  readonly optgroup?: CngxSelectOptgroupContext;
  readonly placeholder?: CngxSelectPlaceholderContext;
  readonly empty?: CngxSelectEmptyContext;
  readonly loading?: CngxSelectLoadingContext;
  readonly triggerLabel?: CngxSelectTriggerLabelContext;
  readonly optionLabel?: CngxSelectOptionLabelContext;
  readonly error?: CngxSelectErrorContext;
  readonly retryButton?: CngxSelectRetryButtonContext;
  /** Glyph slot inside spinner/bar/dots loading + refreshing indicators. */
  readonly loadingGlyph?: Record<string, never>;
  readonly refreshing?: CngxSelectRefreshingContext;
  readonly commitError?: CngxSelectCommitErrorContext;
  readonly clearButton?: CngxSelectClearButtonContext;
  readonly optionPending?: CngxSelectOptionPendingContext;
  readonly optionError?: CngxSelectOptionErrorContext;
  readonly action?: CngxSelectActionContext;
}

/**
 * Live-region announcer config: politeness + formatter.
 *
 * @category forms/select/config
 */
export interface CngxSelectAnnouncerConfig {
  readonly enabled?: boolean;
  readonly politeness?: 'polite' | 'assertive';
  /**
   * Live-region message formatter.
   * - `action`/`count`: multi-select only. Single leaves them undefined.
   * - `'reordered'` + `fromIndex`/`toIndex`: chip move, no membership change.
   * - `'created'`: inline quick-create.
   */
  readonly format?: (input: {
    readonly selectedLabel: string | null;
    readonly fieldLabel: string;
    readonly multi: boolean;
    readonly action?: 'added' | 'removed' | 'reordered' | 'created';
    readonly count?: number;
    readonly fromIndex?: number;
    readonly toIndex?: number;
  }) => string;
}

/**
 * First-load async view variant. Per-instance `*cngxSelectLoading` wins.
 *
 * @category forms/select/config
 */
export type CngxSelectLoadingVariant = 'skeleton' | 'spinner' | 'bar' | 'text';

/**
 * Subsequent-load indicator overlaying visible options. Per-instance
 * `*cngxSelectRefreshing` wins. `'none'` suppresses.
 *
 * @category forms/select/config
 */
export type CngxSelectRefreshingVariant = 'bar' | 'spinner' | 'dots' | 'none';

/**
 * Selection-indicator position relative to the option label.
 *
 * @category forms/select/config
 */
export type CngxSelectSelectionIndicatorPosition = 'before' | 'after';

/**
 * Selection-indicator glyph.
 *
 * - `'auto'` - `'checkbox'` for multi/combobox, `'checkmark'` for single.
 * - `'checkbox'` - bordered checkbox.
 * - `'checkmark'` - bare checkmark.
 * - `'radio'` - dot-in-circle. Single-select intent; multi panels render
 *   it but the exclusive-selection visual is misleading there.
 *
 * @category forms/select/config
 */
export type CngxSelectSelectionIndicatorVariant = 'auto' | 'checkbox' | 'checkmark' | 'radio';

/**
 * ARIA-label overrides. Per-instance
 * `[clearButtonAriaLabel]`/`[chipRemoveAriaLabel]` wins.
 *
 * @category forms/select/config
 */
export interface CngxSelectAriaLabels {
  /** Single → `'Clear selection'`; multi/combobox/typeahead → `'Reset selection'`. */
  readonly clearButton?: string;
  /** Per-chip remove. Default `'Remove'`. */
  readonly chipRemove?: string;
  /** Tree-select twisty (collapsed). Default `'Expand node'`. */
  readonly treeExpand?: string;
  /** Tree-select twisty (expanded). Default `'Collapse node'`. */
  readonly treeCollapse?: string;
  /** Panel-shell loading status region. Default `'Loading options'`. */
  readonly statusLoading?: string;
  /** Panel-shell refreshing overlay. Default `'Refreshing options'`. */
  readonly statusRefreshing?: string;
  /** Announcer `fieldLabel` last-resort fallback. Default `'Selection'`. */
  readonly fieldLabelFallback?: string;
  /** `[commitAction]` rejection fallback. Default `'Save failed'`. */
  readonly commitFailedMessage?: string;
  /** `<cngx-select-search>` input. Default `'Search options'`. */
  readonly searchInput?: string;
}

/**
 * Built-in recycler virtualiser tuning. Provide
 * `CNGX_PANEL_RENDERER_FACTORY` directly for custom scrollElement,
 * per-index `estimateSize`, or grid layout.
 *
 * @category forms/select/config
 */
export interface CngxSelectVirtualizationConfig {
  /** Item height in px. Default `32`. */
  readonly estimateSize?: number;
  /** Rows outside the viewport. Default `5`. */
  readonly overscan?: number;
  /** Skip virtualisation below this count (identity render). Default `0`. */
  readonly threshold?: number;
  /** Forwarded to `injectRecycler.scrollDebounce`. Default `16` ms. */
  readonly scrollDebounce?: number;
  /** Forwarded to `injectRecycler.skeletonDelay`. Default `0`. */
  readonly skeletonDelay?: number;
}

/**
 * Fallback labels for `CngxSelectPanelShell`'s built-in views.
 * Per-instance template projection wins.
 */
export interface CngxSelectFallbackLabels {
  /** `loadingVariant === 'text'` body. Default `'Loading…'`. */
  readonly loading?: string;
  /** `empty`/`none` views. Default `'No Options'`. */
  readonly empty?: string;
  /** First-load error. Default `'Loading failed'`. */
  readonly loadFailed?: string;
  /** First-load error retry button. Default `'Retry'`. */
  readonly loadFailedRetry?: string;
  /** Inline refresh error. Default `'Refresh failed'`. */
  readonly refreshFailed?: string;
  /** Inline refresh error retry button. Default `'Try again'`. */
  readonly refreshFailedRetry?: string;
  /** Commit-error banner. Default `'Save failed'`. */
  readonly commitFailed?: string;
  /** Commit-error retry button. Default `'Try again'`. */
  readonly commitFailedRetry?: string;
}

/**
 * Resolved select-family configuration cascade. Built by composing
 * `with*` features through `provideSelectConfig` /
 * `provideSelectConfigAt`; consumed via the `CNGX_SELECT_CONFIG`
 * injection token. Every field is optional - unset keys fall back to
 * the library defaults.
 */
export interface CngxSelectConfig {
  /**
   * Panel width strategy:
   * - `'trigger'` (default): panel min-width matches trigger width via `anchor-size(width)`.
   * - `number`: fixed px min-width.
   * - `null`: natural - panel sizes to content.
   */
  readonly panelWidth?: 'trigger' | number | null;
  /** Default first-load indicator variant. */
  readonly loadingVariant?: CngxSelectLoadingVariant;
  /** Number of skeleton rows rendered when `loadingVariant === 'skeleton'`. */
  readonly skeletonRowCount?: number;
  /** Default subsequent-load (refreshing) indicator variant. */
  readonly refreshingVariant?: CngxSelectRefreshingVariant;
  /** Default surface for `commitAction` errors: banner, inline, or none. */
  readonly commitErrorDisplay?: CngxSelectCommitErrorDisplay;
  /**
   * Popover placement for every flat variant. Default `'bottom'`. Action
   * organisms read `CngxActionSelectConfig.popoverPlacement` instead.
   */
  readonly popoverPlacement?: PopoverPlacement;
  /**
   * `inputmode` for input-trigger variants. Default `'search'`.
   * Button-trigger variants don't read this.
   */
  readonly inputMode?: 'search' | 'text' | 'email' | 'url' | 'tel' | 'numeric' | 'decimal' | 'none';
  /**
   * `enterkeyhint` forced across input-trigger variants. `null` keeps
   * each variant's baseline (Typeahead `'done'`, Combobox `'enter'`,
   * ActionSelect `'go'`, ActionMultiSelect `'enter'`).
   */
  readonly enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | null;
  /**
   * Chip-strip overflow for multi-value triggers.
   * - `'wrap'` (default) - chips wrap, trigger grows.
   * - `'scroll-x'` - single row, horizontal scroll.
   * - `'truncate'` - first `maxVisibleChips` chips + `+N` badge.
   */
  readonly chipOverflow?: 'wrap' | 'scroll-x' | 'truncate';
  /**
   * Opt-in recycler virtualisation. Custom virtualisation pipelines
   * provide `CNGX_PANEL_RENDERER_FACTORY` directly - that token wins.
   */
  readonly virtualization?: CngxSelectVirtualizationConfig | null;
  /** Truncate threshold. Values ≤ 0 coerced to `1`. Default `3`. */
  readonly maxVisibleChips?: number;
  /**
   * Forces the scalar-commit error announce policy. `null` keeps each
   * variant's baseline (CngxSelect verbose/assertive, Typeahead +
   * ActionSelect soft). Array-commit variants don't read this.
   */
  readonly commitErrorAnnouncePolicy?: CngxCommitErrorAnnouncePolicy | null;
  /** Class(es) applied to the panel root for theming. */
  readonly panelClass?: string | readonly string[];
  /** Typeahead buffer reset window in ms. */
  readonly typeaheadDebounceInterval?: number;
  /** Whether typeahead commits value while panel is closed (native `<select>` parity). */
  readonly typeaheadWhileClosed?: boolean;
  /** Whether the default selected-indicator (checkmark) is shown at all. */
  readonly showSelectionIndicator?: boolean;
  /**
   * Position of the per-option selection indicator relative to the label
   * inside a panel row. Defaults to `'before'`.
   */
  readonly selectionIndicatorPosition?: CngxSelectSelectionIndicatorPosition;
  /**
   * Visual form of the per-option selection indicator. `'auto'` picks
   * `'checkbox'` for multi-select / combobox and `'checkmark'` for
   * single-select. Defaults to `'auto'`.
   */
  readonly selectionIndicatorVariant?: CngxSelectSelectionIndicatorVariant;
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
  /** ARIA-label overrides. Partial. Per-instance input wins. */
  readonly ariaLabels?: CngxSelectAriaLabels;
  /** Panel-shell async-view fallback labels. Per-instance template wins. */
  readonly fallbackLabels?: CngxSelectFallbackLabels;
  /** Default template overrides applied when no per-instance slot is projected. */
  readonly templates?: {
    readonly check?: TemplateRef<CngxSelectCheckContext> | null;
    readonly caret?: TemplateRef<CngxSelectCaretContext> | null;
    readonly optgroup?: TemplateRef<CngxSelectOptgroupContext> | null;
    readonly placeholder?: TemplateRef<CngxSelectPlaceholderContext> | null;
    readonly empty?: TemplateRef<CngxSelectEmptyContext> | null;
    readonly loading?: TemplateRef<CngxSelectLoadingContext> | null;
    readonly triggerLabel?: TemplateRef<CngxSelectTriggerLabelContext> | null;
    readonly optionLabel?: TemplateRef<CngxSelectOptionLabelContext> | null;
    readonly error?: TemplateRef<CngxSelectErrorContext> | null;
    readonly retryButton?: TemplateRef<CngxSelectRetryButtonContext> | null;
    readonly loadingGlyph?: TemplateRef<void> | null;
    readonly refreshing?: TemplateRef<CngxSelectRefreshingContext> | null;
    readonly commitError?: TemplateRef<CngxSelectCommitErrorContext> | null;
    readonly clearButton?: TemplateRef<CngxSelectClearButtonContext> | null;
    readonly optionPending?: TemplateRef<CngxSelectOptionPendingContext> | null;
    readonly optionError?: TemplateRef<CngxSelectOptionErrorContext> | null;
    readonly action?: TemplateRef<CngxSelectActionContext> | null;
  };
}

/** Library defaults merged with `provideSelectConfig` user values. @internal */
export const CNGX_SELECT_DEFAULTS: Required<
  Omit<CngxSelectConfig, 'panelClass' | 'templates' | 'announcer' | 'ariaLabels' | 'fallbackLabels'>
> & {
  readonly panelClass: string | readonly string[];
  readonly templates: Required<NonNullable<CngxSelectConfig['templates']>>;
  readonly announcer: Required<Omit<CngxSelectAnnouncerConfig, 'format'>> & {
    readonly format: NonNullable<CngxSelectAnnouncerConfig['format']>;
  };
  readonly ariaLabels: CngxSelectAriaLabels;
  readonly fallbackLabels: Required<CngxSelectFallbackLabels>;
} = {
  panelWidth: 'trigger',
  loadingVariant: 'spinner',
  skeletonRowCount: 3,
  refreshingVariant: 'bar',
  commitErrorDisplay: 'banner',
  commitErrorAnnouncePolicy: null,
  popoverPlacement: 'bottom',
  inputMode: 'search',
  // null = each variant applies its own enterkeyhint baseline.
  enterKeyHint: null as 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | null,
  chipOverflow: 'wrap' as 'wrap' | 'scroll-x' | 'truncate',
  maxVisibleChips: 3,
  virtualization: null as CngxSelectVirtualizationConfig | null,
  panelClass: '',
  typeaheadDebounceInterval: 300,
  typeaheadWhileClosed: true,
  showSelectionIndicator: true,
  selectionIndicatorPosition: 'before',
  selectionIndicatorVariant: 'auto',
  showCaret: true,
  restoreFocus: true,
  dismissOn: 'both',
  openOn: 'click',
  announcer: {
    enabled: true,
    politeness: 'polite',
    format: ({ selectedLabel, fieldLabel, multi, action, count, toIndex }): string => {
      // `'created'` reads identically in single + multi - both
      // cardinalities share the sentence shape.
      if (action === 'created') {
        if (selectedLabel == null) {
          return `${fieldLabel}: created`;
        }
        return `${fieldLabel}: ${selectedLabel} created and selected`;
      }
      if (!multi) {
        if (selectedLabel == null) {
          return `${fieldLabel}: selection cleared`;
        }
        return `${fieldLabel}: ${selectedLabel} selected`;
      }
      if (action === 'reordered') {
        if (selectedLabel == null) {
          return `${fieldLabel}: moved`;
        }
        if (typeof toIndex === 'number') {
          return `${fieldLabel}: ${selectedLabel} moved to position ${toIndex + 1}`;
        }
        return `${fieldLabel}: ${selectedLabel} moved`;
      }
      if (selectedLabel == null) {
        return `${fieldLabel}: selection cleared`;
      }
      const verb = action === 'removed' ? 'removed' : 'added';
      if (typeof count === 'number') {
        return `${fieldLabel}: ${selectedLabel} ${verb}, ${count} selected`;
      }
      return `${fieldLabel}: ${selectedLabel} ${verb}`;
    },
  },
  templates: {
    check: null,
    caret: null,
    optgroup: null,
    placeholder: null,
    empty: null,
    loading: null,
    triggerLabel: null,
    optionLabel: null,
    error: null,
    retryButton: null,
    loadingGlyph: null,
    refreshing: null,
    commitError: null,
    clearButton: null,
    optionPending: null,
    optionError: null,
    action: null,
  },
  ariaLabels: {
    treeExpand: 'Expand node',
    treeCollapse: 'Collapse node',
    statusLoading: 'Loading options',
    statusRefreshing: 'Refreshing options',
    fieldLabelFallback: 'Selection',
    commitFailedMessage: 'Save failed',
    searchInput: 'Search options',
  },
  fallbackLabels: {
    loading: 'Loading…',
    empty: 'No Options',
    loadFailed: 'Loading failed',
    loadFailedRetry: 'Retry',
    refreshFailed: 'Refresh failed',
    refreshFailedRetry: 'Try again',
    commitFailed: 'Save failed',
    commitFailedRetry: 'Try again',
  },
};

/**
 * Resolved configuration shared by every select-family composite - panel
 * presentation, loading / refreshing variants, chip overflow, virtualization,
 * keyboard open / dismiss triggers, selection-indicator style, and the ARIA /
 * fallback labels. Composed from the `with*` features (`withPanelWidth`,
 * `withVirtualization`, `withSelectionIndicator`, `withAriaLabels`, ...).
 *
 * Provide it through one of two entry points, never the token directly:
 *
 * - `provideSelectConfig(...)` returns `EnvironmentProviders` - app bootstrap or a route.
 * - `provideSelectConfigAt(...)` returns `Provider[]` - a component's `providers` / `viewProviders`.
 *
 * Resolution is nearest-wins: a nested provider replaces an ancestor config for
 * its subtree, it does not deep-merge. The action-select and reorderable
 * composites layer their own `CNGX_ACTION_SELECT_CONFIG` /
 * `CNGX_REORDERABLE_SELECT_CONFIG` on top of this base.
 *
 * @category forms/select/config
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/config.ts
 * @since 0.1.0
 * @relatedTo provideSelectConfig, provideSelectConfigAt, CngxSelectConfig, CNGX_ACTION_SELECT_CONFIG, CNGX_REORDERABLE_SELECT_CONFIG
 */
export const CNGX_SELECT_CONFIG = new InjectionToken<CngxSelectConfig>('CngxSelectConfig');

/**
 * Feature returned by a `with*` helper. Merged by `provideSelectConfig`.
 */
export interface CngxSelectConfigFeature {
  readonly config: Partial<CngxSelectConfig>;
  /** @internal Discriminator for `provideCngxSelect` dispatch. */
  readonly _target?: 'select';
}

function feature(config: Partial<CngxSelectConfig>): CngxSelectConfigFeature {
  return { config, _target: 'select' };
}

/**
 * Panel width: `'trigger'` (match), fixed px number, or `null` (natural).
 */
export function withPanelWidth(width: CngxSelectConfig['panelWidth']): CngxSelectConfigFeature {
  return feature({ panelWidth: width });
}

/**
 * First-load indicator variant. Default `'spinner'`.
 */
export function withLoadingVariant(variant: CngxSelectLoadingVariant): CngxSelectConfigFeature {
  return feature({ loadingVariant: variant });
}

/**
 * Sets `skeletonRowCount`. Default `3`.
 */
export function withSkeletonRowCount(count: number): CngxSelectConfigFeature {
  return feature({ skeletonRowCount: count });
}

/**
 * Sets the refreshing indicator. Default `'bar'`. `'none'` suppresses.
 */
export function withRefreshingVariant(
  variant: CngxSelectRefreshingVariant,
): CngxSelectConfigFeature {
  return feature({ refreshingVariant: variant });
}

/**
 * Default `[commitAction]` error surface. Default `'banner'`.
 */
export function withCommitErrorDisplay(
  display: CngxSelectCommitErrorDisplay,
): CngxSelectConfigFeature {
  return feature({ commitErrorDisplay: display });
}

/**
 * Forces the scalar-commit error-announce policy. `null` restores each
 * variant's baseline.
 */
export function withCommitErrorAnnouncePolicy(
  policy: CngxCommitErrorAnnouncePolicy | null,
): CngxSelectConfigFeature {
  return feature({ commitErrorAnnouncePolicy: policy });
}

/**
 * Default popover placement for flat variants. Default `'bottom'`.
 * Action organisms use `withActionPopoverPlacement`.
 */
export function withPopoverPlacement(placement: PopoverPlacement): CngxSelectConfigFeature {
  return feature({ popoverPlacement: placement });
}

/**
 * Sets `inputmode` for input-trigger variants. Default `'search'`.
 */
export function withInputMode(
  mode: NonNullable<CngxSelectConfig['inputMode']>,
): CngxSelectConfigFeature {
  return feature({ inputMode: mode });
}

/**
 * Forces `enterkeyhint` across input-trigger variants. `null` restores
 * each variant's baseline.
 */
export function withEnterKeyHint(
  hint: NonNullable<CngxSelectConfig['enterKeyHint']> | null,
): CngxSelectConfigFeature {
  return feature({ enterKeyHint: hint });
}

/**
 * Sets the chip-strip overflow mode. Default `'wrap'`.
 */
export function withChipOverflow(
  mode: NonNullable<CngxSelectConfig['chipOverflow']>,
): CngxSelectConfigFeature {
  return feature({ chipOverflow: mode });
}

/**
 * Sets `maxVisibleChips` for truncate mode. Coerces ≤ 0 to `1`. Default `3`.
 */
export function withMaxVisibleChips(count: number): CngxSelectConfigFeature {
  return feature({ maxVisibleChips: Math.max(1, count) });
}

/**
 * Opts in to recycler virtualisation. `{}` / `true` uses defaults;
 * `null` / `false` falls back to identity. Custom pipelines provide
 * `CNGX_PANEL_RENDERER_FACTORY` directly.
 *
 * ```ts
 * provideSelectConfig(
 *   withVirtualization({ estimateSize: 36, overscan: 8, threshold: 500 }),
 * )
 * ```
 */
export function withVirtualization(
  config: CngxSelectVirtualizationConfig | boolean = true,
): CngxSelectConfigFeature {
  const resolved = config === false ? null : config === true ? {} : config;
  return feature({ virtualization: resolved });
}

/**
 * Sets the panel-shell visible-fallback labels. Partial. Per-instance
 * template projection wins.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideSelectConfig(
 *       withFallbackLabels({
 *         loadFailed: 'Échec du chargement',
 *         loadFailedRetry: 'Réessayer',
 *         empty: 'Aucune option',
 *       }),
 *     ),
 *   ],
 * });
 * ```
 */
export function withFallbackLabels(labels: CngxSelectFallbackLabels): CngxSelectConfigFeature {
  return feature({ fallbackLabels: labels });
}

/**
 * Class list applied to every select panel.
 */
export function withPanelClass(panelClass: string | readonly string[]): CngxSelectConfigFeature {
  return feature({ panelClass });
}

/**
 * Typeahead buffer debounce in ms. Default `300`.
 */
export function withTypeaheadDebounce(ms: number): CngxSelectConfigFeature {
  return feature({ typeaheadDebounceInterval: ms });
}

/**
 * Typeahead-while-closed (native `<select>` parity). Default `true`.
 */
export function withTypeaheadWhileClosed(enabled: boolean): CngxSelectConfigFeature {
  return feature({ typeaheadWhileClosed: enabled });
}

/**
 * Whether the selected-option checkmark is rendered at all. Default `true`.
 */
export function withSelectionIndicator(enabled: boolean): CngxSelectConfigFeature {
  return feature({ showSelectionIndicator: enabled });
}

/**
 * Sets the selection-indicator position. Default `'before'`.
 */
export function withSelectionIndicatorPosition(
  position: CngxSelectSelectionIndicatorPosition,
): CngxSelectConfigFeature {
  return feature({ selectionIndicatorPosition: position });
}

/**
 * Sets the selection-indicator glyph. Default `'auto'`.
 */
export function withSelectionIndicatorVariant(
  variant: CngxSelectSelectionIndicatorVariant,
): CngxSelectConfigFeature {
  return feature({ selectionIndicatorVariant: variant });
}

/**
 * Whether the trigger's dropdown caret glyph is rendered. Default `true`.
 */
export function withCaret(enabled: boolean): CngxSelectConfigFeature {
  return feature({ showCaret: enabled });
}

/**
 * Whether the trigger is re-focused after the panel closes. Default `true`.
 */
export function withRestoreFocus(enabled: boolean): CngxSelectConfigFeature {
  return feature({ restoreFocus: enabled });
}

/**
 * Dismiss strategy for the panel. Default `'both'`.
 */
export function withDismissOn(mode: CngxSelectConfig['dismissOn']): CngxSelectConfigFeature {
  return feature({ dismissOn: mode });
}

/**
 * Open strategy for the trigger. Default `'click'`.
 */
export function withOpenOn(mode: CngxSelectConfig['openOn']): CngxSelectConfigFeature {
  return feature({ openOn: mode });
}

/**
 * Configure the live-region announcer used for selection changes.
 */
export function withAnnouncer(config: CngxSelectAnnouncerConfig): CngxSelectConfigFeature {
  return feature({ announcer: config });
}

/**
 * Sets ARIA-label overrides. Partial. Per-instance inputs win.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideSelectConfig(
 *       withAriaLabels({
 *         clearButton: 'Clear selection',
 *         chipRemove: 'Remove',
 *       }),
 *     ),
 *   ],
 * });
 * ```
 */
export function withAriaLabels(labels: CngxSelectAriaLabels): CngxSelectConfigFeature {
  return feature({ ariaLabels: labels });
}

/**
 * App-wide defaults for the Select family. `provideSelectConfigAt` and
 * per-instance inputs win.
 */
export function provideSelectConfig(...features: CngxSelectConfigFeature[]): EnvironmentProviders {
  const merged: {
    -readonly [K in keyof CngxSelectConfig]?: CngxSelectConfig[K];
  } = {};
  for (const f of features) {
    // Pull deep-merged keys aside before the flat assign so partial
    // overrides across features don't wipe earlier keys.
    const { announcer, templates, ariaLabels, ...flat } = f.config;
    Object.assign(merged, flat);
    if (announcer) {
      merged.announcer = { ...merged.announcer, ...announcer };
    }
    if (templates) {
      merged.templates = { ...merged.templates, ...templates };
    }
    if (ariaLabels) {
      merged.ariaLabels = { ...merged.ariaLabels, ...ariaLabels };
    }
  }
  return makeEnvironmentProviders([{ provide: CNGX_SELECT_CONFIG, useValue: merged }]);
}

/**
 * Component-scoped config. Returns `Provider[]` because `viewProviders`
 * rejects `EnvironmentProviders`.
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideSelectConfigAt(withPanelWidth(300))],
 * })
 * ```
 */
export function provideSelectConfigAt(...features: CngxSelectConfigFeature[]): Provider[] {
  const merged: {
    -readonly [K in keyof CngxSelectConfig]?: CngxSelectConfig[K];
  } = {};
  for (const f of features) {
    // Pull deep-merged keys aside before the flat assign so partial
    // overrides across features don't wipe earlier keys.
    const { announcer, templates, ariaLabels, ...flat } = f.config;
    Object.assign(merged, flat);
    if (announcer) {
      merged.announcer = { ...merged.announcer, ...announcer };
    }
    if (templates) {
      merged.templates = { ...merged.templates, ...templates };
    }
    if (ariaLabels) {
      merged.ariaLabels = { ...merged.ariaLabels, ...ariaLabels };
    }
  }
  return [{ provide: CNGX_SELECT_CONFIG, useValue: merged }];
}
