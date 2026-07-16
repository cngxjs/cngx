import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * Minimal contract a sidenav rail exposes to collaborators (the router-sync
 * directive today; the layout's rail coordination is the documented second
 * consumer). Injected via {@link CNGX_SIDENAV} + `useExisting`, never by
 * injecting the concrete `CngxSidenav` class - that would create a cyclic type
 * dependency and block the decompose brain/skin split.
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export interface CngxSidenavContract {
  /** Two-way open state; a collaborator both reads and writes it. */
  readonly opened: ModelSignal<boolean>;
  /** Whether the rail is currently an overlay (`over` mode). */
  readonly isOverlay: Signal<boolean>;
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
