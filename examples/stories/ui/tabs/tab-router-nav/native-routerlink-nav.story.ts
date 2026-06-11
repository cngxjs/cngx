import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabNav: native routerLink tabs gated by a CanDeactivate guard',
  subtitle:
    'A <code>&lt;cngx-tab-nav&gt;</code> is a <code>role="navigation"</code> landmark of real <code>&lt;a&gt;</code> links - not a <code>role="tablist"</code> of buttons. Each <code>[cngxTabLink]</code> is an anchor, so middle-click, open-in-new-tab and the hover URL work, and the router runs <code>CanDeactivate</code> natively. <code>[cngxTabsRouteSync]</code> reflects the route-active link onto the active index.',
  description:
    'This sandbox has no router, so a left-click writes the active index directly to stand in for the <code>NavigationEnd</code> that <code>[cngxTabsRouteSync]</code> would reflect; leaving Profile while unsaved is refused exactly as the route\'s <code>CanDeactivate</code> guard would refuse it. In production you drop the <code>(click)</code> handler entirely: each anchor is a <code>routerLink</code>, the <code>&lt;cngx-tab-nav cngxTabsRouteSync&gt;</code> sits over a <code>&lt;router-outlet&gt;</code>, and the child route carries <code>canDeactivate: [guard]</code> - the runnable StackBlitz playground on the API page wires exactly that. The Profile link binds <code>[error]</code> to the unsaved signal, so <code>aria-invalid</code> and the error glyph light up while changes are pending - the communication channel on the native path, where no commit lifecycle fires. The active link carries <code>aria-current="page"</code>, route-derived from a single source (Pillar 1).',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern', 'behavior'],
  apiComponents: ['CngxTabNav', 'CngxTabLink', 'CngxTabsRouteSync'],
  moduleImports: [
    "import { CngxTabLink } from '@cngx/common/tabs';",
    "import { CngxTabNav } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabNav', 'CngxTabLink'],
  references: [
    {
      label: 'Angular Router: `CanDeactivateFn` guard',
      href: 'https://angular.dev/api/router/CanDeactivateFn',
    },
    {
      label: 'WAI-ARIA: `aria-current`',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
    {
      label: 'MDN: the `<nav>` landmark',
      href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav',
    },
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly unsaved = signal(false);
  // Set when a leave is refused, so the readout can show the block; the
  // Profile link's own [error] already lights from unsaved().
  protected readonly blocked = signal(false);

  /**
   * Stands in for routerLink + the route's CanDeactivate guard. This
   * sandbox has no router, so a left-click writes activeIndex directly to
   * simulate the NavigationEnd that [cngxTabsRouteSync] reflects. Leaving
   * Profile (index 1) while unsaved is refused, exactly as the guard would
   * refuse it - the active link stays put. Production drops this handler:
   * each <a> is a routerLink and the router runs the guard natively.
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
  <cngx-tab-nav [(activeIndex)]="active" aria-label="Routed account navigation">
    <a cngxTabLink id="overview" label="Overview" href="#/overview" (click)="navigate($event, 0)">
      Overview
    </a>
    <a
      cngxTabLink
      id="profile"
      label="Profile"
      href="#/profile"
      [error]="unsaved() ? 'Unsaved changes - resolve before leaving' : false"
      (click)="navigate($event, 1)"
    >
      Profile
    </a>
    <a cngxTabLink id="settings" label="Settings" href="#/settings" (click)="navigate($event, 2)">
      Settings
    </a>
  </cngx-tab-nav>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Click a link to switch. Toggle "unsaved changes", then try to leave Profile:
    the guard refuses, the active link stays on Profile, and the link shows its
    error glyph. Middle-click any link to see the real anchor affordance - it is
    an <code>&lt;a href&gt;</code>, not a <code>&lt;button&gt;</code>.
  </p>`,
  setupChrome: `
  protected readonly activeId = computed(
    () => ['overview', 'profile', 'settings'][this.active()],
  );`,
  templateChrome: `
  <label style="display:flex; gap:8px; align-items:center; margin-top:12px">
    <input
      type="checkbox"
      [checked]="unsaved()"
      (change)="unsaved.set($any($event.target).checked)"
    />
    I have unsaved changes (on the Profile page)
  </label>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active index</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Active id</span><span class="event-value">{{ activeId() }}</span></div>
    <div class="event-row"><span class="event-label">unsaved()</span><span class="event-value">{{ unsaved() }}</span></div>
    <div class="event-row"><span class="event-label">leave blocked</span><span class="event-value">{{ blocked() }}</span></div>
  </div>`,
};
