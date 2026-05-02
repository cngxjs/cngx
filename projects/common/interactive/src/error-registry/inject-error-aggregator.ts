import { computed, DestroyRef, inject, signal, type Signal } from '@angular/core';
import type {
  CngxErrorAggregatorContract,
  CngxErrorAggregatorSourceEntry,
} from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { CngxErrorRegistry } from './error-registry';

const ERROR_LABEL_JOINER = ', ';

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
 * @param sources  Initial source map (`key` → boolean accessor; pass a
 *                 `Signal<boolean>` for reactive sources).
 * @param scope    Optional scope override; when omitted, `shouldShow`
 *                 collapses to `hasError`.
 * @param labels   Optional human-readable labels by source key, used in
 *                 `errorLabels` and `announcement`.
 *
 * Must be called in an injection context (constructor, factory provider,
 * `runInInjectionContext`).
 *
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 *
 * @category functions
 */
export function injectErrorAggregator(
  name?: string,
  sources?: Record<string, () => boolean>,
  scope?: CngxErrorScopeContract,
  labels?: Record<string, string>,
): CngxErrorAggregatorContract {
  const sourcesState = signal<ReadonlyMap<string, CngxErrorAggregatorSourceEntry>>(
    buildInitialSources(sources, labels),
    {
      equal: (a, b) => {
        if (a.size !== b.size) {
          return false;
        }
        for (const [key, entryA] of a) {
          const entryB = b.get(key);
          if (
            entryB?.condition !== entryA.condition ||
            (entryB.label ?? null) !== (entryA.label ?? null)
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );

  const hasError = computed(() => {
    for (const entry of sourcesState().values()) {
      if (entry.condition()) {
        return true;
      }
    }
    return false;
  });

  const errorCount = computed(() => {
    let n = 0;
    for (const entry of sourcesState().values()) {
      if (entry.condition()) {
        n++;
      }
    }
    return n;
  });

  const activeErrors = computed(
    () => {
      const out: string[] = [];
      for (const [key, entry] of sourcesState()) {
        if (entry.condition()) {
          out.push(key);
        }
      }
      return out;
    },
    { equal: shallowReadonlyArrayEqual },
  );

  const errorLabels = computed(
    () => {
      const out: string[] = [];
      for (const entry of sourcesState().values()) {
        if (entry.condition() && entry.label) {
          out.push(entry.label);
        }
      }
      return out;
    },
    { equal: shallowReadonlyArrayEqual },
  );

  const shouldShow = computed(() => {
    if (!hasError()) {
      return false;
    }
    return scope ? scope.showErrors() : true;
  });

  const announcement = computed(() =>
    shouldShow() ? errorLabels().join(ERROR_LABEL_JOINER) : '',
  );

  const contract: CngxErrorAggregatorContract = {
    hasError,
    errorCount,
    activeErrors,
    errorLabels,
    shouldShow,
    announcement,
    addSource(entry) {
      const next = new Map(sourcesState());
      next.set(entry.key, entry);
      sourcesState.set(next);
    },
    removeSource(key) {
      const current = sourcesState();
      if (!current.has(key)) {
        return;
      }
      const next = new Map(current);
      next.delete(key);
      sourcesState.set(next);
    },
  };

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
  sources: Record<string, () => boolean> | undefined,
  labels: Record<string, string> | undefined,
): ReadonlyMap<string, CngxErrorAggregatorSourceEntry> {
  if (!sources) {
    return new Map();
  }
  const map = new Map<string, CngxErrorAggregatorSourceEntry>();
  for (const [key, condition] of Object.entries(sources)) {
    map.set(key, {
      key,
      condition: condition as Signal<boolean>,
      label: labels?.[key] ?? null,
    });
  }
  return map;
}

function shallowReadonlyArrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
