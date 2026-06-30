/**
 * Tick stops from `min` to `max` stepping by `step`, for rendering tick marks +
 * labels. Returns `[]` when the step grid is invalid or denser than `maxCount`
 * (a guard against pathological DOM, e.g. step 1 over a 0..10000 range).
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-ticks.ts
 * @since 0.1.0
 */
export function sliderTickValues(min: number, max: number, step: number, maxCount = 21): number[] {
  const span = max - min;
  if (step <= 0 || span <= 0) {
    return [];
  }
  const count = Math.floor(span / step);
  if (count + 1 > maxCount) {
    return [];
  }
  const decimals = decimalPlaces(step);
  const stops: number[] = [];
  for (let i = 0; i <= count; i++) {
    stops.push(Number((min + i * step).toFixed(decimals)));
  }
  return stops;
}

function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  const text = String(n);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}
