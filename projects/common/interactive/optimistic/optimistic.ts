import { computed, signal, untracked, type WritableSignal, type Signal } from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { type Observable, type Subscription, take } from 'rxjs';

/**
 * State exposed by the optimistic action.
 */
export interface OptimisticState {
  /** Whether a rollback occurred on the last invocation. */
  readonly rolledBack: Signal<boolean>;
  /** The error from the last failed action (`undefined` if successful). */
  readonly error: Signal<unknown>;
  /**
   * Full `CngxAsyncState` view of the optimistic lifecycle.
   *
   * Bind to any `[state]` consumer to connect the feedback system.
   * Status is `'pending'` while the confirming Observable is in flight,
   * `'success'` on confirmation, `'error'` on rollback.
   */
  readonly state: CngxAsyncState<unknown>;
}

/**
 * Creates an optimistic update function for a signal.
 *
 * Sets the new value immediately (optimistic), then confirms via the async action.
 * On success, applies the server-confirmed value. On failure, rolls back to the
 * value the signal held right before the apply. While an earlier apply is still
 * in flight, the rollback target stays the last value that was confirmed or held
 * before that earlier apply, never an unconfirmed optimistic value.
 *
 * This is a utility function, not a directive - it composes with any signal.
 *
 * ```typescript
 * readonly name = signal('Alice');
 * readonly [updateName, nameState] = createOptimistic(
 *   this.name,
 *   (value) => this.http.put('/api/name', { name: value })
 * );
 *
 * // In template:
 * <input [value]="name()" (change)="updateName($event.target.value)" />
 * <ng-container [cngxToastOn]="nameState.state" toastError="Update failed" />
 * @if (nameState.rolledBack()) { <span>Reverted</span> }
 * ```
 *
 * **Note:** The internal subscription is unmanaged - there is no `DestroyRef` available
 * in a plain factory function. If the component is destroyed mid-flight, the subscription
 * completes silently. For long-running actions, ensure the component outlives the action
 * or cancel via the Observable itself.
 *
 * @param current - The writable signal to update optimistically.
 * @param action - Async action that confirms the value. Should return the confirmed value.
 * @returns Tuple of `[applyFn, state]`.
 */
export function createOptimistic<T>(
  current: WritableSignal<T>,
  action: (value: T) => Observable<T>,
): [(newValue: T) => void, OptimisticState] {
  const rolledBackState = signal(false);
  const errorState = signal<unknown>(undefined);
  const statusState = signal<AsyncStatus>('idle');

  const asyncState = buildAsyncStateView<unknown>({
    status: statusState.asReadonly(),
    data: computed(() => undefined),
    error: errorState.asReadonly(),
  });

  const state: OptimisticState = {
    rolledBack: rolledBackState.asReadonly(),
    error: errorState.asReadonly(),
    state: asyncState,
  };

  // Rollback target, read when an apply starts with none in flight. An
  // overlapping apply keeps it, so a failure never restores an unconfirmed
  // optimistic value.
  let confirmedValue = untracked(current);
  let inFlight = false;
  let activeSub: Subscription | undefined;

  const apply = (newValue: T): void => {
    if (!inFlight) {
      confirmedValue = untracked(current);
    }
    inFlight = true;
    // Cancel in-flight subscription - prevents stale closure rollback
    activeSub?.unsubscribe();

    rolledBackState.set(false);
    errorState.set(undefined);
    statusState.set('pending');

    current.set(newValue);

    activeSub = action(newValue)
      .pipe(take(1))
      .subscribe({
        next: (confirmed) => {
          inFlight = false;
          current.set(confirmed);
          statusState.set('success');
          activeSub = undefined;
        },
        error: (err: unknown) => {
          inFlight = false;
          current.set(confirmedValue);
          rolledBackState.set(true);
          errorState.set(err);
          statusState.set('error');
          activeSub = undefined;
        },
      });
  };

  return [apply, state];
}

/**
 * Alias of {@link createOptimistic} under the pre-convention name.
 *
 * @deprecated Use `createOptimistic` - this name is removed at the
 * v1.0 cut (exported factories carry the `create` prefix).
 */
export const optimistic = createOptimistic;
