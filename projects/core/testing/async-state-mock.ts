import { signal } from '@angular/core';
import { type AsyncStatus, buildAsyncStateView, type CngxAsyncState } from '@cngx/core/utils';

/**
 * Fields a spec can drive on {@link CngxAsyncStateMock}.
 *
 * @since 0.1.0
 */
export interface CngxAsyncStateMockPatch<T = unknown> {
  /**
   * New status. Every status-derived flag (`isLoading` / `isPending` /
   * `isRefreshing` / `isBusy` / `isSettled`) recomputes from it.
   */
  status?: AsyncStatus;
  /** Whether no successful load has completed yet. */
  firstLoad?: boolean;
  /** Whether the data slot counts as empty. `hasData` recomputes as its negation. */
  empty?: boolean;
  /** Latest data value. Pass `undefined` explicitly to clear the slot. */
  data?: T;
  /** Latest error value. Pass `undefined` explicitly to clear the slot. */
  error?: unknown;
  /** Progress 0-100. Pass `undefined` explicitly for indeterminate. */
  progress?: number | undefined;
  /** Timestamp of the last successful load. Pass `undefined` explicitly to clear the slot. */
  lastUpdated?: Date | undefined;
}

/**
 * A `CngxAsyncState` whose signals a spec drives directly.
 *
 * @since 0.1.0
 */
export interface CngxAsyncStateMock<T = unknown> extends CngxAsyncState<T> {
  /** Apply a partial state change. Omitted fields keep their current value. */
  set(patch: CngxAsyncStateMockPatch<T>): void;
}

/**
 * A hand-driven `CngxAsyncState` for specs on components that accept `[state]`.
 *
 * Consumers of the async envelope read the **interface**, never a producer, so a
 * spec should not have to stand up `createAsyncState` or a fake HTTP resource
 * just to assert what a component renders at a given status. This mock lets a
 * spec set `status` / `isFirstLoad` / `isEmpty` independently, including
 * combinations a real producer would not reach in one step.
 *
 * ```typescript
 * const state = createAsyncStateMock<Item[]>();
 * fixture.componentInstance.state.set(state);
 *
 * state.set({ status: 'loading', firstLoad: true });
 * fixture.detectChanges();
 * expect(card.querySelector('.skeleton')).not.toBeNull();
 * ```
 *
 * All derived members come from `buildAsyncStateView` - the same kernel every
 * real producer uses - over writable source signals, so the mock cannot drift
 * from the envelope's derivation rules: `set({ status: 'pending' })` yields
 * `isPending` and `isBusy` both `true`, exactly like the kernel.
 *
 * The one deliberate divergence from a data-carrying producer: emptiness is the
 * spec-driven `empty` signal (default `false`), not derived from the data
 * shape. That uses the kernel's `isEmpty` source override and keeps `isEmpty` /
 * `hasData` drivable without staging data.
 *
 * `T` defaults to `unknown`; pass the component's data type so the mock binds
 * to a `[state]` input typed `CngxAsyncState<T>` under strict templates.
 *
 * @since 0.1.0
 * @relatedTo buildAsyncStateView
 */
export function createAsyncStateMock<T = unknown>(): CngxAsyncStateMock<T> {
  const status = signal<AsyncStatus>('idle');
  const firstLoad = signal(true);
  const empty = signal(false);
  const data = signal<T | undefined>(undefined);
  const error = signal<unknown>(undefined);
  const progress = signal<number | undefined>(undefined);
  const lastUpdated = signal<Date | undefined>(undefined);

  const view = buildAsyncStateView<T>({
    status,
    data,
    error,
    progress,
    isFirstLoad: firstLoad,
    isEmpty: empty,
    lastUpdated,
  });

  return {
    ...view,
    set(patch: CngxAsyncStateMockPatch<T>): void {
      if (patch.status !== undefined) {
        status.set(patch.status);
      }
      if (patch.firstLoad !== undefined) {
        firstLoad.set(patch.firstLoad);
      }
      if (patch.empty !== undefined) {
        empty.set(patch.empty);
      }
      if ('data' in patch) {
        data.set(patch.data);
      }
      if ('error' in patch) {
        error.set(patch.error);
      }
      if ('progress' in patch) {
        progress.set(patch.progress);
      }
      if ('lastUpdated' in patch) {
        lastUpdated.set(patch.lastUpdated);
      }
    },
  };
}
