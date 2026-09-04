/**
 * Count the decimal places in a finite number's shortest decimal string.
 *
 * Used to round float-drift artefacts back to the precision a step or origin
 * carries (e.g. `0.1 * 3 = 0.30000000000000004` snaps back to `0.3`). Reads
 * the places off `String(n)` rather than a fixed epsilon so `0.125` reports 3,
 * not a guessed constant. Non-finite input returns `0`.
 *
 * @category utils
 * @since 0.1.0
 */
export function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  const text = String(n);
  // Very small/large magnitudes stringify in exponent notation ('1e-7'):
  // derive the places from mantissa places minus the exponent instead of
  // reporting 0 off the missing dot.
  const eIndex = text.search(/[eE]/);
  if (eIndex !== -1) {
    const mantissa = text.slice(0, eIndex);
    const exponent = Number(text.slice(eIndex + 1));
    const dot = mantissa.indexOf('.');
    const mantissaPlaces = dot === -1 ? 0 : mantissa.length - dot - 1;
    return Math.max(0, mantissaPlaces - exponent);
  }
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}
