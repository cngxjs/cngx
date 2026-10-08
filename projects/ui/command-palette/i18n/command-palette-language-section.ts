import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The command-palette section of a {@link CngxLanguagePack}: the copy of
 * `CngxCommandPalette` and its panel. It feeds the copy keys of
 * `CNGX_COMMAND_PALETTE_CONFIG`; a key set through `withCommandPaletteLabels`,
 * `withResultCountFormatter` or `withKeyboardLegend` still wins. Messages use
 * `{name}` placeholders, numbers are formatted for the locale.
 *
 * @category ui/command-palette/i18n
 * @since 0.1.0
 * @relatedTo CNGX_COMMAND_PALETTE_CONFIG, withCommandPaletteLabels
 */
export interface CngxCommandPaletteLanguageSection {
  /** Placeholder and accessible name of the search input. */
  readonly searchPlaceholder: string;
  /** Accessible name of the result listbox. */
  readonly listboxLabel: string;
  /** Shown when no command matches. */
  readonly emptyLabel: string;
  /** Shown while the commands load. */
  readonly loadingLabel: string;
  /** Shown when the commands failed to load. */
  readonly errorLabel: string;
  /** Label of the retry button after a failed load. */
  readonly retryLabel: string;
  /** Accessible name of the palette dialog. */
  readonly paletteLabel: string;
  /** `{count}`: the announced number of matching commands. */
  readonly resultCount: CngxMessage;
  /** Keys of the footer legend's navigate entry, as shown. Never spoken. */
  readonly navigateKeys: string;
  /** The navigate entry's keys in words, as screen readers hear them. */
  readonly navigateKeysSpoken: string;
  /** Label of the footer legend's navigate entry. */
  readonly navigateLabel: string;
  /** Keys of the footer legend's run entry. */
  readonly runKeys: string;
  /** Label of the footer legend's run entry. */
  readonly runLabel: string;
  /** Keys of the footer legend's close entry. */
  readonly closeKeys: string;
  /** Label of the footer legend's close entry. */
  readonly closeLabel: string;
  /** `{keys}`, `{label}`: what a screen reader hears for one footer legend entry. */
  readonly legendEntry: CngxMessage;
}

/**
 * The English command-palette section: the single source of the palette's
 * English copy. The `CNGX_COMMAND_PALETTE_CONFIG` copy keys default to it.
 *
 * @category ui/command-palette/i18n
 * @since 0.1.0
 * @relatedTo CNGX_COMMAND_PALETTE_CONFIG
 */
export const CNGX_COMMAND_PALETTE_LANGUAGE_EN: CngxCommandPaletteLanguageSection = {
  searchPlaceholder: 'Type a command or search…',
  listboxLabel: 'Commands',
  emptyLabel: 'No matching commands',
  loadingLabel: 'Loading commands…',
  errorLabel: 'Could not load commands',
  retryLabel: 'Retry',
  paletteLabel: 'Command palette',
  resultCount: { one: '{count} result', other: '{count} results' },
  navigateKeys: '↑ ↓',
  navigateKeysSpoken: 'Up and Down arrows',
  navigateLabel: 'Navigate',
  runKeys: 'Enter',
  runLabel: 'Run',
  closeKeys: 'Esc',
  closeLabel: 'Close',
  legendEntry: '{keys} {label}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly commandPalette: CngxCommandPaletteLanguageSection;
  }
}
