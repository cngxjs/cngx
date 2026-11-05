import { InjectionToken, type OutputRef, type Signal } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxAsyncSettle } from './async-click.directive';

/**
 * The run a `cngxAsyncClick` publishes to the components it co-hosts. A
 * host reads it instead of the directive class, so another runner can
 * drive the same busy layer by providing the token.
 *
 * Status, error and last-updated travel inside `state`; nothing is
 * flattened into separate signals.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-run-state.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_ASYNC_RUN_STATE, CngxAsyncClick
 */
export interface CngxAsyncRunState {
  /** `true` while the action executes; the immediate truth. */
  readonly pending: Signal<boolean>;
  /** `true` while the busy visual should show (show delay and min-dwell applied). */
  readonly busyVisible: Signal<boolean>;
  /**
   * The runner's own busy override (`CngxAsyncClick`'s `[busy]`): an ARIA
   * hint for a run outside the click, folded into `aria-busy` next to
   * `pending`. It neither refuses clicks nor opens `busyVisible`.
   */
  readonly busy: Signal<boolean>;
  /** `false` while the runner refuses clicks through its own `[enabled]`. */
  readonly enabled: Signal<boolean>;
  /** Full `CngxAsyncState` view of the run lifecycle. */
  readonly state: CngxAsyncState<unknown>;
  /** Emits once per success or error settle. */
  readonly settled: OutputRef<CngxAsyncSettle>;
  /** Speaks `message` once through the runner's live region after the next render. */
  announce(message: string): void;
}

/**
 * DI token `CngxAsyncClick` provides (`useExisting`) on its own element
 * with its {@link CngxAsyncRunState}. A co-hosted component reads it with
 * `{ self: true }` (lazily, because the runner in turn reads the host's
 * `CNGX_HOST_INTERACTION_STATE`), never through the directive class.
 *
 * No `providedIn`, no default: an element without a runner has no run.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-run-state.token.ts
 * @since 0.1.0
 * @relatedTo CngxAsyncClick, CNGX_HOST_INTERACTION_STATE
 */
export const CNGX_ASYNC_RUN_STATE = new InjectionToken<CngxAsyncRunState>('CngxAsyncRunState');
