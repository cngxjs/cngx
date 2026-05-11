import { DestroyRef, inject, signal, type Signal } from '@angular/core';
import type {
  CngxErrorAggregatorContract,
  CngxErrorAggregatorSourceEntry,
} from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { createErrorAggregatorContract } from './aggregator-contract';
import { CngxErrorRegistry } from './error-registry';
import { errorSourceMapEqual } from './equal-fns';

/**
 * Creates a programmatic {@link CngxErrorAggregatorContract}, optionally
 * registered under `name` in the ambient {@link CngxErrorRegistry}.
 *
 * Positional arguments — NOT a config-options-bag — per Pillar 3
 * (Komposition statt Konfiguration). When `name` is set and a registry is
 * provided, auto-registers and auto-deregisters on the surrounding
 * `DestroyRef`.
 *
 * @param name     Optional registry name (skips registration when omitted).
 * @param sources  Initial source map (`key` → reactive boolean Signal).
 *                 Each entry's signal is the live condition the aggregator
 *                 reads on every recompute.
 * @param scope    Optional scope override; when omitted, `shouldShow`
 *                 collapses to `hasError`.
 * @param labels   Optional human-readable labels by source key, used in
 *                 `errorLabels` and `announcement`.
 *
 * Must be called in an injection context (constructor, factory provider,
 * `runInInjectionContext`).
 *
 * Computed-graph derivation is delegated to
 * {@link createErrorAggregatorContract} so the directive
 * ({@link `@cngx/common/interactive`#CngxErrorAggregator}) and the
 * function form share a single source of truth.
 *
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 *
 * @category functions
 */
export function injectErrorAggregator(
  name?: string,
  sources?: Record<string, Signal<boolean>>,
  scope?: CngxErrorScopeContract,
  labels?: Record<string, string>,
): CngxErrorAggregatorContract {
  const sourcesState = signal<ReadonlyMap<string, CngxErrorAggregatorSourceEntry>>(
    buildInitialSources(sources, labels),
    { equal: errorSourceMapEqual },
  );
  const scopeSignal = signal<CngxErrorScopeContract | null | undefined>(scope);

  const contract = createErrorAggregatorContract({
    sourcesState,
    scope: scopeSignal.asReadonly(),
  });

  if (name) {
    const registry = inject(CngxErrorRegistry, { optional: true });
    if (registry) {
      const destroyRef = inject(DestroyRef);
      registry.registerAggregator(name, contract);
      destroyRef.onDestroy(() => registry.unregisterAggregator(name));
    }
  }

  return contract;
}

function buildInitialSources(
  sources: Record<string, Signal<boolean>> | undefined,
  labels: Record<string, string> | undefined,
): ReadonlyMap<string, CngxErrorAggregatorSourceEntry> {
  if (!sources) {
    return new Map();
  }
  const map = new Map<string, CngxErrorAggregatorSourceEntry>();
  for (const [key, condition] of Object.entries(sources)) {
    map.set(key, {
      key,
      condition,
      label: labels?.[key] ?? null,
    });
  }
  return map;
}
