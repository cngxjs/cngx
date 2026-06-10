import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterOutlet } from '@angular/router';

import { CngxTabsRouteSync, type CngxTabHandle } from '@cngx/common/tabs';
import { CngxMatTabs } from '@cngx/ui/mat-tabs';

// Re-export forces compodocx to ship app.config.ts (and, transitively,
// demo-routes.ts) in the StackBlitz manifest - the router lives there.
export { appConfig } from './app.config';

/**
 * Routed `<mat-tab-group>` - the Material skin gates a `<router-outlet>`
 * through the *same* `[cngxTabsRouteSync]` brain as the cngx organism.
 *
 * `cngxMatTabs` instruments a vanilla `<mat-tab-group>`; adding
 * `cngxTabsRouteSync` makes every tab switch a router navigation, gated
 * by the presenter's commit lifecycle. The bridge's
 * `activeIndex <-> selectedIndex` sync reads the *committed* index, so a
 * guard-cancelled route never pushes `selectedIndex` forward before
 * `NavigationEnd` - the cancelled switch leaves both unmoved.
 *
 * - **CanDeactivate gating.** Check "I have unsaved changes" on the
 *   Profile tab, then click another tab: the guard refuses, the route is
 *   cancelled, the Material header snaps back, and the rejection
 *   decoration (cross icon + SR announcement) projects onto
 *   `.mat-mdc-tab`.
 * - **Custom `routeFor`.** Material auto-assigns tab handle ids, so the
 *   route mapping keys off each tab's label instead of its id.
 * - **External navigation.** Back/forward and direct URL edits reflect
 *   into the active tab without re-navigating.
 *
 * Gating behaviour is identical to the cngx organism - same brain, two
 * skins.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [MatTabsModule, CngxMatTabs, CngxTabsRouteSync, RouterOutlet],
  styleUrls: ['./routed-outlet.component.css'],
  template: `
    <p style="opacity: 0.8; font-size: 0.875rem">
      A <code>&lt;mat-tab-group cngxMatTabs cngxTabsRouteSync&gt;</code> over a
      <code>&lt;router-outlet&gt;</code>. The Profile route guards its exit while "unsaved changes"
      is on - identical gating to the cngx organism.
    </p>

    <mat-tab-group
      cngxMatTabs
      cngxTabsRouteSync
      [routeFor]="routeForLabel"
      aria-label="Routed account tabs"
    >
      <mat-tab label="Overview"></mat-tab>
      <mat-tab label="Profile"></mat-tab>
      <mat-tab label="Settings"></mat-tab>
    </mat-tab-group>

    <div class="routed-demo__outlet">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class MatRoutedOutletExample {
  /**
   * Material assigns tab handle ids automatically, so map the route off
   * the tab label instead of the default `(h) => [h.id]`.
   */
  protected readonly routeForLabel = (handle: CngxTabHandle): unknown[] => [
    (handle.label() ?? '').toLowerCase(),
  ];
}
