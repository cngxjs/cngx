/**
 * @internal
 * Built-in non-copy defaults of the palette. Never exported from
 * `public-api.ts`. The copy defaults live in the `commandPalette` section of
 * the language pack (`CNGX_COMMAND_PALETTE_LANGUAGE_EN`).
 */
export interface CngxCommandPaletteDefaults {
  /** Combo string that opens the palette (parsed via `parseKeyCombo`). */
  readonly openShortcut: string;
}

/** @internal */
export const CNGX_COMMAND_PALETTE_DEFAULTS: CngxCommandPaletteDefaults = {
  openShortcut: 'mod+k',
};
