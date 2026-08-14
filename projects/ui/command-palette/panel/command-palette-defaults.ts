/**
 * @internal
 * Built-in English strings for the default palette. Never exported from
 * `public-api.ts` - mirrors the select family's `CNGX_SELECT_GLYPHS` precedent,
 * so no strings are inlined in templates before the Phase 3 public config
 * cascade lands. German (or any locale) is consumer-supplied through that
 * cascade, never hard-coded here.
 */
export interface CngxCommandPaletteDefaults {
  readonly searchPlaceholder: string;
  readonly listboxLabel: string;
  readonly emptyLabel: string;
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly retryLabel: string;
  /** Builds the polite `aria-live` result-count message. */
  readonly resultCount: (count: number) => string;
  /** Keyboard-legend rows rendered in the footer. */
  readonly footerLegend: readonly CngxCommandPaletteLegendEntry[];
}

/** @internal One keyboard-legend row: the key glyphs and what they do. */
export interface CngxCommandPaletteLegendEntry {
  readonly keys: string;
  readonly label: string;
}

/** @internal */
export const CNGX_COMMAND_PALETTE_DEFAULTS: CngxCommandPaletteDefaults = {
  searchPlaceholder: 'Type a command or search...',
  listboxLabel: 'Commands',
  emptyLabel: 'No matching commands.',
  loadingLabel: 'Loading commands...',
  errorLabel: 'Could not load commands.',
  retryLabel: 'Retry',
  resultCount: (count) => (count === 1 ? '1 result' : `${count} results`),
  footerLegend: [
    { keys: 'up down', label: 'Navigate' },
    { keys: 'enter', label: 'Run' },
    { keys: 'esc', label: 'Close' },
  ],
};
