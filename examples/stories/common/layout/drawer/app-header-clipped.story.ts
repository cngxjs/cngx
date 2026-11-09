import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: App header, clipped drawer',
  subtitle:
    'The app header spans the full width and stays live; the drawer opens below it with <code>modality="contained"</code>, so the scrim, <code>inert</code> and the scroll lock stay inside the <code>[cngxDrawer]</code> host.',
  description:
    'A clipped navigation drawer, the layout of web apps with a top bar. The header sits outside the [cngxDrawer] host, the panel and the content row inside it. A contained panel makes only the content row inert and scrims it through the cngx-drawer class; the header is neither dimmed nor inert. The hamburger is a [cngxPanelToggle]: a modal over-drawer gets three bars while closed and a cross while open, and the button carries aria-expanded and aria-controls and closes the drawer again. Pressing another header control closes the drawer as an outside press and still runs that control. The panel keeps its navigation landmark instead of claiming aria-modal: focus moves into it on open, Tab can reach the header, and Escape closes the drawer and returns focus to the hamburger.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
  ],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent', 'CngxPanelToggle'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerContent, CngxDrawerPanel, CngxPanelToggle } from '@cngx/common/layout';",
    "import { CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
    'CngxPanelToggle',
    'CngxNavLink',
    'CngxIconButton',
    'CngxAvatar',
    'CngxIcon',
    'MatIconModule',
  ],
  setup: `
  protected readonly links = [
    { label: 'Dashboard', icon: 'dashboard' },
    { label: 'Projects', icon: 'folder' },
    { label: 'Reports', icon: 'bar_chart' },
    { label: 'Settings', icon: 'settings' },
  ];
  protected readonly current = signal('Dashboard');
  protected readonly rows = Array.from({ length: 10 }, (_, i) => i + 1);

  protected go(event: Event, label: string): void {
    event.preventDefault();
    this.current.set(label);
  }`,
  template: `
  <div class="demo-drawer-container demo-drawer-container--bordered demo-app-frame">
    <header class="demo-app-header">
      <button type="button" [cngxPanelToggle]="appNav" label="Main navigation"></button>
      <cngx-avatar initials="A" shape="square" size="sm" />
      <span class="demo-app-brand">Acme</span>
      <span class="demo-app-spacer"></span>
      <button type="button" cngxIconButton aria-label="Search">
        <cngx-icon><mat-icon>search</mat-icon></cngx-icon>
      </button>
      <button type="button" cngxIconButton aria-label="Notifications">
        <cngx-icon><mat-icon>notifications</mat-icon></cngx-icon>
      </button>
      <cngx-avatar initials="JD" size="sm" />
    </header>

    <div cngxDrawer #appNav="cngxDrawer" panelId="clipped-nav" class="cngx-drawer demo-app-body">
      <nav [cngxDrawerPanel]="appNav" modality="contained" [role]="null" aria-label="Main"
           class="demo-drawer-panel">
        @for (link of links; track link.label) {
          <a cngxNavLink href="#" class="demo-nav__link demo-nav__link--icon"
             [active]="current() === link.label"
             [class.demo-nav__link--active]="current() === link.label"
             (click)="go($event, link.label)">
            <cngx-icon size="sm"><mat-icon>{{ link.icon }}</mat-icon></cngx-icon>
            {{ link.label }}
          </a>
        }
      </nav>

      <main [cngxDrawerContent]="appNav" class="demo-drawer-main demo-app-main">
        <h2 class="demo-app-title">{{ current() }}</h2>
        @for (row of rows; track row) {
          <p>Content row {{ row }}. The row scrolls on its own; the header above it stays put.</p>
        }
      </main>
    </div>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">appNav.opened()</span>
      <span class="event-value">{{ appNav.opened() }}</span>
    </div>
  </div>`,
};
