import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: auto mode',
  subtitle:
    'Nothing is bound. <code>mode</code> defaults to <code>auto</code>, so the rail docks beside the content once the layout reaches <code>64rem</code> and overlays it below. Drag the right edge across the threshold.',
  description:
    'The docking threshold lives in one place: a <code>@container cngx-sidenav-layout</code> rule in <code>sidenav-layout.css</code> that writes <code>--cngx-sidenav-layout-wide</code> on the rail. The component reads that resolved value through <code>CngxContainer.property()</code> and derives <code>effectiveMode()</code> from it in a single <code>computed()</code> - it never re-evaluates the condition in TypeScript, so overriding the CSS rule moves the breakpoint for both. The rule targets the rail rather than the layout because a container query resolves against an ancestor container, never against the container itself. The switch needs no announcement: it flips aria-modal, the focus trap and the backdrop, and the side-to-over transition auto-opens the rail so focus inside it is never orphaned.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition', 'a11y-pattern'],
  apiComponents: ['CngxSidenav', 'CngxSidenavLayout', 'CngxSidenavContent'],
  moduleImports: [
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent } from '@cngx/ui';",
    "import { CngxNavLink } from '@cngx/common';",
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxNavLink'],
  setup: `protected readonly navOpen = signal(true);
  protected readonly nav = viewChild(CngxSidenav);`,
  setupChrome: `protected readonly pinned = signal(false);`,
  template: `  <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav__container--short">
    <cngx-sidenav position="start" [(opened)]="navOpen" [mode]="pinned() ? 'over' : 'auto'" width="180px">
      <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">Dashboard</a>
      <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">Orders</a>
      <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">Reports</a>
    </cngx-sidenav>

    <cngx-sidenav-content class="demo-sidenav__content--compact">
      <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">Content</h3>
      <p class="demo-sidenav__content-hint">
        Drag the right edge of the preview. Past 64rem of layout width the rail docks
        beside this text; below it the rail becomes an overlay with a backdrop.
      </p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
  templateChromeBefore: `<p class="demo-sidenav__content-hint" style="margin: 0 0 12px">
    Resize the preview pane (or the window) to cross the threshold.
  </p>`,
  templateChrome: `<div class="button-row" style="margin-top: 12px">
    <button class="sort-btn" type="button" (click)="navOpen.set(!navOpen())">
      {{ navOpen() ? 'Close' : 'Open' }}
    </button>
    <button class="sort-btn" type="button" (click)="pinned.set(!pinned())">
      {{ pinned() ? 'Back to auto' : 'Pin mode="over"' }}
    </button>
  </div>
<div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge active">mode: {{ pinned() ? 'over (pinned)' : 'auto' }}</span>
    <span class="status-badge active">effectiveMode: {{ nav()?.effectiveMode() }}</span>
    <span class="status-badge" [class.active]="navOpen()">{{ navOpen() ? 'opened' : 'closed' }}</span>
  </div>`,
};
