import { computed, signal, type Signal } from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

/**
 * Configuration for {@link createKeyedRegistry} / {@link createSlotRegistry}.
 */
export interface RegistryOptions {
  /**
   * Owner name used in dev-mode diagnostics (`'CngxErrorRegistry'`,
   * `'CngxTabGroup'`). Defaults to `'cngx registry'`.
   */
  readonly name?: string;
}

/**
 * Keyed registry handle returned by {@link createKeyedRegistry}.
 */
export interface KeyedRegistry<T> {
  /** Registered entries by key, in registration order. */
  readonly entries: Signal<ReadonlyMap<string, T>>;
  /** Registered values in registration order. */
  readonly values: Signal<readonly T[]>;
  /**
   * Registers `value` under `key`. Idempotent for the same `(key, value)`
   * pair. Registering a DIFFERENT value under an existing key is
   * swap-is-noop: the first registration stays live and dev mode warns -
   * unregister the current holder first for a true swap.
   */
  register(key: string, value: T): void;
  /**
   * Removes the registration for `key` - but only while `value` is still
   * the registered holder. A stale holder unregistering after a successor
   * has claimed the key leaves the successor untouched.
   */
  unregister(key: string, value: T): void;
  /** Current holder of `key`, or `null`. Reactive (reads `entries`). */
  get(key: string): T | null;
}

/**
 * Single-slot registry handle returned by {@link createSlotRegistry}.
 */
export interface SlotRegistry<T> {
  /** The currently registered handle, or `null`. */
  readonly current: Signal<T | null>;
  /** Claims the slot. Last write wins. */
  register(handle: T): void;
  /**
   * Releases the slot - but only while `handle` still holds it. A stale
   * holder releasing after a successor claimed the slot is a no-op.
   */
  unregister(handle: T): void;
}

/**
 * Signal-based keyed registry with a destroy-safe unregister path. \
 * Encodes the registration lifecycle contract every cngx registry must
 * honour, so the classic teardown race is unwritable: when Angular
 * recreates a keyed child, the successor's `register` can run BEFORE the
 * predecessor's `DestroyRef` teardown - an unguarded `unregister(key)`
 * would then evict the successor's live registration. Here `unregister`
 * demands the holder instance and only removes on identity match.
 *
 * Collision semantics mirror `CngxErrorRegistry`: registering a different
 * value under a live key is absorbed (swap-is-noop) with a dev-mode
 * warning, never an in-place swap - downstream readers keep observing the
 * instance they resolved. The absorbed value waits for the key: when the
 * holder unregisters, the first waiting value takes the key over, so a
 * successor that registered before its predecessor's teardown stays live.
 * A waiting value that unregisters first leaves the queue.
 *
 * The registry is plain signals - create it as a field on the owning
 * directive / service, no injection context required.
 */
export function createKeyedRegistry<T>(options?: RegistryOptions): KeyedRegistry<T> {
  const name = options?.name ?? 'cngx registry';
  const entriesState = signal<ReadonlyMap<string, T>>(new Map());
  const entries = entriesState.asReadonly();
  const values = computed<readonly T[]>(() => Array.from(entriesState().values()));
  // Values absorbed under a live key, in registration order, waiting for the
  // holder's unregister. Plain map: only unregister reads it.
  const waiting = new Map<string, T[]>();

  function register(key: string, value: T): void {
    const current = entriesState();
    if (current.get(key) === value) {
      return;
    }
    if (current.has(key)) {
      const queue = waiting.get(key) ?? [];
      if (!queue.includes(value)) {
        waiting.set(key, [...queue, value]);
      }
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        cngxDevWarn(
          'CNGX0004',
          `createKeyedRegistry(): ${name} already holds "${key}". The existing instance stays ` +
            'live (swap-is-noop); unregister it first for a true swap.',
        );
      }
      return;
    }
    const next = new Map(current);
    next.set(key, value);
    entriesState.set(next);
  }

  function unregister(key: string, value: T): void {
    const current = entriesState();
    const queue = waiting.get(key) ?? [];
    if (current.get(key) !== value) {
      if (queue.includes(value)) {
        setWaiting(
          key,
          queue.filter((entry) => entry !== value),
        );
      }
      return;
    }
    const next = new Map(current);
    const [successor, ...rest] = queue;
    setWaiting(key, rest);
    if (queue.length > 0) {
      next.set(key, successor);
    } else {
      next.delete(key);
    }
    entriesState.set(next);
  }

  function setWaiting(key: string, queue: T[]): void {
    if (queue.length > 0) {
      waiting.set(key, queue);
    } else {
      waiting.delete(key);
    }
  }

  function get(key: string): T | null {
    return entriesState().get(key) ?? null;
  }

  return { entries, values, register, unregister, get };
}

/**
 * Signal-based single-slot registry with a destroy-safe release path. \
 * The one-handle sibling of {@link createKeyedRegistry} for slots like a
 * dialog's title / description handle: `register` is last-write-wins
 * (a recreated child simply claims the slot), while `unregister` only
 * clears the slot when the releasing handle still holds it - the
 * teardown of a replaced predecessor cannot blank a successor's claim.
 * Mirrors the guarded pattern `CngxDialog` uses for its aria handles.
 */
export function createSlotRegistry<T>(): SlotRegistry<T> {
  const currentState = signal<T | null>(null);
  const current = currentState.asReadonly();

  function register(handle: T): void {
    currentState.set(handle);
  }

  function unregister(handle: T): void {
    currentState.update((held) => (held === handle ? null : held));
  }

  return { current, register, unregister };
}
