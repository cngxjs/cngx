import { computed, Injectable, signal, type Signal } from '@angular/core';
import type { CngxErrorAggregatorContract } from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { mapKeySetEqual, shallowReadonlyArrayEqual } from './equal-fns';

/**
 * Programmatic registry for named error scopes and aggregators.
 *
 * Provides a lookup surface so consumers (route guards, HTTP interceptors,
 * test harnesses) can inspect or drive form-error state without traversing
 * the DOM. Directives with `cngxErrorScopeName` / `cngxErrorAggregatorName`
 * inputs auto-register here when the registry is provided in the host
 * environment (via {@link provideErrorRegistry}, ships in commit 3).
 *
 * Not `providedIn: 'root'` — consumers opt in by including
 * `provideErrorRegistry()` in their `bootstrapApplication` providers. When
 * the registry is absent, the directives skip registration and keep their
 * pure DOM behaviour.
 *
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 *
 * @category services
 */
@Injectable()
export class CngxErrorRegistry {
  private readonly scopesState = signal<ReadonlyMap<string, CngxErrorScopeContract>>(
    new Map(),
    { equal: mapKeySetEqual },
  );

  private readonly aggregatorsState = signal<
    ReadonlyMap<string, CngxErrorAggregatorContract>
  >(new Map(), { equal: mapKeySetEqual });

  /**
   * True when at least one registered aggregator reports `hasError`.
   *
   * The Map signal `equal` fn short-circuits on key-set unchanged, so
   * registering an additional aggregator under an existing name does not
   * cascade through this computed. Adding or removing keys does emit.
   */
  readonly hasAnyError: Signal<boolean> = computed(() => {
    for (const aggregator of this.aggregatorsState().values()) {
      if (aggregator.hasError()) {
        return true;
      }
    }
    return false;
  });

  /** Sum of `errorCount()` across every registered aggregator. */
  readonly totalErrorCount: Signal<number> = computed(() => {
    let total = 0;
    for (const aggregator of this.aggregatorsState().values()) {
      total += aggregator.errorCount();
    }
    return total;
  });

  /** Registered aggregator contracts in insertion order. */
  readonly errorAggregators: Signal<readonly CngxErrorAggregatorContract[]> = computed(
    () => Array.from(this.aggregatorsState().values()),
    { equal: shallowReadonlyArrayEqual },
  );

  // ── Scope mutations ─────────────────────────────────────────────────

  /**
   * Registers the named scope. Idempotent for the same `(name, scope)`
   * pair.
   *
   * **Swap-is-noop (intentional):** registering a *different* scope
   * instance under an *existing* name is silently absorbed. The internal
   * `scopesState` signal carries `equal: mapKeySetEqual`, which short-
   * circuits when the key set is unchanged. Downstream readers (and any
   * subsequent `getScope(name)` call) keep observing the originally
   * registered instance.
   *
   * To perform a true swap, call `unregisterScope(name)` first, then
   * `registerScope(name, newScope)` — the unregister cycle changes the
   * key set, the equal fn emits, and the new instance becomes the live
   * value.
   */
  registerScope(name: string, scope: CngxErrorScopeContract): void {
    const current = this.scopesState();
    if (current.get(name) === scope) {
      return;
    }
    const next = new Map(current);
    next.set(name, scope);
    this.scopesState.set(next);
  }

  /** Removes the named scope. No-op if absent. */
  unregisterScope(name: string): void {
    const current = this.scopesState();
    if (!current.has(name)) {
      return;
    }
    const next = new Map(current);
    next.delete(name);
    this.scopesState.set(next);
  }

  /** Returns the named scope, or `undefined` when not registered. */
  getScope(name: string): CngxErrorScopeContract | undefined {
    return this.scopesState().get(name);
  }

  // ── Aggregator mutations ────────────────────────────────────────────

  /**
   * Registers the named aggregator. Idempotent for the same
   * `(name, aggregator)` pair.
   *
   * **Swap-is-noop (intentional):** see `registerScope` for the full
   * rationale. Re-registering a different aggregator instance under an
   * existing name is silently absorbed by `mapKeySetEqual`; downstream
   * readers stay attached to the originally registered contract. Use
   * `unregisterAggregator(name)` then `registerAggregator(name, newAgg)`
   * for a true swap.
   */
  registerAggregator(name: string, aggregator: CngxErrorAggregatorContract): void {
    const current = this.aggregatorsState();
    if (current.get(name) === aggregator) {
      return;
    }
    const next = new Map(current);
    next.set(name, aggregator);
    this.aggregatorsState.set(next);
  }

  /** Removes the named aggregator. No-op if absent. */
  unregisterAggregator(name: string): void {
    const current = this.aggregatorsState();
    if (!current.has(name)) {
      return;
    }
    const next = new Map(current);
    next.delete(name);
    this.aggregatorsState.set(next);
  }

  /** Returns the named aggregator, or `undefined` when not registered. */
  getAggregator(name: string): CngxErrorAggregatorContract | undefined {
    return this.aggregatorsState().get(name);
  }

  // ── Reveal / reset helpers ──────────────────────────────────────────

  /** Reveals the named scope. Idempotent; no-op if name not registered. */
  reveal(name: string): void {
    this.scopesState().get(name)?.reveal();
  }

  /** Resets the named scope. Idempotent; no-op if name not registered. */
  reset(name: string): void {
    this.scopesState().get(name)?.reset();
  }

  /** Reveals every registered scope. */
  revealAll(): void {
    for (const scope of this.scopesState().values()) {
      scope.reveal();
    }
  }

  /** Resets every registered scope. */
  resetAll(): void {
    for (const scope of this.scopesState().values()) {
      scope.reset();
    }
  }
}

