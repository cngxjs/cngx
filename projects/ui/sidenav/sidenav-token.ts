import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';
import type { CngxDrawerModality } from '@cngx/common/layout';

/**
 * Contract a sidenav rail exposes to its collaborators: `CngxSidenavRouterSync`
 * reads and writes `opened`, `CngxSidenavLayout` coordinates its rails through
 * the rest. Injected via {@link CNGX_SIDENAV} + `useExisting`, never by
 * injecting the concrete `CngxSidenav` class - that would create a cyclic type
 * dependency and block the decompose brain/skin split.
 *
 * @since 0.1.0
 */
export interface CngxSidenavContract {
  /** Two-way open state of the overlay; the router sync both reads and writes it. */
  readonly opened: ModelSignal<boolean>;
  /** Logical edge of the rail. */
  readonly position: Signal<'start' | 'end'>;
  /** Element id of the rail. */
  readonly id: Signal<string>;
  /** Whether `opened` shows the rail as an overlay at the current width. */
  readonly isOverlay: Signal<boolean>;
  /** Whether the rail is an open overlay right now. */
  readonly overlayActive: Signal<boolean>;
  /** How far an open overlay takes over the page. */
  readonly modality: Signal<CngxDrawerModality>;
  /** Hides the full nav: closes the overlay or collapses a docked rail. */
  close(): void;
}

/**
 * Contract token for a sidenav rail. `CngxSidenav` provides it via
 * `{ provide: CNGX_SIDENAV, useExisting: CngxSidenav }`, so a collaborator
 * injects the narrow {@link CngxSidenavContract} instead of the concrete class.
 *
 * @since 0.1.0
 * @relatedTo CngxSidenav, CngxSidenavRouterSync
 */
export const CNGX_SIDENAV = new InjectionToken<CngxSidenavContract>('CNGX_SIDENAV');

/**
 * @internal What a rail asks of the surrounding `CngxSidenavLayout` in its open
 * path: at most one overlay is open per layout, so opening one closes the
 * others.
 */
export interface CngxSidenavLayoutCoordinator {
  /** Closes every other open overlay of the layout before `rail` opens. */
  overlayOpening(rail: CngxSidenavContract): void;
}

/** @internal Provided by `CngxSidenavLayout`; see {@link CngxSidenavLayoutCoordinator}. */
export const CNGX_SIDENAV_LAYOUT = new InjectionToken<CngxSidenavLayoutCoordinator>(
  'CNGX_SIDENAV_LAYOUT',
);
