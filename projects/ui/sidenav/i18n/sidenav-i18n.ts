import { inject, InjectionToken, type Signal } from '@angular/core';

import { createLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';
import { createFilledOverrideMerge } from '@cngx/core/utils';

import { injectSidenavConfig } from '../config/inject-sidenav-config';
import type { CngxSidenavLabels } from '../config/sidenav.config';
import {
  CNGX_SIDENAV_LANGUAGE_EN,
  type CngxSidenavLanguageSection,
} from './sidenav-language-section';

/** @internal Turns a sidenav section into the config labels for a locale. Pure. */
export function sidenavLabelsFrom(
  section: CngxSidenavLanguageSection,
  locale: string,
): CngxSidenavLabels {
  return {
    resizeHandle: section.resizeHandle,
    resizeValueText: (percent, value) =>
      formatMessage(section.resizeValueText, { percent, value }, locale),
  };
}

/** @internal The sidenav section of the active pack over the English section. */
const injectSidenavLanguage = createLanguageSection('sidenav', CNGX_SIDENAV_LANGUAGE_EN);

/** @internal Builds and reads the section labels, formatted for the reading locale. */
const sidenavBundle = createSectionBundle<CngxSidenavLanguageSection, CngxSidenavLabels>({
  section: injectSidenavLanguage,
  toBundle: sidenavLabelsFrom,
});

/**
 * @internal The sidenav labels of the active pack, formatted for the app
 * locale. Private: consumers override copy through `withSidenavLabels`.
 */
const SIDENAV_SECTION_LABELS = new InjectionToken<Signal<CngxSidenavLabels>>(
  'CngxSidenavSectionLabels',
  { providedIn: 'root', factory: () => sidenavBundle.build() },
);

/**
 * @internal The sidenav labels at the reading site: the active pack's section
 * formatted for the locale of the injector that reads it, with the
 * `CNGX_SIDENAV_CONFIG` labels on top. A key the config sets wins; a key it
 * leaves unset, `null` or `undefined` reads the section. Injection context
 * required.
 */
export function injectSidenavLabels(): Signal<CngxSidenavLabels> {
  return createFilledOverrideMerge(
    sidenavBundle.resolve(inject(SIDENAV_SECTION_LABELS)),
    injectSidenavConfig().labels,
  );
}
