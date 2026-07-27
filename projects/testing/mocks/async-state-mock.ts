import { signal } from '@angular/core';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

/** Fields a spec can drive on {@link AsyncStateMock}. */
export interface AsyncStateMockPatch {
  /** New status. Also recomputes `isLoading` / `isBusy` from it. */
  status?: AsyncStatus;
  /** Whether no successful load has completed yet. */
  firstLoad?: boolean;
  /** Whether the data slot counts as empty. */
  empty?: boolean;
  /** Latest data value. */
  data?: unknown;
}

/** A `CngxAsyncState` whose signals a spec drives directly. */
export interface AsyncStateMock extends CngxAsyncState<unknown> {
  /** Apply a partial state change. Omitted fields keep their current value. */
  set(patch: AsyncStateMockPatch): void;
}

/** Statuses that count as busy, mirroring `CngxAsyncState.isBusy`. */
const BUSY_STATUSES: readonly AsyncStatus[] = ['loading', 'pending', 'refreshing'];

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
 * const state = createAsyncStateMock();
 * fixture.componentInstance.state.set(state);
 *
 * state.set({ status: 'loading', firstLoad: true });
 * fixture.detectChanges();
 * expect(card.querySelector('.skeleton')).not.toBeNull();
 * ```
 *
 * `isLoading` and `isBusy` share one signal and are derived from `status`, so a
 * spec never has to keep them consistent by hand.
 */
export function createAsyncStateMock(): AsyncStateMock {
  const status = signal<AsyncStatus>('idle');
  const firstLoad = signal(true);
  const empty = signal(false);
  const busy = signal(false);
  const data = signal<unknown>(undefined);

  return {
    status,
    data,
    error: signal<unknown>(undefined),
    progress: signal<number | undefined>(undefined),
    isLoading: busy,
    isPending: signal(false),
    isRefreshing: signal(false),
    isBusy: busy,
    isFirstLoad: firstLoad,
    isEmpty: empty,
    hasData: signal(false),
    isSettled: signal(false),
    lastUpdated: signal<Date | undefined>(undefined),
    set(patch: AsyncStateMockPatch): void {
      if (patch.status !== undefined) {
        status.set(patch.status);
        busy.set(BUSY_STATUSES.includes(patch.status));
      }
      if (patch.firstLoad !== undefined) {
        firstLoad.set(patch.firstLoad);
      }
      if (patch.empty !== undefined) {
        empty.set(patch.empty);
      }
      if (patch.data !== undefined) {
        data.set(patch.data);
      }
    },
  };
}
