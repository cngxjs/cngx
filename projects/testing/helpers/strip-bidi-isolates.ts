const BIDI_ISOLATES = /[⁨⁩]/g;

/**
 * Removes the U+2068 / U+2069 isolates `formatMessage` wraps around every
 * inserted text argument, so a spec can compare copy exactly.
 * `null` and `undefined` read as an empty string, for `textContent` and
 * `getAttribute` reads.
 */
export function stripBidiIsolates(text: string | null | undefined): string {
  return (text ?? '').replace(BIDI_ISOLATES, '');
}
