import { computed, Directive, inject, input, signal, type Signal } from '@angular/core';
import { CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from '../error-scope/error-scope.token';
import {
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
  type CngxErrorAggregatorSourceEntry,
} from './error-aggregator.token';

const ERROR_LABEL_JOINER = ', ';

/**
 * Aggregates one-or-more {@link CngxErrorSource} children into a single
 * live A11y surface.
 *
 * Each registered source contributes a key + a live `Signal<boolean>` +
 * an optional label. Derived signals (`hasError`, `errorCount`,
 * `activeErrors`, `errorLabels`, `shouldShow`, `announcement`) are
 * `computed()` with structural `equal` fns so unrelated re-emissions
 * upstream do not cascade through descendants.
 *
 * Consumers render the SR live region themselves to keep the directive
 * template-free:
 *
 * @example
 * ```html
 * <fieldset cngxErrorAggregator #agg="cngxErrorAggregator">
 *   <span cngxErrorSource="format" [when]="email().invalid()" label="Format"></span>
 *   <span cngxErrorSource="taken"  [when]="taken()"          label="Already used"></span>
 * </fieldset>
 * <span class="cngx-sr-only" aria-live="polite" aria-atomic="true">
 *   {{ agg.announcement() }}
 * </span>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxErrorAggregator]',
  standalone: true,
  exportAs: 'cngxErrorAggregator',
  providers: [
    { provide: CNGX_ERROR_AGGREGATOR, useExisting: CngxErrorAggregator },
  ],
  host: {
    '[class.cngx-error]': 'shouldShow()',
    '[attr.aria-invalid]': 'shouldShow() ? "true" : "false"',
  },
})
export class CngxErrorAggregator implements CngxErrorAggregatorContract {
  /** External scope override; falls back to ancestor `CNGX_ERROR_SCOPE`. */
  readonly scope = input<CngxErrorScopeContract | undefined>(undefined);

  /** Optional name; enables programmatic lookup once the registry ships (Phase 6b). */
  readonly aggregatorName = input<string | undefined>(undefined, {
    alias: 'cngxErrorAggregatorName',
  });

  private readonly ancestorScope = inject<CngxErrorScopeContract | null>(
    CNGX_ERROR_SCOPE,
    { optional: true },
  );

  private readonly sourcesState = signal<
    ReadonlyMap<string, CngxErrorAggregatorSourceEntry>
  >(new Map(), {
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
  });

  /** @internal — the resolved scope (input wins, else ancestor, else `null`). */
  protected readonly effectiveScope = computed<CngxErrorScopeContract | null>(
    () => this.scope() ?? this.ancestorScope,
  );

  readonly hasError: Signal<boolean> = computed(() => {
    for (const entry of this.sourcesState().values()) {
      if (entry.condition()) {
        return true;
      }
    }
    return false;
  });

  readonly errorCount: Signal<number> = computed(() => {
    let count = 0;
    for (const entry of this.sourcesState().values()) {
      if (entry.condition()) {
        count++;
      }
    }
    return count;
  });

  readonly activeErrors: Signal<readonly string[]> = computed(
    () => {
      const out: string[] = [];
      for (const [key, entry] of this.sourcesState()) {
        if (entry.condition()) {
          out.push(key);
        }
      }
      return out;
    },
    { equal: shallowReadonlyArrayEqual },
  );

  readonly errorLabels: Signal<readonly string[]> = computed(
    () => {
      const out: string[] = [];
      for (const entry of this.sourcesState().values()) {
        if (entry.condition() && entry.label) {
          out.push(entry.label);
        }
      }
      return out;
    },
    { equal: shallowReadonlyArrayEqual },
  );

  readonly shouldShow: Signal<boolean> = computed(() => {
    if (!this.hasError()) {
      return false;
    }
    const scope = this.effectiveScope();
    return scope ? scope.showErrors() : true;
  });

  readonly announcement: Signal<string> = computed(() =>
    this.shouldShow() ? this.errorLabels().join(ERROR_LABEL_JOINER) : '',
  );

  addSource(entry: CngxErrorAggregatorSourceEntry): void {
    const next = new Map(this.sourcesState());
    next.set(entry.key, entry);
    this.sourcesState.set(next);
  }

  removeSource(key: string): void {
    const current = this.sourcesState();
    if (!current.has(key)) {
      return;
    }
    const next = new Map(current);
    next.delete(key);
    this.sourcesState.set(next);
  }
}

function shallowReadonlyArrayEqual(
  a: readonly string[],
  b: readonly string[],
): boolean {
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
