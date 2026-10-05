import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The select section of a {@link CngxLanguagePack}: the copy of every
 * `@cngx/forms/select` component. It feeds the copy keys of
 * `CNGX_SELECT_CONFIG` (`ariaLabels`, `fallbackLabels`, the `announcer`
 * format), the `ariaLabel` of `CNGX_ACTION_SELECT_CONFIG` and of
 * `CNGX_REORDERABLE_SELECT_CONFIG`, and the per-variant clear and chip-remove
 * defaults. Messages use `{name}` placeholders; a plural message picks its
 * form from `{count}`.
 *
 * @category forms/select/i18n
 * @since 0.1.0
 * @relatedTo CNGX_SELECT_CONFIG, CNGX_ACTION_SELECT_CONFIG, CNGX_REORDERABLE_SELECT_CONFIG
 */
export interface CngxSelectLanguageSection {
  /** Clear button of the single-value selects (`CngxSelect`, `CngxSelectShell`). */
  readonly clearSelection: string;
  /** Clear button of the multi-value and input selects. */
  readonly resetSelection: string;
  /** The remove action of a selected chip. */
  readonly chipRemove: string;
  /** `{action}`, `{label}`: the accessible name of a chip's remove button. */
  readonly chipRemoveFor: CngxMessage;
  /** `{count}`: the visible badge for the chips hidden by `chipOverflow: 'truncate'`. */
  readonly chipOverflowBadge: CngxMessage;
  /** Tree-select twisty of a collapsed node. */
  readonly treeExpand: string;
  /** Tree-select twisty of an expanded node. */
  readonly treeCollapse: string;
  /** Status region while the options load. */
  readonly statusLoading: string;
  /** Overlay while loaded options refresh. */
  readonly statusRefreshing: string;
  /** The field name announced when the control has no label. */
  readonly fieldLabelFallback: string;
  /** `{label}`: announced when a `[commitAction]` rejects without an error message. */
  readonly commitFailedAnnouncement: CngxMessage;
  /** `{label}`, `{detail}`: announced when a `[commitAction]` rejects with an `Error`. */
  readonly commitFailedAnnouncementDetail: CngxMessage;
  /** Accessible name of the `<cngx-select-search>` input. */
  readonly searchInput: string;
  /** Accessible name of a panel listbox whose control has no label to borrow. */
  readonly listboxFallback: string;
  /** Body of `loadingVariant: 'text'`. */
  readonly loading: string;
  /** The empty panel. */
  readonly empty: string;
  /** First-load error. */
  readonly loadFailed: string;
  /** Retry button of the first-load error. */
  readonly loadFailedRetry: string;
  /** Inline refresh error. */
  readonly refreshFailed: string;
  /** Retry button of the inline refresh error. */
  readonly refreshFailedRetry: string;
  /** Visible placeholder of `<cngx-select-search>`. */
  readonly searchPlaceholder: string;
  /** Commit-error banner. */
  readonly commitFailed: string;
  /** Retry button of the commit-error banner. */
  readonly commitFailedRetry: string;
  /** `{field}`, `{option}`: announced when a single select picks an option. */
  readonly announceSelected: CngxMessage;
  /** `{field}`: announced when the selection is cleared. */
  readonly announceCleared: CngxMessage;
  /** `{field}`, `{option}`: announced when an inline quick-create adds and selects an option. */
  readonly announceCreated: CngxMessage;
  /** `{field}`: announced when an inline quick-create has no option label. */
  readonly announceCreatedNoOption: CngxMessage;
  /** `{field}`, `{option}`: announced when a multi select adds an option. */
  readonly announceAdded: CngxMessage;
  /** `{field}`, `{option}`, `{count}`: an added option and the number now selected. */
  readonly announceAddedCount: CngxMessage;
  /** `{field}`, `{option}`: announced when a multi select removes an option. */
  readonly announceRemoved: CngxMessage;
  /** `{field}`, `{option}`, `{count}`: a removed option and the number still selected. */
  readonly announceRemovedCount: CngxMessage;
  /** `{field}`, `{option}`: announced when a chip moves. */
  readonly announceMoved: CngxMessage;
  /** `{field}`, `{option}`, `{position}`: announced when a chip moves to a 1-based position. */
  readonly announceMovedTo: CngxMessage;
  /** `{field}`: announced when a chip moves and has no label. */
  readonly announceMovedNoOption: CngxMessage;
  /** Accessible name of the `*cngxSelectAction` group in a select panel. */
  readonly actionGroup: string;
  /** Keyboard hint of the reorderable chip strip. */
  readonly reorderHint: string;
}

/**
 * The English select section: the single source of the select family's
 * English copy. The `CNGX_SELECT_CONFIG`, `CNGX_ACTION_SELECT_CONFIG` and
 * `CNGX_REORDERABLE_SELECT_CONFIG` copy keys default to it.
 *
 * @category forms/select/i18n
 * @since 0.1.0
 * @relatedTo CNGX_SELECT_CONFIG
 */
export const CNGX_SELECT_LANGUAGE_EN: CngxSelectLanguageSection = {
  clearSelection: 'Clear selection',
  resetSelection: 'Reset selection',
  chipRemove: 'Remove',
  chipRemoveFor: '{action}: {label}',
  chipOverflowBadge: '+{count}',
  treeExpand: 'Expand node',
  treeCollapse: 'Collapse node',
  statusLoading: 'Loading options',
  statusRefreshing: 'Refreshing options',
  fieldLabelFallback: 'Selection',
  commitFailedAnnouncement: '{label}: Save failed',
  commitFailedAnnouncementDetail: '{label}: Save failed - {detail}',
  searchInput: 'Search options',
  listboxFallback: 'Options',
  loading: 'Loading…',
  empty: 'No Options',
  loadFailed: 'Loading failed',
  loadFailedRetry: 'Retry',
  refreshFailed: 'Refresh failed',
  refreshFailedRetry: 'Try again',
  searchPlaceholder: 'Search…',
  commitFailed: 'Save failed',
  commitFailedRetry: 'Try again',
  announceSelected: '{field}: {option} selected',
  announceCleared: '{field}: selection cleared',
  announceCreated: '{field}: {option} created and selected',
  announceCreatedNoOption: '{field}: created',
  announceAdded: '{field}: {option} added',
  announceAddedCount: '{field}: {option} added, {count} selected',
  announceRemoved: '{field}: {option} removed',
  announceRemovedCount: '{field}: {option} removed, {count} selected',
  announceMoved: '{field}: {option} moved',
  announceMovedTo: '{field}: {option} moved to position {position}',
  announceMovedNoOption: '{field}: moved',
  actionGroup: 'Inline action',
  reorderHint: 'Reorder with Alt + arrow keys',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly select: CngxSelectLanguageSection;
  }
}
