import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  signal,
} from '@angular/core';
import { createErrorAggregatorContract } from '../error-registry/aggregator-contract';
import { errorSourceMapEqual } from '../error-registry/equal-fns';
import { CngxErrorRegistry } from '../error-registry/error-registry';
import { CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from '../error-scope/error-scope.token';
import {
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
  type CngxErrorAggregatorSourceEntry,
} from './error-aggregator.token';

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

  /** Optional name; enables programmatic lookup via {@link CngxErrorRegistry}. */
  readonly aggregatorName = input<string | undefined>(undefined, {
    alias: 'cngxErrorAggregatorName',
  });

  private readonly ancestorScope = inject<CngxErrorScopeContract | null>(
    CNGX_ERROR_SCOPE,
    { optional: true },
  );

  private readonly sourcesState = signal<
    ReadonlyMap<string, CngxErrorAggregatorSourceEntry>
  >(new Map(), { equal: errorSourceMapEqual });

  /** @internal — the resolved scope (input wins, else ancestor, else `null`). */
  protected readonly effectiveScope = computed<CngxErrorScopeContract | null>(
    () => this.scope() ?? this.ancestorScope,
  );

  private readonly contract = createErrorAggregatorContract({
    sourcesState: this.sourcesState,
    scope: this.effectiveScope,
  });

  readonly hasError = this.contract.hasError;
  readonly errorCount = this.contract.errorCount;
  readonly activeErrors = this.contract.activeErrors;
  readonly errorLabels = this.contract.errorLabels;
  readonly shouldShow = this.contract.shouldShow;
  readonly announcement = this.contract.announcement;

  addSource(entry: CngxErrorAggregatorSourceEntry): void {
    this.contract.addSource(entry);
  }

  removeSource(key: string): void {
    this.contract.removeSource(key);
  }

  constructor() {
    const registry = inject(CngxErrorRegistry, { optional: true });
    if (!registry) {
      return;
    }
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const name = this.aggregatorName();
      if (!name) {
        return;
      }
      registry.registerAggregator(name, this);
      destroyRef.onDestroy(() => registry.unregisterAggregator(name));
    });
  }
}

