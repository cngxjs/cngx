import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createDefaultsFill, createOverrideMerge } from '@cngx/core/utils';

import type {
  CngxPaginatorAnnouncements,
  CngxPaginatorAriaLabels,
  CngxPaginatorFormats,
} from '../paginator-config';
import {
  CNGX_PAGINATOR_LANGUAGE_EN,
  type CngxPaginatorLanguageSection,
} from './paginator-language-section';

/**
 * The paginator copy of one section and locale, split into the three config
 * sub-trees.
 *
 * @internal
 */
export interface CngxPaginatorCopy {
  readonly ariaLabels: CngxPaginatorAriaLabels;
  readonly announcements: CngxPaginatorAnnouncements;
  readonly formats: Required<CngxPaginatorFormats>;
}

/** @internal Turns a paginator section into the config copy for a locale. Pure. */
export function paginatorCopyFrom(
  section: CngxPaginatorLanguageSection,
  locale: string,
): CngxPaginatorCopy {
  return {
    ariaLabels: {
      label: section.label,
      first: section.first,
      previous: section.previous,
      next: section.next,
      last: section.last,
      page: (page) => formatMessage(section.page, { page }, locale),
      morePages: section.morePages,
      itemsPerPage: section.itemsPerPage,
      goToPage: section.goToPage,
      pageOfPages: section.pageOfPages,
      loadMore: section.loadMore,
      allLoaded: (total) => formatMessage(section.allLoaded, { total }, locale),
      bucket: (label) => formatMessage(section.bucket, { label }, locale),
      emptyBucket: (label) => formatMessage(section.emptyBucket, { label }, locale),
      bucketGroup: section.bucketGroup,
      railPosition: section.railPosition,
    },
    announcements: {
      pageChange: (page, totalPages) =>
        formatMessage(section.pageChange, { page, totalPages }, locale),
      loading: section.loading,
      updated: section.updated,
    },
    formats: {
      range: (start, end, total) => formatMessage(section.range, { start, end, total }, locale),
      pageStatus: (page, totalPages) =>
        formatMessage(section.pageStatus, { page, totalPages }, locale),
      pageOfPagesReadout: (page, totalPages) =>
        formatMessage(section.pageOfPagesReadout, { page, totalPages }, locale),
      loadMoreReadout: (shown, total) =>
        formatMessage(section.loadMoreReadout, { shown, total }, locale),
    },
  };
}

const NO_SECTION: Partial<CngxPaginatorLanguageSection> = {};

/** @internal The paginator section of the active pack over the English section. */
function injectPaginatorLanguage(): Signal<CngxPaginatorLanguageSection> {
  const pack = injectLanguageSection('paginator');
  return createOverrideMerge(
    CNGX_PAGINATOR_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/** @internal Builds and reads the section copy, formatted for the reading locale. */
const paginatorBundle = createSectionBundle<CngxPaginatorLanguageSection, CngxPaginatorCopy>({
  section: injectPaginatorLanguage,
  toBundle: paginatorCopyFrom,
});

/**
 * @internal The paginator copy of the active pack, formatted for the app
 * locale. Private: consumers override copy through the `withPaginator*`
 * features.
 */
const PAGINATOR_SECTION_COPY = new InjectionToken<Signal<CngxPaginatorCopy>>(
  'CngxPaginatorSectionCopy',
  { providedIn: 'root', factory: () => paginatorBundle.build() },
);

interface SiteDefaults {
  readonly ariaLabels: Signal<CngxPaginatorAriaLabels>;
  readonly announcements: Signal<CngxPaginatorAnnouncements>;
  readonly formats: Signal<Required<CngxPaginatorFormats>>;
}

const SITES = new WeakMap<Signal<CngxPaginatorCopy>, SiteDefaults>();

/** The sub-trees of one site copy signal, each its own signal. Memoized per copy signal. */
function siteDefaults(copy: Signal<CngxPaginatorCopy>): SiteDefaults {
  let site = SITES.get(copy);
  if (!site) {
    site = {
      ariaLabels: computed(() => copy().ariaLabels),
      announcements: computed(() => copy().announcements),
      formats: computed(() => copy().formats),
    };
    SITES.set(copy, site);
  }
  return site;
}

/**
 * @internal The paginator copy at the reading site: the active pack's section
 * formatted for the locale of the injector that reads it. Injection context
 * required.
 */
export function injectPaginatorSiteCopy(): SiteDefaults {
  return siteDefaults(paginatorBundle.resolve(inject(PAGINATOR_SECTION_COPY)));
}

/**
 * @internal A config sub-tree over its site default; a key the config leaves
 * unset, `null` or `undefined` reads the default.
 */
export function fillOver<T extends object>(
  defaults: Signal<T>,
  source: Partial<T> | Signal<Partial<T>> | undefined,
): Signal<T> {
  return createDefaultsFill(createOverrideMerge<T>(defaults, source), defaults);
}
