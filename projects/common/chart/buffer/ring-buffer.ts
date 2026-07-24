/**
 * Fixed-capacity FIFO ring. Once full, every `push` overwrites the oldest
 * entry — the buffer never grows past `capacity`, so a high-frequency
 * producer cannot leak memory into it. Pure TS, no signal dependency; the
 * reactive wrapper is {@link injectChartBuffer}.
 *
 * @internal — the public realtime surface is {@link injectChartBuffer};
 * consumers never touch the raw ring.
 *
 * @category common/chart/buffer
 */
export interface RingBuffer<T> {
  /** Append one value, evicting the oldest when at capacity. */
  push(value: T): void;
  /**
   * Append many values in order. When `values` exceeds `capacity`, only the
   * final `capacity` entries can survive, so the doomed prefix is skipped
   * rather than pushed-then-overwritten.
   */
  pushBatch(values: readonly T[]): void;
  /** Reset length to zero without re-allocating the backing store. */
  clear(): void;
  /**
   * A fresh in-order array (oldest first, newest last). Allocates on every
   * call — the caller is the cascade boundary and owns dedup.
   */
  snapshot(): readonly T[];
  /** Current element count, `0..capacity`. */
  length(): number;
  /** The fixed maximum element count. */
  readonly capacity: number;
}

/**
 * Construct a {@link RingBuffer} with a fixed `capacity`. The backing array
 * is allocated once; no growth, no per-push allocation.
 *
 * @param capacity positive integer maximum element count.
 * @throws when `capacity` is not a positive integer.
 *
 * @category common/chart/buffer
 */
export function createRingBuffer<T>(capacity: number): RingBuffer<T> {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new Error(`createRingBuffer: capacity must be a positive integer, got ${capacity}`);
  }

  const store = new Array<T>(capacity);
  let head = 0; // next write slot
  let size = 0;

  function push(value: T): void {
    store[head] = value;
    head = (head + 1) % capacity;
    if (size < capacity) {
      size++;
    }
  }

  function pushBatch(values: readonly T[]): void {
    const start = values.length > capacity ? values.length - capacity : 0;
    for (let i = start; i < values.length; i++) {
      push(values[i]);
    }
  }

  function clear(): void {
    head = 0;
    size = 0;
  }

  function snapshot(): readonly T[] {
    const out = new Array<T>(size);
    const oldest = (head - size + capacity) % capacity;
    for (let i = 0; i < size; i++) {
      out[i] = store[(oldest + i) % capacity];
    }
    return out;
  }

  function length(): number {
    return size;
  }

  return { push, pushBatch, clear, snapshot, length, capacity };
}
