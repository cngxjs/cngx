import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Full-height modal drawer',
  subtitle:
    'The drawer covers the app header and the content. The default <code>over</code> modality is <code>page</code>: a modal dialog with a focus trap and a scrim over the whole <code>[cngxDrawer]</code> host.',
  description:
    'A full-height navigation drawer, the modal drawer of mobile web apps. The header lives inside the [cngxDrawer] host, so the open panel and the scrim of the cngx-drawer class cover it. The panel becomes role="dialog" with aria-modal="true", traps focus and makes everything outside it inert. Because the hamburger is covered, the panel head repeats the brand and carries its own close button. Escape, the close button and a press on the scrim close the drawer; focus returns to the hamburger.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Dialog (Modal) Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
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
  <div cngxDrawer #fullNav="cngxDrawer" panelId="full-height-nav"
       class="cngx-drawer demo-drawer-container demo-drawer-container--bordered demo-app-frame">
    <nav [cngxDrawerPanel]="fullNav" [role]="null" aria-label="Main" class="demo-drawer-panel">
      <div class="demo-app-header">
        <cngx-avatar initials="A" shape="square" size="sm" />
        <span class="demo-app-brand">Acme</span>
        <span class="demo-app-spacer"></span>
        <button type="button" cngxIconButton aria-label="Close navigation" (click)="fullNav.close()">
          <cngx-icon><mat-icon>close</mat-icon></cngx-icon>
        </button>
      </div>
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

    <header class="demo-app-header">
      <button type="button" [cngxPanelToggle]="fullNav" label="Main navigation"></button>
      <cngx-avatar initials="A" shape="square" size="sm" />
      <span class="demo-app-brand">Acme</span>
      <span class="demo-app-spacer"></span>
      <cngx-avatar initials="JD" size="sm" />
    </header>

    <main [cngxDrawerContent]="fullNav" class="demo-drawer-main demo-app-main">
      <h2 class="demo-app-title">{{ current() }}</h2>
      @for (row of rows; track row) {
        <p>Content row {{ row }}. The open drawer covers this row and the header.</p>
      }
    </main>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">fullNav.opened()</span>
      <span class="event-value">{{ fullNav.opened() }}</span>
    </div>
  </div>`,
};
