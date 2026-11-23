import { computed, untracked, type Signal, type WritableSignal } from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';
import { memoize } from '@cngx/core/utils';
import type {
  CngxErrorAggregatorContract,
  CngxErrorAggregatorSourceEntry,
} from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { shallowReadonlyArrayEqual } from './equal-fns';

const ERROR_LIST_FORMAT_CACHE_LIMIT = 32;

/**
 * @internal - one `Intl.ListFormat` per locale for the announcement joiner.
 * The `unit` / `short` style joins without a conjunction in en-US
 * (`A, B, C`, identical to the former `', '` join); de-DE reads
 * `A, B und C`.
 */
const errorListFormatFor = memoize(
  (locale: string): Intl.ListFormat =>
    new Intl.ListFormat(locale, { type: 'unit', style: 'short' }),
  { cacheLimit: ERROR_LIST_FORMAT_CACHE_LIMIT },
);

/**
 * Inputs required to build the shared error-aggregator computed graph.
 *
 * Both consumers (`CngxErrorAggregator` directive, `injectErrorAggregator`
 * factory) own their own writable `sourcesState` signal - typically created
 * with `equal: errorSourceMapEqual` - and pass it in alongside a scope
 * signal that resolves to either an explicit override, the nearest
 * ancestor scope, or `null` (no scope, `shouldShow` collapses to
 * `hasError`).
 *
 * @internal
 */
export interface ErrorAggregatorContractDeps {
  /** Writable signal carrying the live source-entry map. */
  readonly sourcesState: WritableSignal<ReadonlyMap<string, CngxErrorAggregatorSourceEntry>>;
  /**
   * Reactive scope reference. `null` / `undefined` means no scope - in
   * that case `shouldShow` short-circuits to `hasError` directly.
   */
  readonly scope: Signal<CngxErrorScopeContract | null | undefined>;
  /** Locale of the announcement list joiner (`injectLocale()` at the call site). */
  readonly locale: Signal<string>;
}

/**
 * Builds the canonical error-aggregator computed graph (six derived
 * signals + `addSource`/`removeSource` mutators) over a caller-owned
 * source-entry signal and a caller-owned scope signal.
 *
 * A second source with a registered key replaces the first (last-wins) but
 * the first stays listed: when the owner is removed with its entry, the
 * newest listed entry takes the key back. Ownership compares `condition`
 * identity, because an equal map write is dropped and the stored entry
 * object can be an older one.
 *
 * Single source of truth for the aggregator surface: `CngxErrorAggregator`
 * (directive form, ARIA host bindings) and `injectErrorAggregator`
 * (programmatic form, no DOM host) both delegate to this helper so the
 * two CONTRACT surfaces stay field-for-field equivalent without manual
 * sync. Registry registration sits outside this equivalence: the directive
 * re-registers reactively when its name input changes, the factory's
 * static name registers once.
 *
 * Returns a fresh `CngxErrorAggregatorContract` each call - every
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

  // Entries replaced by a later source with the same key, oldest first. The
  // newest one re-surfaces when the current owner leaves (CNGX1020).
  const shadowed = new Map<string, CngxErrorAggregatorSourceEntry[]>();
  const setShadowed = (key: string, listed: CngxErrorAggregatorSourceEntry[]): void => {
    if (listed.length === 0) {
      shadowed.delete(key);
      return;
    }
    shadowed.set(key, listed);
  };

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

  // Live-region text: the locale is read untracked, so a locale flip never
  // re-speaks a shown announcement; the next error change speaks it.
  const announcement: Signal<string> = computed(() => {
    if (!shouldShow()) {
      return '';
    }
    const labels = errorLabels();
    return untracked(() => errorListFormatFor(deps.locale()).format(labels));
  });

  return {
    hasError,
    errorCount,
    activeErrors,
    errorLabels,
    shouldShow,
    announcement,
    addSource(entry) {
      const current = sourcesState();
      const owner = current.get(entry.key);
      if (
        typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        owner !== undefined &&
        owner.condition !== entry.condition
      ) {
        cngxDevWarn(
          'CNGX1020',
          `addSource(): an error source with key "${entry.key}" is already ` +
            'registered; the new entry replaces it (last-wins). Use unique keys per source.',
        );
      }
      const listed = (shadowed.get(entry.key) ?? []).filter(
        (e) => e.condition !== entry.condition,
      );
      if (owner !== undefined && owner.condition !== entry.condition) {
        listed.push(owner);
      }
      setShadowed(entry.key, listed);
      const next = new Map(current);
      next.set(entry.key, entry);
      sourcesState.set(next);
    },
    removeSource(key, entry) {
      const current = sourcesState();
      const owner = current.get(key);
      if (entry === undefined) {
        shadowed.delete(key);
      }
      if (entry !== undefined && owner?.condition !== entry.condition) {
        const listed = shadowed.get(key) ?? [];
        setShadowed(
          key,
          listed.filter((e) => e.condition !== entry.condition),
        );
        return;
      }
      if (owner === undefined) {
        return;
      }
      const next = new Map(current);
      const listed = shadowed.get(key) ?? [];
      const resurfaced = listed.pop();
      setShadowed(key, listed);
      if (resurfaced === undefined) {
        next.delete(key);
      } else {
        next.set(key, resurfaced);
      }
      sourcesState.set(next);
    },
  };
}
