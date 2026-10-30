/**
 * Visual skin of `CngxRadioIndicator`. `'default'` is the hairline ring
 * with a primary dot; `'check'` fills the checked disc with the primary
 * colour and strokes the shared check glyph on it (the card / tile
 * skin); `'tinted'` fills the checked disc with a soft primary tint
 * behind a primary ring and a smaller primary dot.
 *
 * All three draw the same ring geometry, so swapping skins never moves
 * the indicator's box or its centre.
 */
export type CngxRadioSkin = 'default' | 'check' | 'tinted';

/**
 * App-wide cascade for the radio indicator skin.
 *
 * Resolution priority (high → low):
 *   1. `[skin]` on `cngx-radio-indicator` (or on `cngx-radio`, which
 *      falls back to its `cngx-radio-group`'s `[skin]`).
 *   2. `provideRadioConfigAt(...)` in a parent component's
 *      `viewProviders` (component-scoped override).
 *   3. `provideRadioConfig(...)` at the application root.
 *   4. Library defaults (`skin: 'default'`).
 */
export interface CngxRadioConfig {
  /** Skin applied when no instance or group `[skin]` binding wins. */
  readonly skin?: CngxRadioSkin;
}
