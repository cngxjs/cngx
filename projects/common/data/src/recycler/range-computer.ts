// Step 1: range-computer.ts — pure function, zero dependencies

/**
 * Result of a range computation for virtual scrolling.
 * All values are in pixels except `start` and `end` which are indices.
 */
export interface RangeResult {
  /** Start index (inclusive) of the visible range. */
  readonly start: number;
  /** End index (exclusive) of the visible range. */
  readonly end: number;
  /** Height of the spacer before visible items (px). */
  readonly offsetBefore: number;
  /** Height of the spacer after visible items (px). */
  readonly offsetAfter: number;
  /** Total height of all items (px). */
  readonly totalSize: number;
}

const EMPTY_RANGE: RangeResult = {
  start: 0,
  end: 0,
  offsetBefore: 0,
  offsetAfter: 0,
  totalSize: 0,
};

/**
 * Computes the visible range of items given scroll position, viewport size,
 * total item count, and item size estimation.
 *
 * Pure function — no DOM access, no Angular dependency. Fully testable.
 *
 * @param scrollTop Current scroll offset in px.
 * @param clientHeight Viewport height in px.
 * @param totalCount Total number of items.
 * @param estimateSize Fixed item height in px, or a function returning height per index.
 * @param overscan Number of extra items to render above/below the viewport.
 * @returns The computed range with spacer offsets.
 */
export function computeRange(
  scrollTop: number,
  clientHeight: number,
  totalCount: number,
  estimateSize: number | ((index: number) => number),
  overscan: number,
  columns = 1,
): RangeResult {
  if (totalCount <= 0 || clientHeight <= 0) {
    return EMPTY_RANGE;
  }

  if (typeof estimateSize === 'number') {
    return computeFixedRange(scrollTop, clientHeight, totalCount, estimateSize, overscan, columns);
  }

  // Variable heights — grid mode not supported, columns ignored
  return computeVariableRange(scrollTop, clientHeight, totalCount, estimateSize, overscan);
}

function computeFixedRange(
  scrollTop: number,
  clientHeight: number,
  totalCount: number,
  itemSize: number,
  overscan: number,
  columns: number,
): RangeResult {
  if (columns > 1) {
    return computeGridRange(scrollTop, clientHeight, totalCount, itemSize, overscan, columns);
  }

  const totalSize = totalCount * itemSize;

  const rawStart = Math.floor(scrollTop / itemSize);
  const rawEnd = Math.ceil((scrollTop + clientHeight) / itemSize);

  const start = Math.max(0, rawStart - overscan);
  const end = Math.min(totalCount, rawEnd + overscan);

  return {
    start,
    end,
    offsetBefore: start * itemSize,
    offsetAfter: Math.max(0, (totalCount - end) * itemSize),
    totalSize,
  };
}

/**
 * Grid-mode range computation. Row-aligned before overscan.
 *
 * Order: raw visible rows → overscan rows → clamp → convert to item indices.
 * This ensures full rows are always rendered.
 */
function computeGridRange(
  scrollTop: number,
  clientHeight: number,
  totalCount: number,
  rowHeight: number,
  overscan: number,
  columns: number,
): RangeResult {
  const totalRows = Math.ceil(totalCount / columns);
  const totalSize = totalRows * rowHeight;

  // Step 1+2: raw visible rows (inherently row-aligned)
  const rawStartRow = Math.floor(scrollTop / rowHeight);
  const rawEndRow = Math.ceil((scrollTop + clientHeight) / rowHeight);

  // Step 3: apply overscan in rows (convert item overscan to row overscan)
  const overscanRows = Math.ceil(overscan / columns);
  const startRow = Math.max(0, rawStartRow - overscanRows);
  const endRow = Math.min(totalRows, rawEndRow + overscanRows);

  // Step 4: convert to item indices, clamp end to totalCount
  const start = startRow * columns;
  const end = Math.min(endRow * columns, totalCount);

  return {
    start,
    end,
    offsetBefore: startRow * rowHeight,
    offsetAfter: Math.max(0, (totalRows - endRow) * rowHeight),
    totalSize,
  };
}

function computeVariableRange(
  scrollTop: number,
  clientHeight: number,
  totalCount: number,
  estimateSize: (index: number) => number,
  overscan: number,
): RangeResult {
  // Accumulate heights to find the first visible item (binary search)
  let totalSize = 0;
  const offsets = new Array<number>(totalCount + 1);
  offsets[0] = 0;

  for (let i = 0; i < totalCount; i++) {
    totalSize += estimateSize(i);
    offsets[i + 1] = totalSize;
  }

  // Binary search for the first item whose bottom edge is past scrollTop
  const rawStart = binarySearch(offsets, scrollTop, totalCount);
  const rawEnd = binarySearch(offsets, scrollTop + clientHeight, totalCount);

  const start = Math.max(0, rawStart - overscan);
  const end = Math.min(totalCount, rawEnd + 1 + overscan);

  return {
    start,
    end,
    offsetBefore: offsets[start],
    offsetAfter: Math.max(0, totalSize - offsets[end]),
    totalSize,
  };
}

/** Finds the index of the first item whose cumulative offset exceeds `target`. */
function binarySearch(offsets: number[], target: number, totalCount: number): number {
  let low = 0;
  let high = totalCount - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (offsets[mid + 1] <= target) {
      low = mid + 1;
    } else if (offsets[mid] > target) {
      high = mid - 1;
    } else {
      return mid;
    }
  }

  return Math.min(low, totalCount - 1);
}
