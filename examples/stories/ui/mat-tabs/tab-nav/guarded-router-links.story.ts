import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMatTabNav: guarded router links',
  subtitle:
    "<code>cngxMatTabNav</code> on a <code>&lt;nav mat-tab-nav-bar&gt;</code> and <code>cngxMatTabLink</code> on each <code>&lt;a mat-tab-link&gt;</code> layer the cngx error and announcement surface onto Material's router tabs. A nav bar has no <code>MatTab</code> and no <code>selectedIndex</code> - the links are the tabs - so each link registers itself as a tab handle, and the error decoration lands on <code>.mat-mdc-tab-link</code>.",
  description:
    'This sandbox has no child routes, so a left-click writes the active index directly to stand in for the navigation, and leaving Profile while it has unsaved changes is refused exactly as a <code>CanDeactivate</code> guard would refuse it. In production you drop the <code>(click)</code> handler: each anchor is a <code>routerLink</code> with <code>routerLinkActive</code> feeding <code>[active]</code>, <code>[cngxTabsRouteSync]</code> on the same <code>&lt;nav&gt;</code> reflects the route-active link onto <code>activeIndex</code> (give each link an <code>id</code> equal to its route segment), and the router runs the guard natively - the bridge installs no commit action. The Profile link binds <code>[errorAggregator]</code> to an aggregator driven by the unsaved flag, so while changes are pending the link gains the <code>cngx-mat-tab--has-errors</code> badge and an SR-only descriptor referenced through <code>aria-describedby</code>. Each change of the active link is spoken through the shared polite live region; the initial active link at mount is not announced.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'error-handling', 'a11y-pattern'],
  apiComponents: ['CngxMatTabNav', 'CngxMatTabLink', 'CngxTabsRouteSync'],
  moduleImports: [
    "import { MatTabsModule } from '@angular/material/tabs';",
    "import { injectErrorAggregator } from '@cngx/common/interactive';",
    "import { CngxMatTabLink, CngxMatTabNav } from '@cngx/ui/mat-tabs';",
  ],
  imports: ['MatTabsModule', 'CngxMatTabNav', 'CngxMatTabLink'],
  references: [
    {
      label: 'Angular Router: `CanDeactivateFn` guard',
      href: 'https://angular.dev/api/router/CanDeactivateFn',
    },
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly unsaved = signal(false);
  // Set when a leave is refused, so the readout can show the block.
  protected readonly blocked = signal(false);

  // Reveals while the Profile page holds unsaved changes, lighting the
  // Profile link's badge and descriptor.
  protected readonly profileErrors = injectErrorAggregator(
    undefined,
    { unsaved: computed(() => this.unsaved()) },
    undefined,
    { unsaved: 'Unsaved changes - resolve before leaving' },
  );

  /**
   * Stands in for routerLink + the Profile route's CanDeactivate guard.
   * Leaving Profile (index 1) while unsaved is refused, so the active
   * link stays put. Production drops this handler.
   */
  protected navigate(event: MouseEvent, index: number): void {
    event.preventDefault();
    if (this.active() === 1 && index !== 1 && this.unsaved()) {
      this.blocked.set(true);
      return;
    }
    this.blocked.set(false);
    this.active.set(index);
  }`,
  template: `
  <nav
    mat-tab-nav-bar
    cngxMatTabNav
    [(activeIndex)]="active"
    [tabPanel]="tabPanel"
    aria-label="Routed account navigation"
  >
    <a
      mat-tab-link
      cngxMatTabLink
      id="overview"
      label="Overview"
      href="#/overview"
      [active]="active() === 0"
      (click)="navigate($event, 0)"
    >
      Overview
    </a>
    <a
      mat-tab-link
      cngxMatTabLink
      id="profile"
      label="Profile"
      href="#/profile"
      [errorAggregator]="profileErrors"
      [active]="active() === 1"
      (click)="navigate($event, 1)"
    >
      Profile
    </a>
    <a
      mat-tab-link
      cngxMatTabLink
      id="settings"
      label="Settings"
      href="#/settings"
      [active]="active() === 2"
      (click)="navigate($event, 2)"
    >
      Settings
    </a>
  </nav>

  <mat-tab-nav-panel #tabPanel>
    <div style="padding:12px">
      @switch (active()) {
        @case (0) {
          <p>Each link is a real anchor, so middle-click and open-in-new-tab keep working.</p>
        }
        @case (1) {
          <label style="display:flex; gap:8px; align-items:center">
            <input
              type="checkbox"
              [checked]="unsaved()"
              (change)="unsaved.set($any($event.target).checked)"
            />
            I have unsaved changes
          </label>
        }
        @case (2) {
          <p>Nothing to guard here - this link leaves freely.</p>
        }
      }
    </div>
  </mat-tab-nav-panel>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Open Profile and check "I have unsaved changes": the Profile link shows its
    error badge. Now try another link - the leave is refused and Profile stays
    active. Uncheck to leave freely.
  </p>`,
  setupChrome: `
  protected readonly activeId = computed(
    () => ['overview', 'profile', 'settings'][this.active()],
  );`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">activeIndex</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Active id</span><span class="event-value">{{ activeId() }}</span></div>
    <div class="event-row"><span class="event-label">unsaved()</span><span class="event-value">{{ unsaved() }}</span></div>
    <div class="event-row"><span class="event-label">Leave blocked</span><span class="event-value">{{ blocked() }}</span></div>
  </div>`,
};
