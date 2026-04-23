import {
  InjectionToken,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
  makeEnvironmentProviders,
} from '@angular/core';

import type { CngxSelectCommitErrorDisplay } from './commit-action.types';
import type {
  CngxSelectCaretContext,
  CngxSelectCheckContext,
  CngxSelectClearButtonContext,
  CngxSelectCommitErrorContext,
  CngxSelectEmptyContext,
  CngxSelectErrorContext,
  CngxSelectLoadingContext,
  CngxSelectOptgroupContext,
  CngxSelectOptionErrorContext,
  CngxSelectOptionLabelContext,
  CngxSelectOptionPendingContext,
  CngxSelectPlaceholderContext,
  CngxSelectRefreshingContext,
  CngxSelectTriggerLabelContext,
} from './template-slots';

/**
 * Template contexts the select family exposes for override. Each key
 * corresponds to a `*cngxSelect*` template-slot directive — the types
 * mirror the consumer-facing contexts so global defaults stay in lockstep
 * with what `ng-template let-*` bindings receive per instance.
 *
 * @category interactive
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
  readonly refreshing?: CngxSelectRefreshingContext;
  readonly commitError?: CngxSelectCommitErrorContext;
  readonly clearButton?: CngxSelectClearButtonContext;
  readonly optionPending?: CngxSelectOptionPendingContext;
  readonly optionError?: CngxSelectOptionErrorContext;
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
   *
   * `action` and `count` are only supplied by multi-select variants
   * (`multi: true`). Single-select consumers leave them undefined; the
   * library default ignores them on the single-select path for
   * back-compat with existing overrides.
   *
   * `'reordered'` is emitted by `CngxReorderableMultiSelect` when a
   * chip changes position without gaining or losing membership. The
   * optional `fromIndex` / `toIndex` pair describes the move; overrides
   * that don't care about reorder can leave them unread.
   */
  readonly format?: (input: {
    readonly selectedLabel: string | null;
    readonly fieldLabel: string;
    readonly multi: boolean;
    readonly action?: 'added' | 'removed' | 'reordered';
    readonly count?: number;
    readonly fromIndex?: number;
    readonly toIndex?: number;
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

/**
 * Where the selection indicator (checkbox / checkmark glyph) sits relative
 * to the option label inside a panel row.
 *
 * @category interactive
 */
export type CngxSelectSelectionIndicatorPosition = 'before' | 'after';

/**
 * Visual form of the per-option selection indicator.
 *
 * - `'auto'` resolves to `'checkbox'` in multi-select / combobox panels and
 *   to `'checkmark'` in single-select panels. Matches what most consumers
 *   expect without having to set it per-component.
 * - `'checkbox'` — always render a bordered boxed checkbox.
 * - `'checkmark'` — always render a bare checkmark glyph.
 *
 * @category interactive
 */
export type CngxSelectSelectionIndicatorVariant = 'auto' | 'checkbox' | 'checkmark';

/**
 * App-wide overrides for the standard ARIA labels used by the select family.
 *
 * All keys are optional — a missing key falls back to the variant's built-in
 * German default (so omitting `withAriaLabels(...)` is guaranteed to be
 * back-compatible). Per-instance inputs (`[clearButtonAriaLabel]`,
 * `[chipRemoveAriaLabel]`) still win over whatever is configured here.
 *
 * @category interactive
 */
export interface CngxSelectAriaLabels {
  /**
   * ARIA label for the built-in clear button. Applied to all variants
   * that render the clear affordance (single, multi, combobox, typeahead).
   *
   * Variant fallback when unset:
   * - single-select → `'Auswahl entfernen'`
   * - multi / combobox / typeahead → `'Auswahl zurücksetzen'`
   */
  readonly clearButton?: string;
  /**
   * ARIA label for the per-chip remove button in multi-select and combobox.
   * Variant fallback when unset: `'Entfernen'`.
   */
  readonly chipRemove?: string;
}

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
  /** Default surface for `commitAction` errors: banner, inline, or none. */
  readonly commitErrorDisplay?: CngxSelectCommitErrorDisplay;
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
  /**
   * App-wide ARIA label overrides — avoids hardcoded German strings on
   * every consumer. Partial — omit a key to keep the variant's built-in
   * default. Per-instance input still wins.
   */
  readonly ariaLabels?: CngxSelectAriaLabels;
  /**
   * Default template overrides (applied when a component instance doesn't
   * project its own). Each slot carries the same typed context a
   * per-instance `*cngxSelect*` directive would receive — so the
   * consumer's `ng-template let-*` bindings are type-checked against
   * the real shape no matter whether the template is projected per
   * instance or supplied globally via config.
   */
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
    readonly refreshing?: TemplateRef<CngxSelectRefreshingContext> | null;
    readonly commitError?: TemplateRef<CngxSelectCommitErrorContext> | null;
    readonly clearButton?: TemplateRef<CngxSelectClearButtonContext> | null;
    readonly optionPending?: TemplateRef<CngxSelectOptionPendingContext> | null;
    readonly optionError?: TemplateRef<CngxSelectOptionErrorContext> | null;
  };
}

/**
 * Library defaults — merged with anything provided by `provideSelectConfig`.
 *
 * @internal
 */
export const CNGX_SELECT_DEFAULTS: Required<
  Omit<CngxSelectConfig, 'panelClass' | 'templates' | 'announcer' | 'ariaLabels'>
> & {
  readonly panelClass: string | readonly string[];
  readonly templates: Required<NonNullable<CngxSelectConfig['templates']>>;
  readonly announcer: Required<Omit<CngxSelectAnnouncerConfig, 'format'>> & {
    readonly format: NonNullable<CngxSelectAnnouncerConfig['format']>;
  };
  readonly ariaLabels: CngxSelectAriaLabels;
} = {
  panelWidth: 'trigger',
  loadingVariant: 'spinner',
  skeletonRowCount: 3,
  refreshingVariant: 'bar',
  commitErrorDisplay: 'banner',
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
      if (!multi) {
        if (selectedLabel == null) {
          return `${fieldLabel}: Auswahl geleert`;
        }
        return `${fieldLabel}: ${selectedLabel} gewählt`;
      }
      // Multi-select path: prefer the action + count detail when the
      // caller supplies them — gives AT users the delta ("added" /
      // "removed" / "reordered") plus the resulting selection size
      // or the new position for reorders.
      if (action === 'reordered') {
        if (selectedLabel == null) {
          return `${fieldLabel}: verschoben`;
        }
        if (typeof toIndex === 'number') {
          return `${fieldLabel}: ${selectedLabel} verschoben auf Position ${toIndex + 1}`;
        }
        return `${fieldLabel}: ${selectedLabel} verschoben`;
      }
      if (selectedLabel == null) {
        // Clear-all or last option removed.
        return `${fieldLabel}: Auswahl geleert`;
      }
      const verb = action === 'removed' ? 'entfernt' : 'hinzugefügt';
      if (typeof count === 'number') {
        return `${fieldLabel}: ${selectedLabel} ${verb}, ${count} ausgewählt`;
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
    refreshing: null,
    commitError: null,
    clearButton: null,
    optionPending: null,
    optionError: null,
  },
  ariaLabels: {},
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
 * Visual for the first-load indicator. Defaults to `'spinner'`.
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
 * Default surface for `[commitAction]` errors when no
 * `*cngxSelectCommitError` template is projected. Defaults to `'banner'`.
 *
 * @category interactive
 */
export function withCommitErrorDisplay(
  display: CngxSelectCommitErrorDisplay,
): CngxSelectConfigFeature {
  return feature({ commitErrorDisplay: display });
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
 * Position of the per-option selection indicator inside a panel row.
 * Defaults to `'before'`.
 *
 * @category interactive
 */
export function withSelectionIndicatorPosition(
  position: CngxSelectSelectionIndicatorPosition,
): CngxSelectConfigFeature {
  return feature({ selectionIndicatorPosition: position });
}

/**
 * Visual form of the per-option selection indicator — `'auto'` (default),
 * `'checkbox'`, or `'checkmark'`. `'auto'` resolves to `'checkbox'` for
 * multi-select / combobox and `'checkmark'` for single-select.
 *
 * @category interactive
 */
export function withSelectionIndicatorVariant(
  variant: CngxSelectSelectionIndicatorVariant,
): CngxSelectConfigFeature {
  return feature({ selectionIndicatorVariant: variant });
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
 * App-wide ARIA label overrides — avoids hardcoded German strings on
 * every consumer. Partial: omit a key to keep the variant's built-in
 * fallback. Per-instance `[clearButtonAriaLabel]` / `[chipRemoveAriaLabel]`
 * inputs still win over this configuration.
 *
 * @example
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
 *
 * @category interactive
 */
export function withAriaLabels(labels: CngxSelectAriaLabels): CngxSelectConfigFeature {
  return feature({ ariaLabels: labels });
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
    // Pull deep-merged keys out before the flat Object.assign so
    // subsequent features with partial `announcer` / `templates` /
    // `ariaLabels` don't blow away earlier keys.
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
  return makeEnvironmentProviders([
    { provide: CNGX_SELECT_CONFIG, useValue: merged },
  ]);
}

/**
 * Component-scoped config override. Returned providers go into a component's
 * `providers` or `viewProviders` via spread syntax — the return type is
 * `Provider[]`, NOT `EnvironmentProviders`, because `viewProviders` cannot
 * accept opaque environment providers.
 *
 * @example
 * ```ts
 * @Component({
 *   viewProviders: [...provideSelectConfigAt(withPanelWidth(300))],
 * })
 * ```
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
    // Pull deep-merged keys out before the flat Object.assign so
    // subsequent features with partial `announcer` / `templates` /
    // `ariaLabels` don't blow away earlier keys.
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
