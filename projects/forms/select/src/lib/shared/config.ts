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
  readonly retryButton?: CngxSelectRetryButtonContext;
  readonly refreshing?: CngxSelectRefreshingContext;
  readonly commitError?: CngxSelectCommitErrorContext;
  readonly clearButton?: CngxSelectClearButtonContext;
  readonly optionPending?: CngxSelectOptionPendingContext;
  readonly optionError?: CngxSelectOptionErrorContext;
  readonly action?: CngxSelectActionContext;
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
   *
   * `'created'` is emitted by `CngxActionSelect` / `CngxActionMultiSelect`
   * after the bound `quickCreateAction` commit resolves — the just-
   * created item is both added to the panel and marked as selected.
   * Consumers who don't care about inline creation can leave the branch
   * unhandled; the library default handles it.
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
   * - single-select → `'Clear selection'`
   * - multi / combobox / typeahead → `'Reset selection'`
   */
  readonly clearButton?: string;
  /**
   * ARIA label for the per-chip remove button in multi-select and combobox.
   * Variant fallback when unset: `'Remove'`.
   */
  readonly chipRemove?: string;
  /**
   * ARIA label for the tree-select twisty button when the node is collapsed.
   * Default `'Expand node'`.
   */
  readonly treeExpand?: string;
  /**
   * ARIA label for the tree-select twisty button when the node is expanded.
   * Default `'Collapse node'`.
   */
  readonly treeCollapse?: string;
  /**
   * ARIA label on the panel-shell loading status region (first-load
   * spinner / bar / dots / skeleton wrapper). Read by AT when the panel
   * opens against a pending state. Default `'Loading options'`.
   */
  readonly statusLoading?: string;
  /**
   * ARIA label on the panel-shell refreshing-indicator (subsequent-load
   * progress bar / spinner / dots overlay shown while options stay
   * visible). Default `'Refreshing options'`.
   */
  readonly statusRefreshing?: string;
  /**
   * Last-resort fallback for the `fieldLabel` substituted into the
   * announcer's `format()` template when neither `[label]` nor
   * `[aria-label]` are bound. Default `'Selection'`.
   */
  readonly fieldLabelFallback?: string;
  /**
   * Default error message rendered when a `[commitAction]` rejects and
   * no inline message is supplied by the thrown error. Default
   * `'Save failed'`.
   */
  readonly commitFailedMessage?: string;
}

/**
 * Tuning parameters for the built-in recycler-backed virtualiser.
 * Every field is optional; omitted keys use the defaults shown below.
 * Consumers who need different knobs (custom scrollElement, per-index
 * estimateSize function, grid layout) bypass this and provide
 * `CNGX_PANEL_RENDERER_FACTORY` directly.
 *
 * @category interactive
 */
export interface CngxSelectVirtualizationConfig {
  /** Estimated item height in px. Default `32`. */
  readonly estimateSize?: number;
  /** Rows rendered outside the viewport for smoother scroll. Default `5`. */
  readonly overscan?: number;
  /**
   * Minimum option count below which virtualisation is skipped
   * (identity rendering). Useful when the same config applies to
   * selects of wildly varying sizes. `0` (default) always
   * virtualises when the config is present.
   */
  readonly threshold?: number;
  /** Passed verbatim to `injectRecycler.scrollDebounce`. Default `16` ms. */
  readonly scrollDebounce?: number;
  /** Passed verbatim to `injectRecycler.skeletonDelay`. Default `0`. */
  readonly skeletonDelay?: number;
}

/**
 * Visible fallback labels the shared `CngxSelectPanelShell` renders
 * when the consumer hasn't projected a custom template for the
 * corresponding view slot (`*cngxSelectLoading`, `*cngxSelectEmpty`,
 * `*cngxSelectError`, `*cngxSelectCommitError`). Every key is optional
 * — a missing key keeps the library default (mixed DE/EN, preserved
 * from day one). Apps that ship an `<cngx-select>` against a non-DE,
 * non-EN locale override the full bundle via
 * `provideSelectConfig(withFallbackLabels({ ... }))` OR per-slot.
 *
 * Per-instance template projection still wins — a slot with a custom
 * `TemplateRef` never reaches the fallback path.
 *
 * @category interactive
 */
export interface CngxSelectFallbackLabels {
  /** Fallback body when `loadingVariant === 'text'`. Default `'Loading…'`. */
  readonly loading?: string;
  /** Fallback body for the `empty` / `none` async views. Default `'No Options'`. */
  readonly empty?: string;
  /** Fallback message for the first-load error case. Default `'Loading failed'`. */
  readonly loadFailed?: string;
  /** Fallback retry-button label for the first-load error. Default `'Retry'`. */
  readonly loadFailedRetry?: string;
  /**
   * Fallback message for the inline refresh error (options stale + a
   * refresh attempt failed). Default `'Refresh failed'`.
   */
  readonly refreshFailed?: string;
  /** Fallback retry-button label for the inline refresh error. Default `'Try again'`. */
  readonly refreshFailedRetry?: string;
  /**
   * Fallback message for the commit-error banner (fires when a
   * bound `[commitAction]` rejects with `commitErrorDisplay === 'banner'`).
   * Default `'Save failed'`.
   */
  readonly commitFailed?: string;
  /** Fallback retry-button label for the commit-error banner. Default `'Try again'`. */
  readonly commitFailedRetry?: string;
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
  /**
   * Default placement of the popover panel relative to the trigger for
   * every flat select-family variant (`CngxSelect`, `CngxMultiSelect`,
   * `CngxCombobox`, `CngxTypeahead`, `CngxReorderableMultiSelect`,
   * `CngxTreeSelect`). Accepts the full `PopoverPlacement` union the
   * `cngxPopover` directive understands (`'top'`, `'top-start'`,
   * `'bottom-end'`, `'right'`, …). Per-instance `[popoverPlacement]`
   * input wins over component-scoped `provideSelectConfigAt`, which
   * wins over app-wide `provideSelectConfig`. Defaults to `'bottom'`.
   *
   * The two action organisms read
   * {@link /projects/forms/select/src/lib/shared/action-select-config.ts
   * CngxActionSelectConfig.popoverPlacement} instead — kept separate so
   * an app can open actions above the trigger while keeping the flat
   * variants below (or vice versa) without per-instance overrides.
   */
  readonly popoverPlacement?: PopoverPlacement;
  /**
   * Default `inputmode` attribute for the input-trigger variants
   * (`CngxCombobox`, `CngxTypeahead`, `CngxActionSelect`,
   * `CngxActionMultiSelect`). Tells the browser — especially iOS /
   * Android — which virtual keyboard layout to show. Defaults to
   * `'search'` because all four variants' inline inputs function as
   * search-filters over the panel's options. Override to `'text'`
   * for apps where the input doubles as free-form text entry, or to
   * `'email'` / `'url'` / `'tel'` / `'numeric'` / `'decimal'` for
   * typed value lookups.
   *
   * Per-instance `[inputMode]` input wins. Button-trigger variants
   * (`CngxSelect`, `CngxMultiSelect`, `CngxReorderableMultiSelect`,
   * `CngxTreeSelect`) don't read this key — they have no `<input>`.
   */
  readonly inputMode?:
    | 'search'
    | 'text'
    | 'email'
    | 'url'
    | 'tel'
    | 'numeric'
    | 'decimal'
    | 'none';
  /**
   * Default `enterkeyhint` attribute for the input-trigger variants.
   * Tells the browser which action-label to render on the virtual
   * keyboard's Enter key — `'search'`, `'go'`, `'done'`, etc.
   *
   * Library defaults per variant when unset:
   * - `CngxTypeahead` → `'done'` (Enter commits + closes)
   * - `CngxCombobox` → `'enter'` (Enter toggles without closing)
   * - `CngxActionSelect` → `'go'` (Enter fires quick-create)
   * - `CngxActionMultiSelect` → `'enter'` (Enter appends a chip)
   *
   * A non-null value here forces the hint across every variant;
   * per-instance `[enterKeyHint]` still wins.
   */
  readonly enterKeyHint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send'
    | null;
  /**
   * Layout strategy for the chip strip inside multi-value triggers
   * (`CngxMultiSelect`, `CngxCombobox`, `CngxReorderableMultiSelect`,
   * `CngxActionMultiSelect`, `CngxTreeSelect`). Controls what happens
   * when a consumer's value bag outgrows the trigger's natural width.
   *
   * - `'wrap'` (default, historical behaviour): chips wrap to new
   *   lines, trigger grows unbounded vertically.
   * - `'scroll-x'`: chips stay on one row, overflow horizontally
   *   scrollable. Preserves trigger height at any value-count.
   * - `'truncate'`: render the first `maxVisibleChips` chips then a
   *   `+N weitere` badge. Keeps the trigger compact; consumer owns
   *   the full selection via the panel or a `*cngxMultiSelectTriggerLabel`
   *   override.
   *
   * Per-instance `[chipOverflow]` input still wins. Single-value
   * variants don't read this key.
   */
  readonly chipOverflow?: 'wrap' | 'scroll-x' | 'truncate';
  /**
   * Opt-in virtualisation for every select-family variant in the
   * config's scope. When present, the variant internally wires a
   * {@link /projects/common/data/src/recycler/recycler.ts injectRecycler}
   * against its own popover scroll container — no consumer wrapper
   * component, no `CNGX_PANEL_RENDERER_FACTORY` override needed for
   * the common case. Provider-cascaded like every other config key:
   *
   * - App-wide: `provideSelectConfig(withVirtualization({ estimateSize: 36 }))`
   *   — every `<cngx-select>` etc. virtualises.
   * - Component-scoped: `viewProviders: [...provideSelectConfigAt(withVirtualization())]`
   *   — only the selects inside this scope virtualise.
   * - Default (absent / undefined): identity rendering, every option
   *   in the DOM.
   *
   * Consumers who need fully custom virtualisation (CDK viewport,
   * server-side paging, third-party libs) still provide
   * `CNGX_PANEL_RENDERER_FACTORY` directly — that token wins over
   * the config-driven recycler.
   */
  readonly virtualization?: CngxSelectVirtualizationConfig | null;
  /**
   * When `chipOverflow === 'truncate'`, the maximum number of chips
   * rendered before the `+N weitere` badge appears. Values ≤ 0 are
   * coerced to `1` (the badge alone never makes sense). Defaults to
   * `3`. Per-instance `[maxVisibleChips]` input still wins.
   */
  readonly maxVisibleChips?: number;
  /**
   * Default live-region policy used when a scalar-commit fails. Every
   * scalar variant (`CngxSelect`, `CngxTypeahead`, `CngxActionSelect`)
   * feeds this through `createCommitErrorAnnouncer` so assistive tech
   * reads either the full error message ({@link CngxCommitErrorAnnouncePolicy}
   * `kind: 'verbose'`) or a soft "selection removed" sentence
   * (`kind: 'soft'`).
   *
   * Library default **`null`** — each variant applies its own shipped
   * baseline (`CngxSelect` → verbose/assertive, `CngxTypeahead` +
   * `CngxActionSelect` → soft). Setting a concrete policy here forces
   * every scalar variant to adopt it; per-instance
   * `[commitErrorAnnouncePolicy]` still wins. Array-commit variants
   * (multi / combobox / reorderable / action-multi) announce through
   * their shared "removed" formatter path and don't read this key.
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
  /**
   * App-wide ARIA label overrides — avoids hardcoded German strings on
   * every consumer. Partial — omit a key to keep the variant's built-in
   * default. Per-instance input still wins.
   */
  readonly ariaLabels?: CngxSelectAriaLabels;
  /**
   * App-wide visible-label overrides for the shared panel-shell's
   * async-view fallback UI (loading text, empty body, load/refresh/
   * commit error messages + retry button labels). See
   * {@link CngxSelectFallbackLabels} for the key list + library
   * defaults. Partial — omit a key to keep the default. Per-instance
   * `*cngxSelectLoading` / `*cngxSelectEmpty` / `*cngxSelectError` /
   * `*cngxSelectCommitError` template projection still wins.
   */
  readonly fallbackLabels?: CngxSelectFallbackLabels;
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
    readonly retryButton?: TemplateRef<CngxSelectRetryButtonContext> | null;
    readonly refreshing?: TemplateRef<CngxSelectRefreshingContext> | null;
    readonly commitError?: TemplateRef<CngxSelectCommitErrorContext> | null;
    readonly clearButton?: TemplateRef<CngxSelectClearButtonContext> | null;
    readonly optionPending?: TemplateRef<CngxSelectOptionPendingContext> | null;
    readonly optionError?: TemplateRef<CngxSelectOptionErrorContext> | null;
    readonly action?: TemplateRef<CngxSelectActionContext> | null;
  };
}

/**
 * Library defaults — merged with anything provided by `provideSelectConfig`.
 *
 * @internal
 */
export const CNGX_SELECT_DEFAULTS: Required<
  Omit<
    CngxSelectConfig,
    'panelClass' | 'templates' | 'announcer' | 'ariaLabels' | 'fallbackLabels'
  >
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
  // `null` lets each input-trigger variant apply its own enterkeyhint
  // baseline when the app config is silent. Explicit string forces the
  // hint across every variant.
  enterKeyHint: null as
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send'
    | null,
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
      // `'created'` path (inline quick-create via `CngxActionSelect` /
      // `CngxActionMultiSelect`) reads identically in single + multi —
      // the item was just created AND picked in the same commit, so the
      // standard "selected" / "added" verbs would mis-describe the
      // delta. Handled before the multi branch so both cardinalities
      // share the same sentence shape.
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
      // Multi-select path: prefer the action + count detail when the
      // caller supplies them — gives AT users the delta ("added" /
      // "removed" / "reordered") plus the resulting selection size
      // or the new position for reorders.
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
        // Clear-all or last option removed.
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
 * Override the scalar-commit error-announce policy app-wide. Forces
 * `CngxSelect` / `CngxTypeahead` / `CngxActionSelect` to adopt the
 * supplied policy as their baseline. Pass `null` to restore each
 * variant's shipped default (`CngxSelect` verbose/assertive,
 * `CngxTypeahead` + `CngxActionSelect` soft).
 *
 * Per-instance `[commitErrorAnnouncePolicy]` input still wins.
 *
 * @category interactive
 */
export function withCommitErrorAnnouncePolicy(
  policy: CngxCommitErrorAnnouncePolicy | null,
): CngxSelectConfigFeature {
  return feature({ commitErrorAnnouncePolicy: policy });
}

/**
 * Default popover placement for every flat select-family variant.
 * Accepts any `PopoverPlacement` the `cngxPopover` directive
 * understands. Defaults to `'bottom'`. Per-instance
 * `[popoverPlacement]` input still wins.
 *
 * Action organisms use the sibling `withActionPopoverPlacement` on
 * `provideActionSelectConfig` so an app can open actions above the
 * trigger while keeping flat variants below.
 *
 * @category interactive
 */
export function withPopoverPlacement(
  placement: PopoverPlacement,
): CngxSelectConfigFeature {
  return feature({ popoverPlacement: placement });
}

/**
 * Override the default `inputmode` attribute for every input-trigger
 * variant. Library default is `'search'`. See
 * {@link CngxSelectConfig.inputMode} for the full enum.
 *
 * @category interactive
 */
export function withInputMode(
  mode: NonNullable<CngxSelectConfig['inputMode']>,
): CngxSelectConfigFeature {
  return feature({ inputMode: mode });
}

/**
 * Force the `enterkeyhint` attribute across every input-trigger
 * variant. Pass `null` (default) to restore each variant's
 * enterkeyhint baseline:
 * `CngxTypeahead` → `'done'`, `CngxCombobox` → `'enter'`,
 * `CngxActionSelect` → `'go'`, `CngxActionMultiSelect` → `'enter'`.
 *
 * @category interactive
 */
export function withEnterKeyHint(
  hint: NonNullable<CngxSelectConfig['enterKeyHint']> | null,
): CngxSelectConfigFeature {
  return feature({ enterKeyHint: hint });
}

/**
 * Override the chip-strip overflow strategy for every multi-value
 * variant. See {@link CngxSelectConfig.chipOverflow} for the three
 * modes (`'wrap'` | `'scroll-x'` | `'truncate'`). Defaults to
 * `'wrap'`.
 *
 * @category interactive
 */
export function withChipOverflow(
  mode: NonNullable<CngxSelectConfig['chipOverflow']>,
): CngxSelectConfigFeature {
  return feature({ chipOverflow: mode });
}

/**
 * Override the `maxVisibleChips` threshold for `chipOverflow: 'truncate'`
 * mode. Values ≤ 0 are coerced to `1`. Defaults to `3`.
 *
 * @category interactive
 */
export function withMaxVisibleChips(count: number): CngxSelectConfigFeature {
  return feature({ maxVisibleChips: Math.max(1, count) });
}

/**
 * Opt in to recycler-backed virtualisation for every select-family
 * variant in this config's scope. Pass an object to tune
 * `estimateSize` / `overscan` / `threshold` / `scrollDebounce` /
 * `skeletonDelay`, or pass `{}` / `true` for the defaults. Pass
 * `null` (default) to fall back to identity rendering.
 *
 * Per-component override via `provideSelectConfigAt` in viewProviders.
 * Custom virtualisation pipelines (CDK viewport, third-party, server-
 * side paging) bypass this and provide `CNGX_PANEL_RENDERER_FACTORY`
 * directly.
 *
 * @example
 * ```ts
 * provideSelectConfig(
 *   withVirtualization({ estimateSize: 36, overscan: 8, threshold: 500 }),
 * )
 * ```
 *
 * @category interactive
 */
export function withVirtualization(
  config: CngxSelectVirtualizationConfig | boolean = true,
): CngxSelectConfigFeature {
  const resolved =
    config === false ? null : config === true ? {} : config;
  return feature({ virtualization: resolved });
}

/**
 * App-wide overrides for the panel-shell's visible fallback labels
 * (loading text, empty body, load/refresh/commit error messages +
 * retry button labels). Partial — omit a key to keep the library
 * default. Per-instance template projection (e.g. `*cngxSelectError`)
 * still wins over any config entry here.
 *
 * @example
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
 *
 * @category interactive
 */
export function withFallbackLabels(
  labels: CngxSelectFallbackLabels,
): CngxSelectConfigFeature {
  return feature({ fallbackLabels: labels });
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
