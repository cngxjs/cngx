/**
 * Strip floating-point arithmetic noise from a number destined for
 * human-facing text: `6.6000000000000005` becomes `'6.6'`, `2.2` stays
 * `'2.2'`, `25` stays `'25'`. Integers and non-finite values pass
 * through `String(v)` untouched. 12 significant digits keep every
 * sensible chart value intact while collapsing the trailing 1e-15
 * noise accumulated float math produces.
 *
 * Shared by the default axis tick formatter, the default i18n summary
 * and the SR data table, so all three read the same value the same way.
 *
 * @internal
 */
export function formatChartNumber(v: number): string {
  if (Number.isInteger(v) || !Number.isFinite(v)) {
    return String(v);
  }
  return Number(v.toPrecision(12)).toString();
}
