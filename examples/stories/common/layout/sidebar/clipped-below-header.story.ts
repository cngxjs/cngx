import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidebar: Clipped below the app header',
  subtitle:
    'A full-width app header with the toggle and the brand; the <code>[cngxSidebar]</code> is docked below it and collapses to a rail. The content reflows, nothing is dimmed.',
  description:
    'The clipped app layout with a docked sidebar instead of a drawer: the header spans the full width and carries a [cngxPanelToggle] with aria-expanded and aria-controls; a sidebar is an inline panel, so the toggle shows the panel glyph, whose chevron points away from the column while collapsed and toward it while expanded, and the name says what a press does. The sidebar below it is part of the layout, never modal, so there is no scrim and nothing becomes inert; collapsing it to the rail moves the content start edge. In the rail the labels stay in the accessible name and show as a tooltip on hover and focus.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxSidebar', 'CngxPanelToggle'],
  moduleImports: [
    "import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';",
    "import { CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { CngxTooltip } from '@cngx/common/popover';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxSidebar',
    'CngxPanelToggle',
    'CngxNavLink',
    'CngxIconButton',
    'CngxAvatar',
    'CngxIcon',
    'CngxTooltip',
    'MatIconModule',
  ],
  setup: `
  protected readonly collapsed = signal(false);
  protected readonly links = [
    { label: 'Dashboard', icon: 'dashboard' },
    { label: 'Projects', icon: 'folder' },
    { label: 'Reports', icon: 'bar_chart' },
  ];
  protected readonly current = signal('Dashboard');

  protected go(event: Event, label: string): void {
    event.preventDefault();
    this.current.set(label);
  }`,
  template: `
  <div class="demo-drawer-container demo-drawer-container--bordered demo-app-frame">
    <header class="demo-app-header">
      <button type="button" [cngxPanelToggle]="docked" label="Main sidebar"></button>
      <cngx-avatar initials="A" shape="square" size="sm" />
      <span class="demo-app-brand">Acme</span>
      <span class="demo-app-spacer"></span>
      <button type="button" cngxIconButton aria-label="Search">
        <cngx-icon><mat-icon>search</mat-icon></cngx-icon>
      </button>
      <cngx-avatar initials="JD" size="sm" />
    </header>

    <div class="demo-app-body">
      <nav cngxSidebar #docked="cngxSidebar" id="clipped-sidebar" [(collapsed)]="collapsed"
           [expandOnHover]="false" [role]="null" label="Main" class="demo-app-sidebar">
        <div class="demo-app-sidebar__nav">
          @for (link of links; track link.label) {
            <a cngxNavLink href="#" class="demo-nav__link demo-nav__link--icon"
               [active]="current() === link.label"
               [class.demo-nav__link--active]="current() === link.label"
               [cngxTooltip]="link.label" tooltipPlacement="right" [enabled]="!docked.expanded()"
               (click)="go($event, link.label)">
              <cngx-icon size="sm"><mat-icon>{{ link.icon }}</mat-icon></cngx-icon>
              <span class="demo-app-sidebar__label">{{ link.label }}</span>
            </a>
          }
        </div>
        <div class="demo-app-sidebar__foot demo-app-sidebar__foot--links">
          <a cngxNavLink href="#" class="demo-nav__link demo-nav__link--icon"
             [cngxTooltip]="'Help'" tooltipPlacement="right" [enabled]="!docked.expanded()"
             (click)="go($event, 'Help')">
            <cngx-icon size="sm"><mat-icon>help</mat-icon></cngx-icon>
            <span class="demo-app-sidebar__label">Help</span>
          </a>
        </div>
      </nav>
      <main class="demo-drawer-main demo-app-main">
        <h2 class="demo-app-title">{{ current() }}</h2>
        <p>Content row. Its start edge follows the sidebar width.</p>
      </main>
    </div>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">collapsed()</span>
      <span class="event-value">{{ collapsed() }}</span>
    </div>
  </div>`,
};
