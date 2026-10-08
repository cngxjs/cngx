import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';

import type {
  CngxSelectAnnouncerConfig,
  CngxSelectAriaLabels,
  CngxSelectFallbackLabels,
} from '../shared/config';
import { CNGX_SELECT_LANGUAGE_EN, type CngxSelectLanguageSection } from './select-language-section';

/**
 * ARIA labels with every library-defaulted key filled. `clearButton` stays
 * optional: its default differs per variant ({@link CngxSelectCopy}).
 *
 * @internal
 */
export type CngxResolvedSelectAriaLabels = CngxSelectAriaLabels &
  Required<Omit<CngxSelectAriaLabels, 'clearButton'>>;

/** The announcer formatter of {@link CngxSelectAnnouncerConfig}. @internal */
export type CngxSelectAnnounceFormat = NonNullable<CngxSelectAnnouncerConfig['format']>;

/**
 * The select section mapped onto the `CNGX_SELECT_CONFIG` copy keys for one
 * locale, plus the per-variant clear-button defaults.
 *
 * @internal
 */
export interface CngxSelectCopy {
  readonly ariaLabels: CngxResolvedSelectAriaLabels;
  readonly fallbackLabels: Required<CngxSelectFallbackLabels>;
  readonly announceFormat: CngxSelectAnnounceFormat;
  /** Clear-button default of the single-value selects. */
  readonly clearSelection: string;
  /** Clear-button default of the multi-value and input selects. */
  readonly resetSelection: string;
  /** Default accessible name of the action-select action group. */
  readonly actionGroup: string;
  /** Default accessible name of the reorderable-select reorder hint. */
  readonly reorderHint: string;
}

/** @internal Builds the default announcer formatter from the section's messages. */
function announceFormatFrom(
  section: CngxSelectLanguageSection,
  locale: string,
): CngxSelectAnnounceFormat {
  return ({ selectedLabel, fieldLabel, multi, action, count, toIndex }) => {
    const field = fieldLabel;
    // `'created'` reads identically in single + multi.
    if (action === 'created') {
      if (selectedLabel == null) {
        return formatMessage(section.announceCreatedNoOption, { field }, locale);
      }
      return formatMessage(section.announceCreated, { field, option: selectedLabel }, locale);
    }
    if (!multi) {
      if (selectedLabel == null) {
        return formatMessage(section.announceCleared, { field }, locale);
      }
      return formatMessage(section.announceSelected, { field, option: selectedLabel }, locale);
    }
    if (action === 'reordered') {
      if (selectedLabel == null) {
        return formatMessage(section.announceMovedNoOption, { field }, locale);
      }
      if (typeof toIndex === 'number') {
        return formatMessage(
          section.announceMovedTo,
          { field, option: selectedLabel, position: toIndex + 1 },
          locale,
        );
      }
      return formatMessage(section.announceMoved, { field, option: selectedLabel }, locale);
    }
    if (selectedLabel == null) {
      return formatMessage(section.announceCleared, { field }, locale);
    }
    const removed = action === 'removed';
    if (typeof count === 'number') {
      const message = removed ? section.announceRemovedCount : section.announceAddedCount;
      return formatMessage(message, { field, option: selectedLabel, count }, locale);
    }
    const message = removed ? section.announceRemoved : section.announceAdded;
    return formatMessage(message, { field, option: selectedLabel }, locale);
  };
}

/** @internal Turns a select section into the config copy keys for a locale. Pure. */
export function selectCopyFrom(section: CngxSelectLanguageSection, locale: string): CngxSelectCopy {
  return {
    ariaLabels: {
      chipRemove: section.chipRemove,
      chipRemoveFor: (action, label) =>
        formatMessage(section.chipRemoveFor, { action, label }, locale),
      treeExpand: section.treeExpand,
      treeCollapse: section.treeCollapse,
      statusLoading: section.statusLoading,
      statusRefreshing: section.statusRefreshing,
      fieldLabelFallback: section.fieldLabelFallback,
      commitFailedMessage: (label, detail) =>
        detail
          ? formatMessage(section.commitFailedAnnouncementDetail, { label, detail }, locale)
          : formatMessage(section.commitFailedAnnouncement, { label }, locale),
      searchInput: section.searchInput,
      listboxFallback: section.listboxFallback,
    },
    fallbackLabels: {
      loading: section.loading,
      empty: section.empty,
      loadFailed: section.loadFailed,
      loadFailedRetry: section.loadFailedRetry,
      refreshFailed: section.refreshFailed,
      refreshFailedRetry: section.refreshFailedRetry,
      searchPlaceholder: section.searchPlaceholder,
      commitFailed: section.commitFailed,
      commitFailedRetry: section.commitFailedRetry,
      chipOverflowBadge: (count) => formatMessage(section.chipOverflowBadge, { count }, locale),
    },
    announceFormat: announceFormatFrom(section, locale),
    clearSelection: section.clearSelection,
    resetSelection: section.resetSelection,
    actionGroup: section.actionGroup,
    reorderHint: section.reorderHint,
  };
}

/** @internal The select section of the active pack over the English section. */
const injectSelectLanguage = createLanguageSection('select', CNGX_SELECT_LANGUAGE_EN);

/** @internal Builds and reads the select copy, formatted for the reading locale. */
const selectBundle = createSectionBundle<CngxSelectLanguageSection, CngxSelectCopy>({
  section: injectSelectLanguage,
  toBundle: selectCopyFrom,
});

/**
 * @internal The select copy of the active pack, formatted for the app locale.
 * Private: consumers override copy through `provideSelectConfig`.
 */
const SELECT_SECTION_COPY = new InjectionToken<Signal<CngxSelectCopy>>('CngxSelectSectionCopy', {
  providedIn: 'root',
  factory: () => selectBundle.build(),
});

/**
 * @internal The select copy at the reading site: the active pack's select
 * section formatted for the locale of the injector that reads it, so a
 * `provideLocaleAt` subtree formats its own numbers. Every select under one
 * injector shares one signal. Injection context required.
 */
export function injectSelectCopy(): Signal<CngxSelectCopy> {
  return selectBundle.resolve(inject(SELECT_SECTION_COPY));
}

/** Keys of the select copy that hold a plain word read on its own. */
type CngxSelectWordKey = 'actionGroup' | 'reorderHint';

const WORDS = new WeakMap<Signal<CngxSelectCopy>, Map<CngxSelectWordKey, Signal<string>>>();

/**
 * @internal One plain word of the select copy at the reading site, as a
 * signal shared by every reader under the injector. Injection context
 * required.
 */
export function injectSelectWord(key: CngxSelectWordKey): Signal<string> {
  const copy = injectSelectCopy();
  let byKey = WORDS.get(copy);
  if (!byKey) {
    byKey = new Map();
    WORDS.set(copy, byKey);
  }
  let word = byKey.get(key);
  if (!word) {
    word = computed(() => copy()[key]);
    byKey.set(key, word);
  }
  return word;
}
