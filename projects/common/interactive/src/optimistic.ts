import { signal, type WritableSignal, type Signal } from '@angular/core';
import { type Observable, take } from 'rxjs';

/** State exposed by the optimistic action. */
export interface OptimisticState<T> {
  /** Whether a rollback occurred on the last invocation. */
  readonly rolledBack: Signal<boolean>;
  /** The error from the last failed action (null if successful). */
  readonly error: Signal<unknown>;
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
 * @if (nameState.rolledBack()) { <span>Update failed — reverted</span> }
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
): [(newValue: T) => void, OptimisticState<T>] {
  const rolledBackState = signal(false);
  const errorState = signal<unknown>(null);

  const state: OptimisticState<T> = {
    rolledBack: rolledBackState.asReadonly(),
    error: errorState.asReadonly(),
  };

  const apply = (newValue: T): void => {
    const previous = current();
    rolledBackState.set(false);
    errorState.set(null);

    // Set optimistically — UI updates immediately
    current.set(newValue);

    action(newValue)
      .pipe(take(1))
      .subscribe({
        next: (confirmed) => current.set(confirmed),
        error: (err: unknown) => {
          // Rollback to previous value
          current.set(previous);
          rolledBackState.set(true);
          errorState.set(err);
        },
      });
  };

  return [apply, state];
}
