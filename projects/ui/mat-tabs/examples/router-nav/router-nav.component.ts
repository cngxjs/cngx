import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { injectErrorAggregator } from '@cngx/common/interactive';
import { CngxTabsRouteSync } from '@cngx/common/tabs';
import { CngxMatTabLink, CngxMatTabNav } from '@cngx/ui/mat-tabs';

import { DemoFormState } from './demo-routes';

// Re-export forces compodocx to ship app.config.ts (and, transitively,
// demo-routes.ts) in the StackBlitz manifest - the router lives there.
export { appConfig } from './app.config';

/**
 * Native router tabs - `<nav mat-tab-nav-bar>` with `<a mat-tab-link>`
 * links, decorated by the cngx error / rejection / announcement layer.
 *
 * Unlike `<mat-tab-group>`, `mat-tab-nav-bar` has no `selectedIndex`: the
 * links *are* the tabs. `[cngxMatTabLink]` registers each `<a>` as a tab
 * handle (its `id` set to the route segment); `[cngxMatTabNav]` mounts
 * the live region and projects the decorations onto `.mat-mdc-tab-link`;
 * `[cngxTabsRouteSync]` reflects the route-active link onto the active
 * index. Ableitung statt Verwaltung - the route is the single source.
 *
 * - **Native gating.** Each link is a `routerLink`, so the router runs
 *   `CanDeactivate` directly - no commit-action. Check "I have unsaved
 *   changes" on Profile, then click another link: the guard refuses, the
 *   navigation is cancelled, and the active link stays put.
 * - **Error badge.** The Profile link binds `[errorAggregator]` to an
 *   aggregator driven by the shared unsaved signal, so the `!` badge
 *   lights up on `.mat-mdc-tab-link` while changes are pending - the
 *   communication channel on the native path, where no commit lifecycle
 *   fires.
 * - **External navigation.** Back/forward and direct URL edits move the
 *   active link through `RouterLinkActive` and route-sync.
 *
 * The cngx decoration CSS ships in the component stylesheet
 * (ViewEncapsulation.None) because the `@cngx/ui/mat-tabs` asset
 * stylesheet is not loaded by the StackBlitz scaffold.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatTabsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    CngxMatTabNav,
    CngxMatTabLink,
    CngxTabsRouteSync,
  ],
  styleUrls: ['./router-nav.component.css'],
  template: `
    <p style="opacity: 0.8; font-size: 0.875rem">
      A <code>&lt;nav mat-tab-nav-bar cngxMatTabNav cngxTabsRouteSync&gt;</code>
      of <code>routerLink</code> tabs over a
      <code>&lt;mat-tab-nav-panel&gt;</code>. The Profile link guards its
      exit natively while "unsaved changes" is on.
    </p>

    <nav
      mat-tab-nav-bar
      cngxMatTabNav
      cngxTabsRouteSync
      [tabPanel]="tabPanel"
      aria-label="Routed account navigation"
    >
      <a
        mat-tab-link
        cngxMatTabLink
        id="overview"
        label="Overview"
        routerLink="/overview"
        routerLinkActive
        #overviewLink="routerLinkActive"
        [active]="overviewLink.isActive"
      >
        Overview
      </a>
      <a
        mat-tab-link
        cngxMatTabLink
        id="profile"
        label="Profile"
        [errorAggregator]="profileErrors"
        routerLink="/profile"
        routerLinkActive
        #profileLink="routerLinkActive"
        [active]="profileLink.isActive"
      >
        Profile
      </a>
      <a
        mat-tab-link
        cngxMatTabLink
        id="settings"
        label="Settings"
        routerLink="/settings"
        routerLinkActive
        #settingsLink="routerLinkActive"
        [active]="settingsLink.isActive"
      >
        Settings
      </a>
    </nav>

    <mat-tab-nav-panel #tabPanel>
      <div class="router-nav-demo__panel">
        <router-outlet></router-outlet>
      </div>
    </mat-tab-nav-panel>
  `,
})
export class MatTabNavRouterExample {
  protected readonly state = inject(DemoFormState);

  /**
   * Error aggregator for the Profile link - reveals while the shared
   * unsaved signal is set, lighting the link's `!` badge.
   */
  protected readonly profileErrors = injectErrorAggregator(
    undefined,
    { unsaved: computed(() => this.state.unsaved()) },
    undefined,
    { unsaved: 'Unsaved changes - resolve before leaving' },
  );
}
