import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { CngxTabLink, CngxTabsRouteSync } from '@cngx/common/tabs';
import { CngxTabNav } from '@cngx/ui/tabs';

import { DemoFormState } from './demo-routes';

// Re-export forces compodocx to ship app.config.ts (and, transitively,
// demo-routes.ts) in the StackBlitz manifest - the router lives there.
export { appConfig } from './app.config';

/**
 * Native router tabs - a `<cngx-tab-nav>` of `<a cngxTabLink routerLink>`
 * anchors over a `<router-outlet>`.
 *
 * Unlike `<cngx-tab-group cngxTabsRouteSync>` (which navigates
 * programmatically through the presenter's commit lifecycle), the links
 * here are real anchors: the router runs `CanDeactivate` natively, and
 * middle-click / open-in-new-tab / hover-URL all work. `[cngxTabLink]`
 * registers each `<a>` as a tab handle (its `id` set to the route
 * segment); `[cngxTabsRouteSync]` reflects the route-active link onto the
 * active index - Ableitung statt Verwaltung, the route is the single
 * source.
 *
 * - **Native gating.** Each link is a `routerLink`, so the router runs
 *   `CanDeactivate` directly - no commit-action. Check "I have unsaved
 *   changes" on Profile, then click another link: the guard refuses, the
 *   navigation is cancelled, and `aria-current` stays on Profile.
 * - **Error marker.** The Profile link binds `[error]` to the shared
 *   unsaved signal, so `aria-invalid` + the error glyph light up while
 *   changes are pending - the communication channel on the native path,
 *   where no commit lifecycle fires.
 * - **External navigation.** Back/forward and direct URL edits move the
 *   active link through route-sync.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxTabNav, CngxTabLink, CngxTabsRouteSync, RouterLink, RouterOutlet],
  styleUrls: ['./routed-nav.component.css'],
  template: `
    <p style="opacity: 0.8; font-size: 0.875rem">
      A <code>&lt;cngx-tab-nav cngxTabsRouteSync&gt;</code> of
      <code>routerLink</code> anchors over a
      <code>&lt;router-outlet&gt;</code>. The Profile link guards its exit
      natively while "unsaved changes" is on.
    </p>

    <cngx-tab-nav cngxTabsRouteSync aria-label="Routed account navigation">
      <a cngxTabLink id="overview" label="Overview" routerLink="/overview">Overview</a>
      <a
        cngxTabLink
        id="profile"
        label="Profile"
        routerLink="/profile"
        [error]="state.unsaved() ? 'Unsaved changes - resolve before leaving' : false"
      >
        Profile
      </a>
      <a cngxTabLink id="settings" label="Settings" routerLink="/settings">Settings</a>
    </cngx-tab-nav>

    <div class="routed-nav-demo__outlet">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class RoutedNavExample {
  protected readonly state = inject(DemoFormState);
}
