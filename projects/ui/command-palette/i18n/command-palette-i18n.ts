import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import type { CngxCommandPaletteLegendEntry } from '../config/command-palette-config';
import {
  CNGX_COMMAND_PALETTE_LANGUAGE_EN,
  type CngxCommandPaletteLanguageSection,
} from './command-palette-language-section';

/**
 * The command-palette copy of one section and locale, in the shape of the
 * config copy keys.
 *
 * @internal
 */
export interface CngxCommandPaletteSiteCopy {
  readonly searchPlaceholder: string;
  readonly listboxLabel: string;
  readonly emptyLabel: string;
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly retryLabel: string;
  readonly paletteLabel: string;
  readonly resultCount: (count: number) => string;
  readonly footerLegend: readonly CngxCommandPaletteLegendEntry[];
  readonly legendEntry: (keys: string, label: string) => string;
}

/** @internal Turns a command-palette section into the config copy for a locale. Pure. */
export function commandPaletteCopyFrom(
  section: CngxCommandPaletteLanguageSection,
  locale: string,
): CngxCommandPaletteSiteCopy {
  return {
    searchPlaceholder: section.searchPlaceholder,
    listboxLabel: section.listboxLabel,
    emptyLabel: section.emptyLabel,
    loadingLabel: section.loadingLabel,
    errorLabel: section.errorLabel,
    retryLabel: section.retryLabel,
    paletteLabel: section.paletteLabel,
    resultCount: (count) => formatMessage(section.resultCount, { count }, locale),
    footerLegend: [
      { keys: section.navigateKeys, label: section.navigateLabel },
      { keys: section.runKeys, label: section.runLabel },
      { keys: section.closeKeys, label: section.closeLabel },
    ],
    legendEntry: (keys, label) => formatMessage(section.legendEntry, { keys, label }, locale),
  };
}

const NO_SECTION: Partial<CngxCommandPaletteLanguageSection> = {};

/** @internal The command-palette section of the active pack over the English section. */
function injectCommandPaletteLanguage(): Signal<CngxCommandPaletteLanguageSection> {
  const pack = injectLanguageSection('commandPalette');
  return createOverrideMerge(
    CNGX_COMMAND_PALETTE_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/** @internal Builds and reads the section copy, formatted for the reading locale. */
const commandPaletteBundle = createSectionBundle<
  CngxCommandPaletteLanguageSection,
  CngxCommandPaletteSiteCopy
>({
  section: injectCommandPaletteLanguage,
  toBundle: commandPaletteCopyFrom,
});

/**
 * @internal The command-palette copy of the active pack, formatted for the app
 * locale. Private: consumers override copy through the config features.
 */
const COMMAND_PALETTE_SECTION_COPY = new InjectionToken<Signal<CngxCommandPaletteSiteCopy>>(
  'CngxCommandPaletteSectionCopy',
  { providedIn: 'root', factory: () => commandPaletteBundle.build() },
);

/**
 * @internal The command-palette copy at the reading site: the active pack's
 * section formatted for the locale of the injector that reads it. Injection
 * context required.
 */
export function injectCommandPaletteSiteCopy(): Signal<CngxCommandPaletteSiteCopy> {
  return commandPaletteBundle.resolve(inject(COMMAND_PALETTE_SECTION_COPY));
}
