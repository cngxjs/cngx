import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge, injectLocale } from '@cngx/core/utils';

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
  };
}

const COPIES = new WeakMap<CngxSelectLanguageSection, Map<string, CngxSelectCopy>>();

/**
 * @internal The copy of one section object and locale, built once: equal
 * inputs give the identical object, so readers compare by reference.
 */
function copyOf(section: CngxSelectLanguageSection, locale: string): CngxSelectCopy {
  let byLocale = COPIES.get(section);
  if (!byLocale) {
    byLocale = new Map();
    COPIES.set(section, byLocale);
  }
  let copy = byLocale.get(locale);
  if (!copy) {
    copy = selectCopyFrom(section, locale);
    byLocale.set(locale, copy);
  }
  return copy;
}

const NO_SECTION: Partial<CngxSelectLanguageSection> = {};

/**
 * @internal The select section of the active language pack over the English
 * section, resolved once per injector so every select reads the same signal.
 */
const SELECT_LANGUAGE = new InjectionToken<Signal<CngxSelectLanguageSection>>(
  'CngxSelectLanguage',
  {
    providedIn: 'root',
    factory: () => {
      const pack = injectLanguageSection('select');
      return createOverrideMerge<CngxSelectLanguageSection>(
        CNGX_SELECT_LANGUAGE_EN,
        computed(() => pack() ?? NO_SECTION),
      );
    },
  },
);

/**
 * @internal The select section of the active language pack over English.
 * Injection context required.
 */
export function injectSelectLanguage(): Signal<CngxSelectLanguageSection> {
  return inject(SELECT_LANGUAGE);
}

const COPY_SIGNALS = new WeakMap<
  Signal<CngxSelectLanguageSection>,
  WeakMap<Signal<string>, Signal<CngxSelectCopy>>
>();

/**
 * @internal The select copy at the reading site: the active pack's select
 * section formatted for the locale of the injector that reads it, so a
 * `provideLocaleAt` subtree formats its own numbers. Memoized per section and
 * locale signal: every select under one injector shares one signal.
 * Injection context required.
 */
export function injectSelectCopy(): Signal<CngxSelectCopy> {
  const language = injectSelectLanguage();
  const locale = injectLocale();
  let byLocale = COPY_SIGNALS.get(language);
  if (!byLocale) {
    byLocale = new WeakMap();
    COPY_SIGNALS.set(language, byLocale);
  }
  let copy = byLocale.get(locale);
  if (!copy) {
    copy = computed(() => copyOf(language(), locale()));
    byLocale.set(locale, copy);
  }
  return copy;
}

/** Keys of the select section that hold a plain word. */
type CngxSelectWordKey = {
  [K in keyof CngxSelectLanguageSection]: CngxSelectLanguageSection[K] extends string ? K : never;
}[keyof CngxSelectLanguageSection];

const WORDS = new WeakMap<
  Signal<CngxSelectLanguageSection>,
  Map<CngxSelectWordKey, Signal<string>>
>();

/**
 * @internal One plain word of the active pack's select section, as a signal
 * shared by every reader under the injector. Injection context required.
 */
export function injectSelectWord(key: CngxSelectWordKey): Signal<string> {
  const language = injectSelectLanguage();
  let byKey = WORDS.get(language);
  if (!byKey) {
    byKey = new Map();
    WORDS.set(language, byKey);
  }
  let word = byKey.get(key);
  if (!word) {
    word = computed(() => language()[key]);
    byKey.set(key, word);
  }
  return word;
}
