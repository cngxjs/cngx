import {
  inject,
  InjectionToken,
  type EnvironmentProviders,
  type Provider,
  type Signal,
  type TemplateRef,
  makeEnvironmentProviders,
} from '@angular/core';

import type { PopoverPlacement } from '@cngx/common/popover';
import { createOverrideMerge } from '@cngx/core/utils';

import type { CngxSelectCommitErrorDisplay } from './commit-action.types';
import type { CngxCommitErrorAnnouncePolicy } from './commit-error-announcer';
import type {
  CngxTreeSelectFooterContext,
  CngxTreeSelectNodeCountContext,
} from '../tree-select/tree-select.model';
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
  CngxSelectSheetCountContext,
  CngxSelectSheetHandleContext,
  CngxSelectTriggerLabelContext,
} from './template-slots';

/** Context type of a `TemplateRef`; a context-free slot maps to an empty record. */
type CngxSelectTemplateContextOf<R> =
  NonNullable<R> extends TemplateRef<infer C>
    ? C extends void
      ? Record<string, never>
      : C
    : never;

/**
 * Override contexts mirroring the per-instance `*cngxSelect*` slots, one key
 * per `CngxSelectConfig.templates` entry. Derived from that map, so a new
 * config template key brings its context type along; a context-free slot maps
 * to an empty record. The table below is written by hand, and a repo check
 * fails when its rows drift from the config keys, contexts or slots.
 *
 * | Key | Context | Slot |
 * |-|-|-|
 * | `check` | `CngxSelectCheckContext` | `*cngxSelectCheck` |
 * | `caret` | `CngxSelectCaretContext` | `*cngxSelectCaret` |
 * | `optgroup` | `CngxSelectOptgroupContext` | `*cngxSelectOptgroup` |
 * | `placeholder` | `CngxSelectPlaceholderContext` | `*cngxSelectPlaceholder` |
 * | `empty` | `CngxSelectEmptyContext` | `*cngxSelectEmpty` |
 * | `loading` | `CngxSelectLoadingContext` | `*cngxSelectLoading` |
 * | `triggerLabel` | `CngxSelectTriggerLabelContext` | `*cngxSelectTriggerLabel` |
 * | `optionLabel` | `CngxSelectOptionLabelContext` | `*cngxSelectOptionLabel` |
 * | `error` | `CngxSelectErrorContext` | `*cngxSelectError` |
 * | `retryButton` | `CngxSelectRetryButtonContext` | `*cngxSelectRetryButton` |
 * | `loadingGlyph` | `Record<string, never>` | `*cngxSelectLoadingGlyph` |
 * | `refreshing` | `CngxSelectRefreshingContext` | `*cngxSelectRefreshing` |
 * | `commitError` | `CngxSelectCommitErrorContext` | `*cngxSelectCommitError` |
 * | `clearButton` | `CngxSelectClearButtonContext` | `*cngxSelectClearButton` |
 * | `optionPending` | `CngxSelectOptionPendingContext` | `*cngxSelectOptionPending` |
 * | `optionError` | `CngxSelectOptionErrorContext` | `*cngxSelectOptionError` |
 * | `action` | `CngxSelectActionContext` | `*cngxSelectAction` (action variants only) |
 * | `sheetHandle` | `CngxSelectSheetHandleContext` | `*cngxSelectSheetHandle` |
 * | `treeNodeCount` | `CngxTreeSelectNodeCountContext` | `*cngxTreeSelectNodeCount` |
 * | `sheetCount` | `CngxSelectSheetCountContext` | `*cngxSelectSheetCount` |
 * | `treeFooter` | `CngxTreeSelectFooterContext` | `*cngxTreeSelectFooter` |
 */
export type CngxSelectTemplateContexts = {
  readonly [K in keyof NonNullable<CngxSelectConfig['templates']>]?: CngxSelectTemplateContextOf<
    NonNullable<CngxSelectConfig['templates']>[K]
  >;
};

/**
 * Live-region announcer config: politeness + formatter.
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
 */
export type CngxSelectLoadingVariant = 'skeleton' | 'spinner' | 'bar' | 'text';

/**
 * Subsequent-load indicator overlaying visible options. Per-instance
 * `*cngxSelectRefreshing` wins. `'none'` suppresses.
 */
export type CngxSelectRefreshingVariant = 'bar' | 'spinner' | 'dots' | 'none';

/**
 * Selection-indicator position relative to the option label.
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
 */
export type CngxSelectSelectionIndicatorVariant = 'auto' | 'checkbox' | 'checkmark' | 'radio';

/**
 * ARIA-label overrides. Per-instance
 * `[clearButtonAriaLabel]`/`[chipRemoveAriaLabel]` wins. Unset keys read the
 * `select` section of the active language pack, English by default.
 */
export interface CngxSelectAriaLabels {
  /** Single → `'Clear selection'`; multi/combobox/typeahead → `'Reset selection'`. */
  readonly clearButton?: string;
  /** Per-chip remove. Default `'Remove'`. */
  readonly chipRemove?: string;
  /**
   * Accessible name of a chip's remove button. Receives the remove action
   * (`chipRemove`, or the `[chipRemoveAriaLabel]` input) and the chip label,
   * and returns the whole name. Default `'{action}: {label}'` (`Remove: Red`).
   */
  readonly chipRemoveFor?: (action: string, label: string) => string;
  /**
   * Spoken value of a summary trigger (the touch-floor trigger of the
   * multi-value selects) holding two or more values. Receives the selected
   * labels in order and returns the whole text. Default
   * `'{count} selected: {list}'` (`3 selected: Red, Green, and Blue`), the list
   * joined for the reading locale.
   */
  readonly selectionSummary?: (labels: readonly string[]) => string;
  /** Panel-shell loading status region. Default `'Loading options'`. */
  readonly statusLoading?: string;
  /** Panel-shell refreshing overlay. Default `'Refreshing options'`. */
  readonly statusRefreshing?: string;
  /** Announcer `fieldLabel` last-resort fallback. Default `'Selection'`. */
  readonly fieldLabelFallback?: string;
  /**
   * Assertive announcement when a `[commitAction]` rejects. Receives the
   * field label (or `fieldLabelFallback`) and the rejection's
   * `Error.message`, `undefined` when the rejection is not an `Error`, and
   * returns the whole sentence. Default `'{label}: Save failed - {detail}'`,
   * `'{label}: Save failed'` when there is no detail.
   */
  readonly commitFailedMessage?: (label: string, detail: string | undefined) => string;
  /**
   * Polite announcement when a `[commitAction]` rejects and the previous
   * value was restored, under the `soft` announce policy (the default of
   * `CngxTypeahead` and `CngxActionSelect`). Without a rollback the soft
   * policy speaks `commitFailedMessage` politely. Receives the field label (or `fieldLabelFallback`) and returns the whole
   * sentence. Default `'{label}: Save failed, previous value restored'`.
   */
  readonly commitFailedSoft?: (label: string) => string;
  /**
   * Assertive announcement and trigger description when a quick-create
   * (`[quickCreateAction]`) rejects. Receives the field label (or
   * `fieldLabelFallback`), the draft label of the option and the rejection's
   * `Error.message` (`undefined` when the rejection is not an `Error`).
   * Default `'{label}: Could not create {option} - {detail}'`,
   * `'{label}: Could not create {option}'` when there is no detail.
   */
  readonly createFailedMessage?: (
    label: string,
    option: string,
    detail: string | undefined,
  ) => string;
  /** `<cngx-select-search>` input. Default `'Search options'`. */
  readonly searchInput?: string;
  /**
   * Last-resort accessible name for the panel listbox, used when the control
   * has no label, no `aria-label` and no placeholder to borrow. Default
   * `'Options'`.
   */
  readonly listboxFallback?: string;
  /** Close button in the header of the mobile sheet. Default `'Close'`. */
  readonly sheetClose?: string;
  /** Done button in the header of the mobile sheet (multi and input variants). Default `'Done'`. */
  readonly sheetDone?: string;
  /**
   * Why the sheet header's close and Done buttons and the panel reorder list's
   * move buttons are unavailable while a commit is pending; referenced through
   * `aria-describedby` only in that state. Default `'Unavailable while saving'`.
   */
  readonly commitPending?: string;
  /**
   * Polite announcement when a typed filter settles on one or more matching
   * options. Receives the number of matches and returns the whole text.
   * Default `'{count} results'` (`'1 result'` for one), the count formatted
   * for the reading locale.
   */
  readonly announceResults?: (count: number) => string;
  /** Polite announcement when a typed filter settles on no matching option. Default `'No results'`. */
  readonly announceNoResults?: string;
}

/**
 * Built-in recycler virtualiser tuning. Provide
 * `CNGX_PANEL_RENDERER_FACTORY` directly for custom scrollElement,
 * per-index `estimateSize`, or grid layout.
 */
export interface CngxSelectVirtualizationConfig {
  /**
   * Item height in px. Unset (the default), the recycler measures the first
   * option row once per open and again when that row's sizing changes
   * (density, text scale, touch target), with `32` only until a row is
   * measured. A set value turns measuring and the scroll rescale off, so a
   * value below the real row height under-counts the unrendered rows.
   */
  readonly estimateSize?: number;
  /** Rows outside the viewport. Default `5`. */
  readonly overscan?: number;
  /** Skip virtualisation below this count (identity render). Default `0`. */
  readonly threshold?: number;
  /** Forwarded to `injectRecycler.scrollDebounce`. Default `16` ms. */
  readonly scrollDebounce?: number;
}

/**
 * Fallback labels for `CngxSelectPanelShell`'s built-in views and the visible
 * chip-strip copy. Per-instance template projection wins. Unset keys read the
 * `select` section of the active language pack, English by default.
 */
export interface CngxSelectFallbackLabels {
  /** `loadingVariant === 'text'` body. Default `'Loading…'`. */
  readonly loading?: string;
  /** `empty`/`none` views. Default `'No options'`. */
  readonly empty?: string;
  /** First-load error. Default `'Could not load'`. */
  readonly loadFailed?: string;
  /** First-load error retry button. Default `'Retry'`. */
  readonly loadFailedRetry?: string;
  /** Inline refresh error. Default `'Refresh failed'`. */
  readonly refreshFailed?: string;
  /** Inline refresh error retry button. Default `'Retry'`. */
  readonly refreshFailedRetry?: string;
  /** `<cngx-select-search>` visible placeholder. Default `'Search…'`. */
  readonly searchPlaceholder?: string;
  /** Commit-error banner. Default `'Save failed'`. */
  readonly commitFailed?: string;
  /** Commit-error retry button. Default `'Retry'`. */
  readonly commitFailedRetry?: string;
  /**
   * Visible badge for the chips `chipOverflow: 'truncate'` or `'fit'` hides. Receives
   * the hidden count. Default `'+{count}'`, the count in the locale's digits.
   */
  readonly chipOverflowBadge?: (count: number) => string;
  /**
   * Selected-of-total count on a tree-select parent row. Receives the
   * selected and the total descendants. Default `'{selected}/{total}'`, the
   * numbers in the locale's digits.
   */
  readonly treeNodeCount?: (selected: number, total: number) => string;
  /** Selected count in the tree-select panel footer. Default `'{count} selected'`. */
  readonly selectedCount?: (count: number) => string;
}

/**
 * Search matcher of the select family: returns `true` when the option stays
 * visible for `term`. It receives the option's `value` and `label` and
 * nothing else, so it can be written once and reused across every searchable
 * variant, `CngxSelectShell` and `withSearchMatchFn`. A listbox item
 * (`ActiveDescendantItem`) satisfies the option shape, so the same function
 * also works as a `ListboxMatchFn`.
 *
 * ```ts
 * const startsWith: CngxSelectMatchFn = (option, term) =>
 *   option.label.toLowerCase().startsWith(term.toLowerCase());
 * ```
 *
 * @since 0.1.0
 * @relatedTo withSearchMatchFn, CngxSelectShell, ListboxMatchFn
 */
export type CngxSelectMatchFn<T = unknown> = (
  option: CngxSelectMatchOption<T>,
  term: string,
) => boolean;

/**
 * The option shape a {@link CngxSelectMatchFn} receives: the option's `value`
 * and plain-text `label`, nothing else. The select family passes a stable
 * object per option (the option definition, or the projected option's record
 * in `CngxSelectShell`), so a matcher can key a per-option cache on it.
 *
 * @since 0.1.0
 * @relatedTo CngxSelectMatchFn
 */
export interface CngxSelectMatchOption<T = unknown> {
  readonly value: T;
  readonly label: string;
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
   * - `'trigger'` (default): panel min-width matches the anchor width (the bordered
   *   trigger row) via `anchor-size(width)`.
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
   * - `'fit'` - one row, as many chips as fit, rest in the `+N` badge; set
   *   `--cngx-select-chip-fit-badge-reserve` for a wider badge (default `5ch`).
   */
  readonly chipOverflow?: 'wrap' | 'scroll-x' | 'truncate' | 'fit';
  /**
   * Opt-in recycler virtualisation. Custom virtualisation pipelines
   * provide `CNGX_PANEL_RENDERER_FACTORY` directly - that token wins.
   */
  readonly virtualization?: CngxSelectVirtualizationConfig | null;
  /** Truncate threshold. Values below 1 resolve to `1`, fractions are floored, non-finite values fall back to `3`. Default `3`. */
  readonly maxVisibleChips?: number;
  /**
   * Forces the scalar-commit error announce policy. `null` keeps each
   * variant's baseline (CngxSelect verbose/assertive, Typeahead +
   * ActionSelect soft). Array-commit variants don't read this.
   */
  readonly commitErrorAnnouncePolicy?: CngxCommitErrorAnnouncePolicy | null;
  /** Class(es) applied to the panel root for theming. */
  readonly panelClass?: string | readonly string[];
  /**
   * Typeahead buffer reset window in ms of the button-trigger variants
   * (`CngxSelect`, `CngxMultiSelect`, `CngxReorderableMultiSelect`,
   * `CngxSelectShell`): keys typed on the closed trigger within it join one
   * query. A per-instance `[typeaheadDebounceInterval]` wins. The search
   * debounce of the input variants is `searchDebounceMs`. Not read by
   * `CngxTreeSelect`: its typeahead runs inside the open panel's
   * `CngxActiveDescendant`. Default `300`.
   */
  readonly typeaheadDebounceInterval?: number;
  /**
   * Debounce in ms between the last keystroke in a search input and the
   * `searchTerm` / `searchTermChange` update, on the input variants
   * (`CngxCombobox`, `CngxTypeahead`, `CngxActionSelect`,
   * `CngxActionMultiSelect`) and the `<cngx-select-search>` of
   * `CngxSelectShell`. A per-instance `[searchDebounceMs]` wins. `0` writes on
   * every keystroke. Not read by `CngxSelect`, `CngxMultiSelect`,
   * `CngxReorderableMultiSelect` or `CngxTreeSelect`, which have no search
   * input. Default `300`.
   */
  readonly searchDebounceMs?: number;
  /** Whether typeahead commits value while panel is closed (native `<select>` parity). */
  readonly typeaheadWhileClosed?: boolean;
  /**
   * App-wide matcher for the inline search of the searchable variants
   * (`CngxCombobox`, `CngxTypeahead`, `CngxActionSelect`,
   * `CngxActionMultiSelect`, `CngxSelectShell`). A per-instance
   * `[searchMatchFn]` wins. `null` (default) keeps the folded label match
   * in the reading locale (case-, accent- and format-character-tolerant
   * substring). The matcher receives the option's `value` and `label`.
   */
  readonly searchMatchFn?: CngxSelectMatchFn | null;
  /**
   * Whether the default selected-indicator (checkmark) is shown at all.
   * `CngxTreeSelect` always renders its node checkbox and ignores this key
   * (see the tree-select README, "Limitations").
   */
  readonly showSelectionIndicator?: boolean;
  /**
   * Position of the per-option selection indicator inside a panel row:
   * `'after'` places it at the row end, `'before'` ahead of the label.
   * Defaults to `'after'`.
   */
  readonly selectionIndicatorPosition?: CngxSelectSelectionIndicatorPosition;
  /**
   * Visual form of the per-option selection indicator. `'auto'` picks
   * `'checkbox'` for multi-select / combobox and `'checkmark'` for
   * single-select. Defaults to `'auto'`. `CngxTreeSelect` keeps its node
   * checkbox whatever the variant (see the tree-select README, "Limitations").
   */
  readonly selectionIndicatorVariant?: CngxSelectSelectionIndicatorVariant;
  /** Whether the default trigger caret is shown at all. */
  readonly showCaret?: boolean;
  /**
   * Focus-restore to the trigger when the anchored popover closes. `false`
   * leaves focus where the panel left it. A modal mobile sheet always returns
   * focus to the trigger on close, whatever this key says: focus must not stay
   * on a dialog that is being removed.
   */
  readonly restoreFocus?: boolean;
  /**
   * Dismiss strategy: click outside, Escape, or both. This governs the
   * pointer and Escape vectors only. Focus leaving the host (Tab navigation
   * out of the control) always closes the panel, in every mode including
   * `'escape'`: a panel the user has Tab-navigated away from is no longer
   * theirs to keep open, and it is not an outside dismissal to suppress.
   */
  readonly dismissOn?: 'outside' | 'escape' | 'both';
  /**
   * Open strategy: click, focus, or both. Honoured by all nine composites;
   * the input variants open on focus of their text input. The focus restore
   * after a close never reopens the panel.
   */
  readonly openOn?: 'click' | 'focus' | 'click+focus';
  /**
   * Mobile presentation. `'auto'` (default) opens the panel as a modal bottom
   * sheet or fullscreen panel on coarse, narrow viewports and anchored
   * everywhere else; `'off'` keeps it anchored. A per-instance
   * `[presentation]` wins.
   */
  readonly mobileSheet?: 'auto' | 'off';
  /**
   * Live-region announcer config. A `Signal` swaps the formatter on a
   * language flip; the next announcement uses it.
   */
  readonly announcer?: CngxSelectAnnouncerConfig | Signal<CngxSelectAnnouncerConfig>;
  /** ARIA-label overrides. Partial, value or `Signal`. Per-instance input wins. */
  readonly ariaLabels?: CngxSelectAriaLabels | Signal<CngxSelectAriaLabels>;
  /**
   * Panel-shell async-view fallback labels, value or `Signal`. Per-instance
   * template wins.
   */
  readonly fallbackLabels?: CngxSelectFallbackLabels | Signal<CngxSelectFallbackLabels>;
  /**
   * Default template overrides applied when no per-instance slot is projected.
   * Each key mirrors one `*cngxSelect*` slot and takes a template with that
   * slot's context; `null` keeps the built-in rendering.
   */
  readonly templates?: {
    /** Selection indicator inside each option (`*cngxSelectCheck`). */
    readonly check?: TemplateRef<CngxSelectCheckContext> | null;
    /** Trigger caret glyph (`*cngxSelectCaret`). */
    readonly caret?: TemplateRef<CngxSelectCaretContext> | null;
    /** Optgroup header row (`*cngxSelectOptgroup`). */
    readonly optgroup?: TemplateRef<CngxSelectOptgroupContext> | null;
    /** Trigger content while nothing is selected (`*cngxSelectPlaceholder`). */
    readonly placeholder?: TemplateRef<CngxSelectPlaceholderContext> | null;
    /** Panel body when no option matches or none exist (`*cngxSelectEmpty`). */
    readonly empty?: TemplateRef<CngxSelectEmptyContext> | null;
    /** Panel body during the first load (`*cngxSelectLoading`). */
    readonly loading?: TemplateRef<CngxSelectLoadingContext> | null;
    /** Trigger content for the selected value (`*cngxSelectTriggerLabel`). */
    readonly triggerLabel?: TemplateRef<CngxSelectTriggerLabelContext> | null;
    /** Rich content inside each option row (`*cngxSelectOptionLabel`). */
    readonly optionLabel?: TemplateRef<CngxSelectOptionLabelContext> | null;
    /** Panel body when the options failed to load (`*cngxSelectError`). */
    readonly error?: TemplateRef<CngxSelectErrorContext> | null;
    /** Retry button of every retry surface (`*cngxSelectRetryButton`). */
    readonly retryButton?: TemplateRef<CngxSelectRetryButtonContext> | null;
    /** Glyph inside the spinner, bar and dots loading and refreshing indicators (`*cngxSelectLoadingGlyph`). Context-free. */
    readonly loadingGlyph?: TemplateRef<void> | null;
    /** Indicator over the visible options during a reload (`*cngxSelectRefreshing`). */
    readonly refreshing?: TemplateRef<CngxSelectRefreshingContext> | null;
    /** Failed-commit surface with its retry (`*cngxSelectCommitError`). */
    readonly commitError?: TemplateRef<CngxSelectCommitErrorContext> | null;
    /** Single-clear and clear-all button (`*cngxSelectClearButton`). */
    readonly clearButton?: TemplateRef<CngxSelectClearButtonContext> | null;
    /** Per-row indicator while that row's commit is in flight (`*cngxSelectOptionPending`). */
    readonly optionPending?: TemplateRef<CngxSelectOptionPendingContext> | null;
    /** Per-row glyph after that row's commit failed (`*cngxSelectOptionError`). */
    readonly optionError?: TemplateRef<CngxSelectOptionErrorContext> | null;
    /** Inline action area (`*cngxSelectAction`). Honoured only by `CngxActionSelect` and `CngxActionMultiSelect`; the flat variants have no action area. */
    readonly action?: TemplateRef<CngxSelectActionContext> | null;
    /** Decorative drag handle of the mobile sheet (`*cngxSelectSheetHandle`). */
    readonly sheetHandle?: TemplateRef<CngxSelectSheetHandleContext> | null;
    /** Selected-of-total count on a `CngxTreeSelect` parent row (`*cngxTreeSelectNodeCount`). */
    readonly treeNodeCount?: TemplateRef<CngxTreeSelectNodeCountContext> | null;
    /** Selected count in the mobile sheet header, for variants that report one (`*cngxSelectSheetCount`). */
    readonly sheetCount?: TemplateRef<CngxSelectSheetCountContext> | null;
    /** Panel footer (count and clear-all) of `CngxTreeSelect` (`*cngxTreeSelectFooter`). */
    readonly treeFooter?: TemplateRef<CngxTreeSelectFooterContext> | null;
  };
}

/**
 * Library defaults merged with `provideSelectConfig` user values. The copy
 * keys are not here: they read the `select` language section at the reading
 * site. @internal
 */
export const CNGX_SELECT_DEFAULTS: Required<
  Omit<CngxSelectConfig, 'panelClass' | 'templates' | 'announcer' | 'ariaLabels' | 'fallbackLabels'>
> & {
  readonly panelClass: string | readonly string[];
  readonly templates: Required<NonNullable<CngxSelectConfig['templates']>>;
  readonly announcer: Required<Omit<CngxSelectAnnouncerConfig, 'format'>>;
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
  chipOverflow: 'wrap' as 'wrap' | 'scroll-x' | 'truncate' | 'fit',
  maxVisibleChips: 3,
  // Flat lists auto-virtualize above the threshold by default (OD5 / H5);
  // `withVirtualization(false)` / `(null)` opts out. Grouped lists bypass
  // the recycler regardless (CNGX2028).
  virtualization: { threshold: 200 } as CngxSelectVirtualizationConfig | null,
  panelClass: '',
  typeaheadDebounceInterval: 300,
  searchDebounceMs: 300,
  typeaheadWhileClosed: true,
  searchMatchFn: null as CngxSelectMatchFn | null,
  showSelectionIndicator: true,
  selectionIndicatorPosition: 'after',
  selectionIndicatorVariant: 'auto',
  showCaret: true,
  restoreFocus: true,
  dismissOn: 'both',
  openOn: 'click',
  mobileSheet: 'auto',
  announcer: {
    enabled: true,
    politeness: 'polite',
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
    sheetHandle: null,
    treeNodeCount: null,
    treeFooter: null,
    sheetCount: null,
  },
};

/**
 * Resolved configuration shared by every select-family composite - panel
 * presentation, loading / refreshing variants, chip overflow, virtualization,
 * keyboard open / dismiss triggers, selection-indicator style, and the ARIA /
 * fallback labels. Composed from the `with*` features (`withPanelWidth`,
 * `withVirtualization`, `withSelectionIndicator`, `withAriaLabels`, ...).
 *
 * Provide it through one of these entry points, never a hand-built literal:
 *
 * - `provideSelectConfig(...)` returns `EnvironmentProviders` - app bootstrap or a route.
 * - `provideSelectConfigAt(...)` returns `Provider[]` - a component's `providers` / `viewProviders`.
 * - `{ provide: CNGX_SELECT_CONFIG, useFactory: () => makeSelectConfig(...) }` -
 *   when the payload only exists at injection time (`TemplateRef`s from a
 *   live view, values read from another service).
 *
 * Resolution is nearest-wins per key: `provideSelectConfig` at the root
 * replaces the whole config, while `provideSelectConfigAt` in a subtree merges
 * over the parent scope key by key - the keys it sets win, every unset key
 * inherits, and the deep bundles (`ariaLabels`, `fallbackLabels`, `announcer`,
 * `templates`) merge per entry. The action-select and reorderable
 * composites layer their own `CNGX_ACTION_SELECT_CONFIG` /
 * `CNGX_REORDERABLE_SELECT_CONFIG` on top of this base.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/config.ts
 * @since 0.1.0
 * @relatedTo provideSelectConfig, provideSelectConfigAt, CngxSelectConfig, CNGX_ACTION_SELECT_CONFIG, CNGX_REORDERABLE_SELECT_CONFIG, CngxSelectLanguageSection
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
 * Sets the chip-strip overflow mode. Default `'wrap'`. `'fit'` keeps one row
 * and folds the chips that do not fit the trigger into the `+N` badge.
 */
export function withChipOverflow(
  mode: NonNullable<CngxSelectConfig['chipOverflow']>,
): CngxSelectConfigFeature {
  return feature({ chipOverflow: mode });
}

/**
 * Sets `maxVisibleChips` for truncate mode. Default `3`. Values below 1
 * resolve to 1, fractions are floored, non-finite values fall back to 3.
 */
export function withMaxVisibleChips(count: number): CngxSelectConfigFeature {
  return feature({ maxVisibleChips: count });
}

/**
 * Tunes or opts out of recycler virtualisation. Flat option lists
 * virtualize above a default `threshold` of 200 with no configuration;
 * this feature overrides that. `{}` / `true` uses the recycler defaults
 * (threshold 0, i.e. always virtualize); a config object tunes
 * `estimateSize` / `overscan` / `threshold`; `false` / `null` opts out to
 * identity render. Custom pipelines provide `CNGX_PANEL_RENDERER_FACTORY`
 * directly.
 *
 * ```ts
 * provideSelectConfig(
 *   withVirtualization({ estimateSize: 36, overscan: 8, threshold: 500 }),
 * )
 * provideSelectConfig(withVirtualization(false)) // opt out
 * ```
 *
 * Does not apply to `CngxSelectShell`: its options are projected, so every row
 * stays in the DOM whatever the config says.
 */
export function withVirtualization(
  config: CngxSelectVirtualizationConfig | boolean | null = true,
): CngxSelectConfigFeature {
  const resolved = config === false || config === null ? null : config === true ? {} : config;
  return feature({ virtualization: resolved });
}

/**
 * Sets the panel-shell visible-fallback labels. Partial. Per-instance
 * template projection wins. Pass a `Signal` to follow a runtime language
 * switch. Bundles merge per key: a later `withFallbackLabels`, or one under
 * `provideSelectConfigAt`, overrides only the keys it sets and every other key
 * keeps the earlier or inherited value.
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
export function withFallbackLabels(
  labels: CngxSelectFallbackLabels | Signal<CngxSelectFallbackLabels>,
): CngxSelectConfigFeature {
  return feature({ fallbackLabels: labels });
}

/**
 * Class list applied to every select panel.
 */
export function withPanelClass(panelClass: string | readonly string[]): CngxSelectConfigFeature {
  return feature({ panelClass });
}

/**
 * Sets `typeaheadDebounceInterval` in ms: the closed-trigger typeahead buffer
 * window of the button-trigger variants. Default `300`. The search debounce of
 * the input variants is `withSearchDebounce`.
 */
export function withTypeaheadDebounce(ms: number): CngxSelectConfigFeature {
  return feature({ typeaheadDebounceInterval: ms });
}

/**
 * Sets `searchDebounceMs`: the wait in ms between the last keystroke and the
 * `searchTerm` / `searchTermChange` update of combobox, typeahead,
 * action-select, action-multi-select and the shell's `<cngx-select-search>`.
 * A per-instance `[searchDebounceMs]` wins; `0` writes on every keystroke.
 * Default `300`.
 *
 * ```ts
 * provideSelectConfig(withSearchDebounce(150));
 * ```
 */
export function withSearchDebounce(ms: number): CngxSelectConfigFeature {
  return feature({ searchDebounceMs: ms });
}

/**
 * Typeahead-while-closed (native `<select>` parity). Default `true`.
 */
export function withTypeaheadWhileClosed(enabled: boolean): CngxSelectConfigFeature {
  return feature({ typeaheadWhileClosed: enabled });
}

/**
 * App-wide matcher for the inline search of the searchable variants. A
 * per-instance `[searchMatchFn]` wins; without either, the variants keep the
 * folded label match in the reading locale. Under `provideSelectConfigAt` it
 * applies to that subtree only.
 *
 * ```ts
 * provideSelectConfig(
 *   withSearchMatchFn((option, term) => option.label.startsWith(term)),
 * );
 * ```
 */
export function withSearchMatchFn(fn: CngxSelectMatchFn | null): CngxSelectConfigFeature {
  return feature({ searchMatchFn: fn });
}

/**
 * Whether the selected-option checkmark is rendered at all. Default `true`.
 * `CngxTreeSelect` ignores it and always renders its node checkbox.
 */
export function withSelectionIndicator(enabled: boolean): CngxSelectConfigFeature {
  return feature({ showSelectionIndicator: enabled });
}

/**
 * Sets the selection-indicator position: `'after'` (default) at the row end,
 * `'before'` ahead of the label.
 */
export function withSelectionIndicatorPosition(
  position: CngxSelectSelectionIndicatorPosition,
): CngxSelectConfigFeature {
  return feature({ selectionIndicatorPosition: position });
}

/**
 * Sets the selection-indicator glyph. Default `'auto'`. `CngxTreeSelect`
 * ignores it and always renders its node checkbox.
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
 * Whether the trigger is re-focused after the anchored popover closes.
 * Default `true`. The modal mobile sheet ignores it: closing a modal dialog
 * always returns focus to its opener.
 */
export function withRestoreFocus(enabled: boolean): CngxSelectConfigFeature {
  return feature({ restoreFocus: enabled });
}

/**
 * Dismiss strategy for the panel. Default `'both'`. Controls the pointer and
 * Escape vectors; focus leaving the host (Tab navigation out of the control)
 * closes the panel in every mode, `'escape'` included - a Tab-navigation
 * close is not an outside dismissal, so no `dismissOn` value suppresses it.
 */
export function withDismissOn(mode: CngxSelectConfig['dismissOn']): CngxSelectConfigFeature {
  return feature({ dismissOn: mode });
}

/**
 * Mobile presentation of every select-family panel. `'auto'` (default) opens
 * it as a modal bottom sheet or fullscreen panel on coarse, narrow viewports
 * and anchored everywhere else; `'off'` keeps it anchored. A per-instance
 * `[presentation]` wins.
 *
 * @since 0.1.0
 * @relatedTo CngxPopoverSheet
 * <example-url>/#/forms/select/mobile-sheet/opt-out</example-url>
 * <example-url>/#/forms/select/mobile-sheet/all-variants</example-url>
 */
export function withMobileSheet(mode: CngxSelectConfig['mobileSheet']): CngxSelectConfigFeature {
  return feature({ mobileSheet: mode });
}

/**
 * Open strategy for the trigger, honoured by all nine composites; the input
 * variants open on focus of their text input. Default `'click'`.
 */
export function withOpenOn(mode: CngxSelectConfig['openOn']): CngxSelectConfigFeature {
  return feature({ openOn: mode });
}

/**
 * Configure the live-region announcer used for selection changes. Pass a
 * `Signal` to swap the formatter on a runtime language switch.
 */
export function withAnnouncer(
  config: CngxSelectAnnouncerConfig | Signal<CngxSelectAnnouncerConfig>,
): CngxSelectConfigFeature {
  return feature({ announcer: config });
}

/**
 * Sets ARIA-label overrides. Partial. Per-instance inputs win. Pass a
 * `Signal` to follow a runtime language switch.
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
export function withAriaLabels(
  labels: CngxSelectAriaLabels | Signal<CngxSelectAriaLabels>,
): CngxSelectConfigFeature {
  return feature({ ariaLabels: labels });
}

/**
 * Sets default slot templates applied when no per-instance slot is
 * projected. Partial - unset slots keep the library default. Multiple
 * `withTemplates` calls in the same provider merge per slot in
 * feature-list order.
 *
 * Resolution per slot: projected `*cngxSelect...` template -> the
 * nearest provided config's `templates.<slot>` -> built-in default.
 * Like every `CNGX_SELECT_CONFIG` key, an `At`-scope config merges
 * over the parent scope: the slots it sets win and every slot it
 * leaves unset inherits the root template.
 *
 * `TemplateRef`s need a live view, so they cannot sit in a static
 * provider array evaluated at bootstrap. Declare the templates in a
 * holder component rendered before the selects (an app shell above
 * routed content) and build the config lazily via `makeSelectConfig`
 * in a `useFactory`:
 *
 * ```ts
 * @Component({
 *   selector: 'app-select-defaults',
 *   template: `<ng-template #empty let-term>No hits for "{{ term }}"</ng-template>`,
 * })
 * export class SelectDefaults {
 *   readonly empty = viewChild.required<TemplateRef<CngxSelectEmptyContext>>('empty');
 * }
 *
 * // Route- or component-level provider below the rendered holder:
 * {
 *   provide: CNGX_SELECT_CONFIG,
 *   useFactory: (holder: SelectDefaults) =>
 *     makeSelectConfig(withTemplates({ empty: holder.empty() })),
 *   deps: [SelectDefaults],
 * }
 * ```
 */
export function withTemplates(
  templates: NonNullable<CngxSelectConfig['templates']>,
): CngxSelectConfigFeature {
  return feature({ templates });
}

const NO_ANNOUNCER: CngxSelectAnnouncerConfig = {};
const NO_ARIA_LABELS: CngxSelectAriaLabels = {};
const NO_FALLBACK_LABELS: CngxSelectFallbackLabels = {};

/**
 * Pure merge of `with*` features into a `CngxSelectConfig` value - the
 * exact merge `provideSelectConfig` / `provideSelectConfigAt` apply.
 * Reach for it when the config must be built lazily in a `useFactory`,
 * e.g. to carry `TemplateRef` payloads that only exist once a holder
 * view is live (see `withTemplates`). For static values, prefer the
 * two provide functions.
 *
 * The deep keys (`ariaLabels`, `fallbackLabels`, `announcer`, `templates`)
 * merge per entry across features; every other key is replaced by the last
 * feature that sets it.
 */
export function makeSelectConfig(...features: CngxSelectConfigFeature[]): CngxSelectConfig {
  const merged: {
    -readonly [K in keyof CngxSelectConfig]?: CngxSelectConfig[K];
  } = {};
  for (const f of features) {
    // Pull deep-merged keys aside before the flat assign so partial
    // overrides across features don't wipe earlier keys.
    const { announcer, templates, ariaLabels, fallbackLabels, ...flat } = f.config;
    Object.assign(merged, flat);
    if (announcer) {
      merged.announcer = createOverrideMerge(merged.announcer ?? NO_ANNOUNCER, announcer);
    }
    if (templates) {
      merged.templates = { ...merged.templates, ...templates };
    }
    if (ariaLabels) {
      merged.ariaLabels = createOverrideMerge(merged.ariaLabels ?? NO_ARIA_LABELS, ariaLabels);
    }
    if (fallbackLabels) {
      merged.fallbackLabels = createOverrideMerge(
        merged.fallbackLabels ?? NO_FALLBACK_LABELS,
        fallbackLabels,
      );
    }
  }
  return merged;
}

/**
 * App-wide defaults for the Select family. `provideSelectConfigAt` and
 * per-instance inputs win.
 */
export function provideSelectConfig(...features: CngxSelectConfigFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_SELECT_CONFIG, useValue: makeSelectConfig(...features) },
  ]);
}

/**
 * Component-scoped config. Returns `Provider[]` because `viewProviders`
 * rejects `EnvironmentProviders`. Merges over the config of the parent
 * injector: the keys set here win, every unset key inherits, and the deep
 * keys (`ariaLabels`, `fallbackLabels`, `announcer`, `templates`) merge per
 * entry, so an app-wide translation survives a component-scope
 * `withPanelWidth` or a subtree `withFallbackLabels({ empty })`.
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideSelectConfigAt(withPanelWidth(300))],
 * })
 * ```
 */
export function provideSelectConfigAt(...features: CngxSelectConfigFeature[]): Provider[] {
  return [
    {
      provide: CNGX_SELECT_CONFIG,
      useFactory: (): CngxSelectConfig => {
        const parent = inject(CNGX_SELECT_CONFIG, { skipSelf: true, optional: true });
        const inherited = parent ? [feature(parent)] : [];
        return makeSelectConfig(...inherited, ...features);
      },
    },
  ];
}
