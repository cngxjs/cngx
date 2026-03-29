import { computed, signal, type WritableSignal, type Signal } from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { type Observable, type Subscription, take } from 'rxjs';

/** State exposed by the optimistic action. */
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
 * previous value.
 *
 * This is a utility function, not a directive — it composes with any signal.
 *
 * ```typescript
 * readonly name = signal('Alice');
 * readonly [updateName, nameState] = optimistic(
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
 * **Note:** The internal subscription is unmanaged — there is no `DestroyRef` available
 * in a plain factory function. If the component is destroyed mid-flight, the subscription
 * completes silently. For long-running actions, ensure the component outlives the action
 * or cancel via the Observable itself.
 *
 * @param current - The writable signal to update optimistically.
 * @param action - Async action that confirms the value. Should return the confirmed value.
 * @returns Tuple of `[applyFn, state]`.
 *
 * @category interactive
 */
export function optimistic<T>(
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

  // Track the previous confirmed value (before any optimistic update) and active subscription.
  // This ensures rollback always returns to the last server-confirmed state, even under
  // rapid concurrent calls.
  let confirmedValue = current();
  let activeSub: Subscription | undefined;

  const apply = (newValue: T): void => {
    // Cancel any in-flight subscription — prevents stale closure rollback
    activeSub?.unsubscribe();

    rolledBackState.set(false);
    errorState.set(undefined);
    statusState.set('pending');

    // Set optimistically — UI updates immediately
    current.set(newValue);

    activeSub = action(newValue)
      .pipe(take(1))
      .subscribe({
        next: (confirmed) => {
          confirmedValue = confirmed;
          current.set(confirmed);
          statusState.set('success');
          activeSub = undefined;
        },
        error: (err: unknown) => {
          // Rollback to last confirmed value (not the stale optimistic one)
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
