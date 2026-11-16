import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidebar: Clipped below the app header',
  subtitle:
    'A sidebar, not a drawer: the <code>[cngxSidebar]</code> is part of the layout and never blocks the page. A full-width app header carries the toggle and the brand; the sidebar is docked below it and collapses to a rail. The content reflows, nothing is dimmed.',
  description:
    'The clipped app layout with a docked sidebar instead of a drawer: the header spans the full width and carries a [cngxPanelToggle] with aria-expanded and aria-controls; a sidebar is an inline panel, so the toggle shows the panel glyph, whose chevron points away from the column while collapsed and toward it while expanded. Its name stays the same in both states; aria-expanded reports whether the sidebar is shown. The sidebar below it is part of the layout, never modal, so there is no scrim and nothing becomes inert; collapsing it to the rail moves the content start edge. In the rail <code>[cngxNavRailed]</code> crops the nav rows to their icons; the labels stay in the accessible name and show as a tooltip on hover and focus.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxSidebar', 'CngxPanelToggle'],
  moduleImports: [
    "import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';",
    "import { CngxNavIcon, CngxNavLink, CngxNavRailed } from '@cngx/common/interactive';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { CngxStack } from '@cngx/ui/layout';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxSidebar',
    'CngxPanelToggle',
    'CngxNavLink',
    'CngxNavIcon',
    'CngxNavRailed',
    'CngxIconButton',
    'CngxAvatar',
    'CngxIcon',
    'CngxStack',
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
  <cngx-stack gap="none">
    <cngx-stack direction="row" gap="sm"
                style="align-items: center; padding: var(--cngx-space-sm, 0.5rem) var(--cngx-space-md, 1rem); border-block-end: 1px solid var(--cngx-color-border)">
      <button type="button" [cngxPanelToggle]="docked" label="Main sidebar"></button>
      <cngx-avatar initials="A" shape="square" size="sm" />
      <strong style="flex: 1 1 auto">Acme</strong>
      <button type="button" cngxIconButton aria-label="Search">
        <cngx-icon><mat-icon>search</mat-icon></cngx-icon>
      </button>
      <cngx-avatar initials="JD" size="sm" />
    </cngx-stack>

    <cngx-stack direction="row" gap="none" style="flex: 1 1 auto; min-block-size: 0">
      <nav cngxSidebar #docked="cngxSidebar" id="clipped-sidebar" [(collapsed)]="collapsed"
           [expandOnHover]="false" [role]="null" label="Main" class="cngx-sidebar"
           style="--cngx-sidebar-rail-size: calc(var(--cngx-nav-railed-size) + var(--cngx-sidebar-border-width, 1px))"
           [cngxNavRailed]="docked.state() === 'rail'" [cngxNavRailedSide]="docked.side()">
        @for (link of links; track link.label) {
          <a cngxNavLink href="#" [active]="current() === link.label" (click)="go($event, link.label)">
            <cngx-icon cngxNavIcon size="sm"><mat-icon>{{ link.icon }}</mat-icon></cngx-icon>
            {{ link.label }}
          </a>
        }
        <a cngxNavLink href="#" style="margin-block-start: auto" (click)="go($event, 'Help')">
          <cngx-icon cngxNavIcon size="sm"><mat-icon>help</mat-icon></cngx-icon>
          Help
        </a>
      </nav>
      <div style="flex: 1 1 auto; min-inline-size: 0; padding: var(--cngx-space-md, 1rem)">
        <h2>{{ current() }}</h2>
        <p>Content row. Its start edge follows the sidebar width.</p>
      </div>
    </cngx-stack>
  </cngx-stack>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">collapsed()</span>
      <span class="event-value">{{ collapsed() }}</span>
    </div>
  </div>`,
};
