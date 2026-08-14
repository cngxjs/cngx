import { computed, Directive, input } from '@angular/core';
import {
  CNGX_STATEFUL,
  createAggregateAsyncState,
  type CngxAsyncState,
  type CngxStateful,
} from '@cngx/core/utils';

/**
 * One keyed upstream source feeding a {@link CngxAsyncBoundary}.
 *
 * The `key` (and optional `label`) travel with the state so per-source
 * attribution never relies on a parallel index array (Pillar 1).
 *
 * @category common/data/async-state
 * @since 0.1.0
 */
export interface AggregateSource<T = unknown> {
  /** Stable identity for this source, used to key attribution and `@for`. */
  readonly key: string;
  /** Human-readable label for the source, surfaced in the failures list. */
  readonly label?: string;
  /** The upstream state this source contributes to the aggregate. */
  readonly state: CngxAsyncState<T>;
}

/**
 * One errored source, surfaced by {@link CngxAsyncBoundary.failures}.
 *
 * @category common/data/async-state
 * @since 0.1.0
 */
export interface AggregateFailure {
  /** The failing source's key. */
  readonly key: string;
  /** The failing source's label, if it declared one. */
  readonly label?: string;
  /** The raw error from that source. */
  readonly error: unknown;
}

/**
 * Headless boundary that aggregates N keyed `CngxAsyncState`s into one derived
 * `CngxAsyncState` and provides it as `CNGX_STATEFUL`.
 *
 * The aggregate `state` is a first-class `CngxAsyncState`, so it renders
 * through `<cngx-async-container [state]="b.state">` and every other consumer
 * unchanged, and any transition bridge (`cngxToastOn`, `cngxAlertOn`,
 * `cngxBannerOn`) nested in the host fires on the combined status with zero
 * `[state]` wiring. `failures` exposes the errored sources — keyed, so a
 * consumer's `@for` can render per-source attribution through any feedback
 * component. `state.error` stays the first error for the single-error path.
 *
 * ```html
 * <div [cngxAsyncBoundary]="sources" #b="cngxAsyncBoundary">
 *   <cngx-async-container [state]="b.state"> ... </cngx-async-container>
 *   <cngx-toast-on />
 *   @for (f of b.failures(); track f.key) {
 *     <cngx-banner>{{ f.label }} failed</cngx-banner>
 *   }
 * </div>
 * ```
 *
 * @category common/data/async-state
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/async-state/async-boundary.directive.ts
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxAsyncBoundary]',
  standalone: true,
  exportAs: 'cngxAsyncBoundary',
  providers: [{ provide: CNGX_STATEFUL, useExisting: CngxAsyncBoundary }],
  host: {
    '[attr.aria-busy]': 'state.isBusy() || null',
  },
})
export class CngxAsyncBoundary implements CngxStateful<readonly unknown[]> {
  /** The keyed source list to aggregate. */
  readonly sources = input.required<readonly AggregateSource[]>({ alias: 'cngxAsyncBoundary' });

  private readonly states = computed(() => this.sources().map((s) => s.state), {
    equal: (a, b) => a.length === b.length && a.every((s, i) => s === b[i]),
  });

  /** The derived aggregate state — also exposed via `CNGX_STATEFUL`. */
  readonly state = createAggregateAsyncState(this.states);

  /** The errored sources, keyed for per-source attribution. */
  readonly failures = computed<readonly AggregateFailure[]>(
    () =>
      this.sources()
        .filter((s) => s.state.status() === 'error')
        .map((s) => ({ key: s.key, label: s.label, error: s.state.error() })),
    {
      equal: (a, b) =>
        a.length === b.length &&
        a.every((f, i) => f.key === b[i].key && Object.is(f.error, b[i].error)),
    },
  );
}
