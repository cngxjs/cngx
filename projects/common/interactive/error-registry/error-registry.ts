import { computed, Injectable, type Signal } from '@angular/core';
import { createKeyedRegistry } from '@cngx/core/utils';
import type { CngxErrorAggregatorContract } from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { shallowReadonlyArrayEqual } from './equal-fns';

/**
 * Programmatic registry for named error scopes and aggregators.
 *
 * Provides a lookup surface so consumers (route guards, HTTP interceptors,
 * test harnesses) can inspect or drive form-error state without traversing
 * the DOM. Directives with `cngxErrorScopeName` / `cngxErrorAggregatorName`
 * inputs auto-register here when the registry is provided in the host
 * environment via {@link provideErrorRegistry}.
 *
 * Not `providedIn: 'root'` - consumers opt in by including
 * `provideErrorRegistry()` in their `bootstrapApplication` providers. When
 * the registry is absent, the directives skip registration and keep their
 * pure DOM behaviour.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/error-registry/error-registry.ts
 * @since 0.3.0
 * @relatedTo CngxErrorScope, CngxErrorAggregator, CngxErrorSource
 * <example-url>/#/common/interactive/error/registry/provider-and-reveal-features</example-url>
 */
@Injectable()
export class CngxErrorRegistry {
  private readonly scopes = createKeyedRegistry<CngxErrorScopeContract>({
    name: 'CngxErrorRegistryScopes',
  });

  private readonly aggregators = createKeyedRegistry<CngxErrorAggregatorContract>({
    name: 'CngxErrorRegistryAggregators',
  });

  /** True when at least one registered aggregator reports `hasError`. */
  readonly hasAnyError: Signal<boolean> = computed(() =>
    this.aggregators.values().some((aggregator) => aggregator.hasError()),
  );

  /** Sum of `errorCount()` across every registered aggregator. */
  readonly totalErrorCount: Signal<number> = computed(() =>
    this.aggregators.values().reduce((total, aggregator) => total + aggregator.errorCount(), 0),
  );

  /** Registered aggregator contracts in insertion order. */
  readonly errorAggregators: Signal<readonly CngxErrorAggregatorContract[]> = computed(
    () => this.aggregators.values(),
    { equal: shallowReadonlyArrayEqual },
  );

  /**
   * Registers the named scope. Idempotent for the same `(name, scope)`
   * pair.
   *
   * **Swap-is-noop:** a *different* scope under a taken name does not
   * replace the holder; `getScope(name)` keeps returning the first
   * instance and dev mode warns
   * ([`CNGX0004`](/error-codes/cngx0004.md)). The new scope waits: when the
   * holder unregisters, the first waiting scope takes the name over. For
   * an immediate swap, unregister the holder first.
   */
  registerScope(name: string, scope: CngxErrorScopeContract): void {
    this.scopes.register(name, scope);
  }

  /**
   * Removes `scope` from `name`. While `scope` holds the name, the first
   * waiting scope takes it over; a waiting `scope` just leaves the queue.
   * No-op for any other instance, so a late destroy never evicts the
   * live holder.
   */
  unregisterScope(name: string, scope: CngxErrorScopeContract): void {
    this.scopes.unregister(name, scope);
  }

  /** Returns the named scope, or `undefined` when not registered. */
  getScope(name: string): CngxErrorScopeContract | undefined {
    return this.scopes.get(name) ?? undefined;
  }

  /**
   * Registers the named aggregator. Idempotent for the same
   * `(name, aggregator)` pair. A different aggregator under a taken name
   * waits for the holder (swap-is-noop), as in `registerScope`.
   */
  registerAggregator(name: string, aggregator: CngxErrorAggregatorContract): void {
    this.aggregators.register(name, aggregator);
  }

  /**
   * Removes `aggregator` from `name`, handing the name to the first
   * waiting aggregator, as in `unregisterScope`.
   */
  unregisterAggregator(name: string, aggregator: CngxErrorAggregatorContract): void {
    this.aggregators.unregister(name, aggregator);
  }

  /** Returns the named aggregator, or `undefined` when not registered. */
  getAggregator(name: string): CngxErrorAggregatorContract | undefined {
    return this.aggregators.get(name) ?? undefined;
  }

  /** Reveals the named scope. Idempotent; no-op if name not registered. */
  reveal(name: string): void {
    this.scopes.get(name)?.reveal();
  }

  /** Resets the named scope. Idempotent; no-op if name not registered. */
  reset(name: string): void {
    this.scopes.get(name)?.reset();
  }

  /** Reveals every registered scope. */
  revealAll(): void {
    for (const scope of this.scopes.values()) {
      scope.reveal();
    }
  }

  /** Resets every registered scope. */
  resetAll(): void {
    for (const scope of this.scopes.values()) {
      scope.reset();
    }
  }
}
