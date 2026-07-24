/**
 * Largest-Triangle-Three-Buckets downsampling. Reduces a dense series to
 * `targetSize` points while preserving the perceptual shape of the line —
 * peaks, troughs, and inflections survive where naive uniform (every-Nth)
 * sampling would drop them. This is the realtime-charting literature's
 * default downsampler (Steinarsson 2013).
 *
 * Pure TS: no Angular, no signal, no RxJS dependency. Tree-shakeable, so
 * static-chart consumers that never buffer pay nothing. The `<cngx-chart>`
 * buffer ({@link injectChartBuffer}) is the single downsampling boundary at
 * v2; this is its algorithm.
 *
 * The first and last points are always kept. The middle `targetSize - 2`
 * points are chosen one per bucket by the largest-triangle-area heuristic:
 * for each bucket, the point forming the largest triangle with the previous
 * selected point and the next bucket's average is retained.
 *
 * @param data source series, read-only.
 * @param targetSize desired output length. When `>= data.length` (or `<= 0`),
 *   the input is returned unchanged by reference — no allocation, no copy.
 * @param xAccessor projects a row to its numeric X (typically a timestamp or
 *   positional index).
 * @param yAccessor projects a row to its numeric Y (the value the triangle
 *   area is computed against).
 * @returns a fresh array of at most `targetSize` rows, or the input by
 *   reference when no reduction is needed.
 *
 * @category common/chart/buffer
 */
export function downsampleLTTB<T>(
  data: readonly T[],
  targetSize: number,
  xAccessor: (d: T, i: number) => number,
  yAccessor: (d: T, i: number) => number,
): readonly T[] {
  const n = data.length;
  if (targetSize <= 0 || targetSize >= n) {
    return data;
  }
  if (targetSize === 1) {
    return [data[0]];
  }
  if (targetSize === 2) {
    return [data[0], data[n - 1]];
  }

  const sampled: T[] = [data[0]];
  // Middle buckets span the interior points [1, n-2]; first and last are
  // reserved. A fractional bucket size keeps the buckets evenly balanced.
  const bucketSize = (n - 2) / (targetSize - 2);
  let anchor = 0;

  for (let i = 0; i < targetSize - 2; i++) {
    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Average of the next bucket forms the third triangle vertex.
    const nextStart = bucketEnd;
    const nextEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);
    const nextLen = nextEnd - nextStart;
    let avgX = 0;
    let avgY = 0;
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += xAccessor(data[j], j);
      avgY += yAccessor(data[j], j);
    }
    avgX /= nextLen;
    avgY /= nextLen;

    const anchorX = xAccessor(data[anchor], anchor);
    const anchorY = yAccessor(data[anchor], anchor);

    let maxArea = -1;
    let maxIndex = bucketStart;
    for (let j = bucketStart; j < bucketEnd; j++) {
      const area =
        Math.abs(
          (anchorX - avgX) * (yAccessor(data[j], j) - anchorY) -
            (anchorX - xAccessor(data[j], j)) * (avgY - anchorY),
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    sampled.push(data[maxIndex]);
    anchor = maxIndex;
  }

  sampled.push(data[n - 1]);
  return sampled;
}
