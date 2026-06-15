import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { CngxTab, type CngxTabGroupPresenter, CngxTabsRouteSync } from '@cngx/common/tabs';
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
 *   refuses, the navigation is cancelled, and the active tab stays on
 *   Profile.
 * - **The fault shows on the source, not the target.** A blocked *leave*
 *   is the Profile tab's problem, so the Profile tab binds `[error]` to the
 *   shared unsaved signal and shows the badge proactively. cngx also pins
 *   its generic rejection marker on the tab you *tried* to reach (the
 *   cancelled-navigation target) - the wrong tab for a leave guard - so
 *   this demo clears it on `NavigationCancel`. The clicked tab stays clean;
 *   only Profile signals.
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
        exit while "unsaved changes" is on - only the Profile tab signals.
      </p>

      <cngx-tab-group #tg="cngxTabGroup" cngxTabsRouteSync aria-label="Routed account tabs">
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
  private readonly router = inject(Router);
  private readonly group = viewChild<CngxTabGroupPresenter>('tg');

  constructor() {
    // A refused *leave* belongs to the Profile tab (its `[error]`), not to
    // the tab the user clicked. cngx pins its generic rejection marker on
    // the cancelled-navigation target; clear it after the presenter sets it
    // (queueMicrotask defers past the presenter's own NavigationCancel
    // handler) so the clicked tab never lights up red.
    this.router.events
      .pipe(
        filter((event): event is NavigationCancel => event instanceof NavigationCancel),
        takeUntilDestroyed(),
      )
      .subscribe(() => queueMicrotask(() => this.group()?.clearLastFailed()));
  }
}
