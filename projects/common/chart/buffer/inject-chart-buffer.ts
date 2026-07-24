import { DestroyRef, computed, inject, signal, type Signal } from '@angular/core';

import { sameItemsArr } from '../chart/equal-helpers';
import { downsampleLTTB } from './lttb';
import { createRingBuffer } from './ring-buffer';

/**
 * Construction options for {@link injectChartBuffer}.
 *
 * @category common/chart/buffer
 */
export interface ChartBufferOptions<T> {
  /** Ring capacity — the maximum rows retained before eviction. */
  readonly capacity: number;
  /**
   * When set and the ring holds more than this many rows, `points` is
   * LTTB-downsampled to exactly this length. Omit to emit the raw window.
   */
  readonly downsampleTo?: number;
  /** Projects a row to its numeric X for the LTTB triangle area. */
  readonly xAccessor: (d: T, i: number) => number;
  /** Projects a row to its numeric Y for the LTTB triangle area. */
  readonly yAccessor: (d: T, i: number) => number;
}

/**
 * The realtime feed handle returned by {@link injectChartBuffer}. Bind
 * `points` to a chart data input; drive it from any high-frequency producer
 * via `push` / `pushBatch`.
 *
 * @category common/chart/buffer
 */
export interface CngxChartBuffer<T> {
  /**
   * The current (optionally downsampled) window, rAF-coalesced. Carries an
   * element-wise `equal` guard so a flush reselecting the same rows does not
   * cascade downstream.
   */
  readonly points: Signal<readonly T[]>;
  /** Append one row; schedules a flush for the next animation frame. */
  push(value: T): void;
  /** Append many rows in order; schedules a single flush. */
  pushBatch(values: readonly T[]): void;
  /** Empty the ring; the emptied window emits on the next flush. */
  clear(): void;
  /** The fixed ring capacity. */
  readonly capacity: number;
  /** Current retained row count, `0..capacity`, reflecting the last flush. */
  readonly length: Signal<number>;
  /** `true` while a flush is scheduled but not yet applied — drive a busy hint. */
  readonly pendingFlush: Signal<boolean>;
}

/**
 * Bounded, rAF-coalesced realtime feed for `<cngx-chart>`. Wraps a
 * fixed-capacity ring ({@link createRingBuffer}) with an optional LTTB
 * downsample ({@link downsampleLTTB}) and exposes the window as a `Signal`.
 *
 * Multiple `push` / `pushBatch` / `clear` calls within one animation frame
 * collapse into a single `points` emission: each mutation writes the ring
 * imperatively and schedules one `requestAnimationFrame(flush)`; the flush
 * bumps a revision signal that `points` derives from. The flush is a plain
 * callback writing a signal — not an `effect()` body — so no reactive
 * exception class is involved.
 *
 * Runs in an injection context; the rAF handle is cancelled via `DestroyRef`.
 *
 * ```typescript
 * export class Telemetry {
 *   private readonly buffer = injectChartBuffer<Sample>({
 *     capacity: 1000,
 *     downsampleTo: 600,
 *     xAccessor: (s) => s.t,
 *     yAccessor: (s) => s.value,
 *   });
 *   protected readonly points = this.buffer.points; // -> <cngx-chart [data]>
 *   onSample(s: Sample): void {
 *     this.buffer.push(s);
 *   }
 * }
 * ```
 *
 * @category common/chart/buffer
 */
export function injectChartBuffer<T>(opts: ChartBufferOptions<T>): CngxChartBuffer<T> {
  const destroyRef = inject(DestroyRef);
  const ring = createRingBuffer<T>(opts.capacity);

  const revision = signal(0);
  const pending = signal(false);
  let rafHandle: number | null = null;

  const points = computed<readonly T[]>(
    () => {
      revision();
      const snap = ring.snapshot();
      if (opts.downsampleTo === undefined || snap.length <= opts.downsampleTo) {
        return snap;
      }
      return downsampleLTTB(snap, opts.downsampleTo, opts.xAccessor, opts.yAccessor);
    },
    { equal: sameItemsArr },
  );

  const length = computed(() => {
    revision();
    return ring.length();
  });

  function flush(): void {
    rafHandle = null;
    pending.set(false);
    revision.update((n) => n + 1);
  }

  function scheduleFlush(): void {
    if (rafHandle !== null) {
      return;
    }
    pending.set(true);
    rafHandle = requestAnimationFrame(flush);
  }

  function push(value: T): void {
    ring.push(value);
    scheduleFlush();
  }

  function pushBatch(values: readonly T[]): void {
    ring.pushBatch(values);
    scheduleFlush();
  }

  function clear(): void {
    ring.clear();
    scheduleFlush();
  }

  destroyRef.onDestroy(() => {
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
  });

  return {
    points,
    push,
    pushBatch,
    clear,
    capacity: opts.capacity,
    length,
    pendingFlush: pending.asReadonly(),
  };
}
