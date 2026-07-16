/**
 * Pure, framework-agnostic helpers that turn a signed delta value into the
 * three orthogonal signals a KPI atom renders: **direction** (which way the
 * arrow points), **sentiment** (whether the change is good or bad, which
 * drives colour and the SR word), and the formatted magnitude.
 *
 * Direction and sentiment are deliberately separate. `CngxTrend` colours by
 * direction (up = green); `CngxDelta` colours by sentiment, so a value that
 * dropped can still read as an improvement (churn down, latency down). Both
 * consume these helpers so the direction / glyph / format logic has a single
 * source of truth (Pillar 1) with no Angular dependency.
 */

/** Which way the delta moved. `flat` is exactly zero. */
export type DeltaDirection = 'up' | 'down' | 'flat';

/**
 * How to read the sign of a delta. `neutral` disables sentiment entirely
 * (direction still renders, colour stays neutral).
 */
export type DeltaPolarity = 'higher-is-better' | 'lower-is-better' | 'neutral';

/** Good / bad / indifferent, derived from `direction × polarity`. */
export type DeltaSentiment = 'positive' | 'negative' | 'neutral';

/** Percent (default, one fraction digit + `%`) or a locale-formatted absolute number. */
export type DeltaMode = 'percent' | 'absolute';

/** `> 0 → up`, `< 0 → down`, `0 → flat`. */
export function deltaDirection(value: number): DeltaDirection {
  return value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
}

/**
 * Combine movement with the caller's polarity. `flat` or `neutral` polarity
 * collapse to `neutral`; otherwise up is positive under `higher-is-better`
 * and negative under `lower-is-better` (and the reverse for down).
 */
export function deltaSentiment(
  direction: DeltaDirection,
  polarity: DeltaPolarity,
): DeltaSentiment {
  if (direction === 'flat' || polarity === 'neutral') {
    return 'neutral';
  }
  const upIsGood = polarity === 'higher-is-better';
  const isGood = direction === 'up' ? upIsGood : !upIsGood;
  return isGood ? 'positive' : 'negative';
}

/** Arrow glyph for the direction: `↑` / `↓` / `→`. */
export function directionGlyph(direction: DeltaDirection): string {
  return direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
}

/**
 * Format the magnitude. The sign is carried by the arrow and colour, not the
 * digits: a positive value gains a leading `+`, everything else prints its
 * absolute value unsigned. Percent mode appends a narrow-no-break-space + `%`
 * and defaults to one fraction digit; absolute mode uses the locale grouping.
 * A supplied `Intl.NumberFormatOptions` overrides the default digit handling
 * in both modes.
 */
export function formatDelta(
  value: number,
  mode: DeltaMode,
  locale: string,
  format?: Intl.NumberFormatOptions,
): string {
  const abs = Math.abs(value);
  const prefix = value > 0 ? '+' : '';
  if (mode === 'percent') {
    const num = format ? new Intl.NumberFormat(locale, format).format(abs) : abs.toFixed(1);
    return `${prefix}${num}\u202f%`;
  }
  const num = format ? new Intl.NumberFormat(locale, format).format(abs) : abs.toLocaleString(locale);
  return `${prefix}${num}`;
}
