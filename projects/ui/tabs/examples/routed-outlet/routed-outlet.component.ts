import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CngxTab, CngxTabsRouteSync } from '@cngx/common/tabs';
import { CngxTabGroup } from '@cngx/ui/tabs';

import { DemoFormState } from './demo-routes';

// Re-export forces compodocx to ship app.config.ts (and, transitively,
// demo-routes.ts) in the StackBlitz manifest - the router lives there.
export { appConfig } from './app.config';

/**
 * Routed tab group - tabs gate a `<router-outlet>` through the router.
 *
 * `[cngxTabsRouteSync]` on `<cngx-tab-group>` turns every tab switch into
 * an Angular navigation: clicking a tab runs `router.navigate([id])`, the
 * active tab follows the *resolved* route, and the presenter's existing
 * commit lifecycle is the gate - no new state machine.
 *
 * - **CanDeactivate gating.** The `profile` route guards its own exit.
 *   Check "I have unsaved changes", then click another tab: the guard
 *   refuses, the navigation is cancelled, the active tab stays on
 *   Profile, and the rejection decoration (the cross icon + an SR
 *   announcement) lights up - all for free from the commit lifecycle.
 * - **Direct `[error]` marker.** The Profile tab binds `[error]` to the
 *   shared unsaved signal, so the error badge shows *proactively* while
 *   changes are pending, before any switch is attempted.
 * - **External navigation.** Browser back/forward and direct URL edits
 *   reflect into the active tab without re-navigating.
 *
 * The tab strip drives the outlet; the group's own panel region is
 * hidden because the content is the route.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxTabGroup, CngxTab, CngxTabsRouteSync, RouterOutlet],
  styles: [
    `
      :host {
        display: block;
        max-width: 640px;
      }
      /* Routed content lives in the outlet, not the internal panels. */
      .routed-demo cngx-tab-group .cngx-tabs__panels {
        display: none;
      }
      .routed-demo__outlet {
        padding: 16px;
        border: 1px solid var(--cngx-color-border, #d4d4d8);
        border-top: none;
        border-radius: 0 0 8px 8px;
      }
    `,
  ],
  template: `
    <div class="routed-demo">
      <p style="opacity: 0.8; font-size: 0.875rem">
        A <code>&lt;cngx-tab-group cngxTabsRouteSync&gt;</code> over a
        <code>&lt;router-outlet&gt;</code>. The Profile route guards its
        exit while "unsaved changes" is on.
      </p>

      <cngx-tab-group cngxTabsRouteSync aria-label="Routed account tabs">
        <div cngxTab id="overview" label="Overview"></div>
        <div
          cngxTab
          id="profile"
          label="Profile"
          [error]="state.unsaved() ? 'Unsaved changes - resolve before leaving' : false"
        ></div>
        <div cngxTab id="settings" label="Settings"></div>
      </cngx-tab-group>

      <div class="routed-demo__outlet">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class RoutedOutletExample {
  protected readonly state = inject(DemoFormState);
}
