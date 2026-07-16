import { InjectionToken, type ModelSignal } from '@angular/core';

/**
 * Minimal contract a sidenav rail exposes to the router-sync directive: the
 * two-way `opened` signal it reads and writes. Injected via {@link CNGX_SIDENAV}
 * + `useExisting`, never by injecting the concrete `CngxSidenav` class - that
 * would create a cyclic type dependency and block the decompose brain/skin
 * split. The deferred layout-coordination consumer will broaden this contract
 * (with `close()` / `elementRef`) in the branch that migrates
 * `CngxSidenavLayout` onto the token.
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export interface CngxSidenavContract {
  /** Two-way open state; the directive both reads and writes it. */
  readonly opened: ModelSignal<boolean>;
}

/**
 * Contract token for a sidenav rail. `CngxSidenav` provides it via
 * `{ provide: CNGX_SIDENAV, useExisting: CngxSidenav }`, so a collaborator
 * injects the narrow {@link CngxSidenavContract} instead of the concrete class.
 *
 * @category ui/sidenav
 * @since 0.1.0
 * @relatedTo CngxSidenav, CngxSidenavRouterSync
 */
export const CNGX_SIDENAV = new InjectionToken<CngxSidenavContract>('CNGX_SIDENAV');
