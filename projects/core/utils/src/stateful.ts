import { InjectionToken } from '@angular/core';

import type { CngxAsyncState } from './async-state';

/**
 * Minimal Contract for components that expose a primary async state.
 *
 * Declarative transition bridges (`CngxToastOn`, `CngxAlertOn`, `CngxBannerOn`)
 * auto-discover state via this interface through the `CNGX_STATEFUL` injection
 * token when no explicit `[state]` input is bound.
 *
 * @category state
 */
export interface CngxStateful<T = unknown> {
  readonly state: CngxAsyncState<T>;
}

/**
 * DI token for ancestor-/self-discoverable primary async state.
 *
 * Provided by stateful components (for example `CngxSelect.commitState` when
 * `[commitAction]` is set) so that declarative bridges can wire up without an
 * explicit `[state]` binding.
 *
 * Resolution precedence in bridges:
 * 1. Explicit `[state]` input on the bridge directive
 * 2. `inject(CNGX_STATEFUL, { optional: true })?.state`
 * 3. Dev-mode error if neither is available
 *
 * @category state
 */
export const CNGX_STATEFUL = new InjectionToken<CngxStateful>('CNGX_STATEFUL');
