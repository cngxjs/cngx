import { computed, signal } from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

/**
 * Writable extension of `CngxAsyncState` for manual control.
 *
 * Returned by `createManualState()` — provides imperative setters
 * while the read-side stays the standard `CngxAsyncState` interface.
 *
 * @category async
 */
export interface ManualAsyncState<T> extends CngxAsyncState<T> {
  /** Set the status directly. */
  set(status: AsyncStatus): void;

  /** Transition to `success` with data. */
  setSuccess(data: T): void;

  /** Transition to `error`. */
  setError(error: unknown): void;

  /** Set progress (0–100). */
  setProgress(value: number | undefined): void;

  /** Reset to `idle`, clear data, error, and progress. */
  reset(): void;
}

/**
 * Create a fully manual async state — no HTTP, no automatic loading.
 *
 * Use for local operations: heavy computations, Web Workers, complex local processes.
 * Does **not** require an injection context — uses only `signal()` and `computed()`.
 *
 * @usageNotes
 *
 * ```typescript
 * readonly processState = createManualState<ProcessResult>();
 *
 * async handleProcess(): Promise<void> {
 *   this.processState.set('loading');
 *   this.processState.setProgress(0);
 *   const result = await heavyComputation((p) => this.processState.setProgress(p));
 *   this.processState.setSuccess(result);
 * }
 * ```
 *
 * @category async
 */
export function createManualState<T>(): ManualAsyncState<T> {
  const statusState = signal<AsyncStatus>('idle');
  const dataState = signal<T | undefined>(undefined);
  const errorState = signal<unknown>(undefined);
  const progressState = signal<number | undefined>(undefined);
  const lastUpdatedState = signal<Date | undefined>(undefined);
  const hadSuccess = signal(false);

  const view = buildAsyncStateView<T>({
    status: statusState.asReadonly(),
    data: dataState.asReadonly(),
    error: errorState.asReadonly(),
    progress: progressState.asReadonly(),
    isFirstLoad: computed(() => !hadSuccess()),
    lastUpdated: lastUpdatedState.asReadonly(),
  });

  return {
    ...view,

    set(newStatus: AsyncStatus): void {
      statusState.set(newStatus);
      if (newStatus === 'success') {
        hadSuccess.set(true);
        lastUpdatedState.set(new Date());
      }
    },

    setSuccess(value: T): void {
      dataState.set(value);
      errorState.set(undefined);
      progressState.set(undefined);
      hadSuccess.set(true);
      lastUpdatedState.set(new Date());
      statusState.set('success');
    },

    setError(err: unknown): void {
      errorState.set(err);
      progressState.set(undefined);
      statusState.set('error');
    },

    setProgress(value: number | undefined): void {
      progressState.set(value);
    },

    reset(): void {
      statusState.set('idle');
      dataState.set(undefined);
      errorState.set(undefined);
      progressState.set(undefined);
      lastUpdatedState.set(undefined);
      hadSuccess.set(false);
    },
  };
}
