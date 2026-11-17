import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Full-height modal drawer',
  subtitle:
    'A drawer as a modal dialog over the whole app: it covers the app header and the content. The default <code>over</code> modality is <code>page</code>: a modal dialog with a focus trap and a scrim over the whole <code>[cngxDrawer]</code> host.',
  description:
    'A full-height navigation drawer, the modal drawer of mobile web apps. The header lives inside the [cngxDrawer] host, so the open panel and the scrim of the cngx-drawer class cover it. The panel becomes role="dialog" with aria-modal="true", traps focus and makes everything outside it inert. Because the hamburger is covered, the panel head repeats the brand and carries its own close button. Escape, the close button and a press on the scrim close the drawer; focus returns to the hamburger. Its twin, <em>CngxDrawer: Scroll lock and backdrop by hand</em>, wires <code>[cngxScrollLock]</code> and <code>[cngxBackdrop]</code> itself; this one needs neither, because a page-modal panel locks the scroll container above it and the skin paints the scrim.',
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
    "import { CngxNavIcon, CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { CngxStack } from '@cngx/ui/layout';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
    'CngxPanelToggle',
    'CngxNavLink',
    'CngxNavIcon',
    'CngxIconButton',
    'CngxAvatar',
    'CngxIcon',
    'CngxStack',
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
  <div cngxDrawer #fullNav="cngxDrawer" panelId="full-height-nav" class="cngx-drawer">
    <nav [cngxDrawerPanel]="fullNav" [role]="null" aria-label="Main">
      <cngx-stack direction="row" gap="sm" align="center" style="padding: var(--cngx-space-sm, 0.5rem) var(--cngx-space-md, 1rem); border-block-end: 1px solid var(--cngx-color-border)">
        <cngx-avatar initials="A" shape="square" size="sm" />
        <strong style="flex: 1 1 auto">Acme</strong>
        <button type="button" cngxIconButton aria-label="Close navigation" (click)="fullNav.close()">
          <cngx-icon><mat-icon>close</mat-icon></cngx-icon>
        </button>
      </cngx-stack>
      @for (link of links; track link.label) {
          <a cngxNavLink href="#" [active]="current() === link.label" (click)="go($event, link.label)">
            <cngx-icon cngxNavIcon size="sm"><mat-icon>{{ link.icon }}</mat-icon></cngx-icon>
            {{ link.label }}
          </a>
        }
    </nav>

    <cngx-stack gap="none" style="flex: 1 1 auto; min-inline-size: 0">
      <cngx-stack direction="row" gap="sm" align="center" style="padding: var(--cngx-space-sm, 0.5rem) var(--cngx-space-md, 1rem); border-block-end: 1px solid var(--cngx-color-border)">
        <button type="button" [cngxPanelToggle]="fullNav" label="Main navigation"></button>
        <cngx-avatar initials="A" shape="square" size="sm" />
        <strong style="flex: 1 1 auto">Acme</strong>
        <cngx-avatar initials="JD" size="sm" />
      </cngx-stack>

      <div [cngxDrawerContent]="fullNav" style="overflow-y: auto; padding: var(--cngx-space-md, 1rem)">
        <h2>{{ current() }}</h2>
        @for (row of rows; track row) {
          <p>Content row {{ row }}. The open drawer covers this row and the header.</p>
        }
      </div>
    </cngx-stack>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">fullNav.opened()</span>
      <span class="event-value">{{ fullNav.opened() }}</span>
    </div>
  </div>`,
};
