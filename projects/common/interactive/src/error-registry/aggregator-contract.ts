import { computed, type Signal, type WritableSignal } from '@angular/core';
import type {
  CngxErrorAggregatorContract,
  CngxErrorAggregatorSourceEntry,
} from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { shallowReadonlyArrayEqual } from './equal-fns';

const ERROR_LABEL_JOINER = ', ';

/**
 * Inputs required to build the shared error-aggregator computed graph.
 *
 * Both consumers (`CngxErrorAggregator` directive, `injectErrorAggregator`
 * factory) own their own writable `sourcesState` signal — typically created
 * with `equal: errorSourceMapEqual` — and pass it in alongside a scope
 * signal that resolves to either an explicit override, the nearest
 * ancestor scope, or `null` (no scope, `shouldShow` collapses to
 * `hasError`).
 *
 * @internal
 */
export interface ErrorAggregatorContractDeps {
  /** Writable signal carrying the live source-entry map. */
  readonly sourcesState: WritableSignal<
    ReadonlyMap<string, CngxErrorAggregatorSourceEntry>
  >;
  /**
   * Reactive scope reference. `null` / `undefined` means no scope — in
   * that case `shouldShow` short-circuits to `hasError` directly.
   */
  readonly scope: Signal<CngxErrorScopeContract | null | undefined>;
}

/**
 * Builds the canonical error-aggregator computed graph (six derived
 * signals + `addSource`/`removeSource` mutators) over a caller-owned
 * source-entry signal and a caller-owned scope signal.
 *
 * Single source of truth for the aggregator surface: `CngxErrorAggregator`
 * (directive form, ARIA host bindings) and `injectErrorAggregator`
 * (programmatic form, no DOM host) both delegate to this helper so the
 * two surfaces stay field-for-field equivalent without manual sync.
 *
 * Returns a fresh `CngxErrorAggregatorContract` each call — every
 * `computed` is freshly bound to the supplied `sourcesState`/`scope`
 * pair, so two callers with the same source signal get independent
 * computed instances (this is intentional: the directive's host
 * bindings and a co-located factory contract should not share computed
 * identity).
 *
 * @internal
 */
export function createErrorAggregatorContract(
  deps: ErrorAggregatorContractDeps,
): CngxErrorAggregatorContract {
  const { sourcesState, scope } = deps;

  const hasError: Signal<boolean> = computed(() => {
    for (const entry of sourcesState().values()) {
      if (entry.condition()) {
        return true;
      }
    }
    return false;
  });

  const errorCount: Signal<number> = computed(() => {
    let count = 0;
    for (const entry of sourcesState().values()) {
      if (entry.condition()) {
        count++;
      }
    }
    return count;
  });

  const activeErrors: Signal<readonly string[]> = computed(
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

  const errorLabels: Signal<readonly string[]> = computed(
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

  const shouldShow: Signal<boolean> = computed(() => {
    if (!hasError()) {
      return false;
    }
    const resolved = scope();
    return resolved ? resolved.showErrors() : true;
  });

  const announcement: Signal<string> = computed(() =>
    shouldShow() ? errorLabels().join(ERROR_LABEL_JOINER) : '',
  );

  return {
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
}
