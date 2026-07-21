import { computed, Injectable, signal, type Signal } from '@angular/core';
import { nextUid, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

/** @internal One registered async operation: its display label and its state. */
interface AsyncOperationEntry {
  readonly label?: string;
  readonly state: CngxAsyncState<unknown>;
}

/**
 * Read-only snapshot of one registered async operation.
 *
 * @category common/data/async-registry
 */
export interface CngxAsyncOperation {
  /** Per-operation uid minted at registration (`register`'s return value). */
  readonly id: string;
  /** Human-readable label, if one was supplied. Display only, never a key. */
  readonly label?: string;
  /** The operation's current status. */
  readonly status: AsyncStatus;
}

/** @internal Length-then-key-set equality for the operations Map signal. */
function mapKeySetEqual<K, V>(a: ReadonlyMap<K, V>, b: ReadonlyMap<K, V>): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const key of a.keys()) {
    if (!b.has(key)) {
      return false;
    }
  }
  return true;
}

/** @internal Element-wise equality on (id, label, status) for the view array. */
function operationsEqual(
  a: readonly CngxAsyncOperation[],
  b: readonly CngxAsyncOperation[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.label !== y.label || x.status !== y.status) {
      return false;
    }
  }
  return true;
}

/**
 * Opt-in aggregation registry for in-flight async operations.
 *
 * A single derived source for "is anything loading?" across a whole app: the
 * shell binds one `isAnythingLoading()` instead of N hand-maintained flags.
 * Producers register their `CngxAsyncState` (via `injectAsyncState({ register:
 * true })`, the HTTP interceptor, or directly) and unregister on teardown.
 *
 * Not `providedIn: 'root'` - consumers opt in with {@link provideAsyncRegistry}.
 * When the registry is absent, producers skip registration entirely.
 *
 * **Keyed by a per-operation uid, not the human label.** Async operations are
 * transient and collide on label; uid identity keeps N concurrent same-label
 * (or unlabeled) operations independent, so one `unregister` evicts exactly
 * its own entry. This is the one deliberate divergence from `CngxErrorRegistry`
 * (which keys by a stable scope name).
 *
 * Both views are `computed()` only - no `effect`, no service calls. Inner
 * status reactivity flows through each entry's `CngxAsyncState` signals; the
 * Map signal's `mapKeySetEqual` short-circuits register/unregister churn
 * without hiding status changes.
 *
 * @category common/data/async-registry
 */
@Injectable()
export class CngxAsyncRegistry {
  private readonly entriesState = signal<ReadonlyMap<string, AsyncOperationEntry>>(new Map(), {
    equal: mapKeySetEqual,
  });

  /**
   * `true` when at least one registered operation reports `isLoading()`
   * (`loading`, `pending`, or `refreshing`).
   */
  readonly isAnythingLoading: Signal<boolean> = computed(() => {
    for (const entry of this.entriesState().values()) {
      if (entry.state.isLoading()) {
        return true;
      }
    }
    return false;
  });

  /** Every registered operation with its current status, in registration order. */
  readonly activeOperations: Signal<readonly CngxAsyncOperation[]> = computed(
    () =>
      Array.from(this.entriesState(), ([id, entry]) => ({
        id,
        label: entry.label,
        status: entry.state.status(),
      })),
    { equal: operationsEqual },
  );

  /**
   * Registers an async state under a fresh per-operation uid and returns it.
   * The optional `label` is display metadata only - never the map key, so
   * concurrent same-label (or unlabeled) operations stay independent.
   */
  register(state: CngxAsyncState<unknown>, label?: string): string {
    const id = nextUid('cngx-async-op');
    const next = new Map(this.entriesState());
    next.set(id, { label, state });
    this.entriesState.set(next);
    return id;
  }

  /** Removes the operation with the given uid. No-op if absent. */
  unregister(id: string): void {
    const current = this.entriesState();
    if (!current.has(id)) {
      return;
    }
    const next = new Map(current);
    next.delete(id);
    this.entriesState.set(next);
  }
}
