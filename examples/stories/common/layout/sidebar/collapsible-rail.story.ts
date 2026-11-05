import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidebar: Collapsible rail',
  subtitle:
    '<code>[cngxSidebar]</code> collapses to an icon rail. Each entry shows its label as a tooltip on hover and focus; resting the pointer on the rail peeks the full sidebar over the content without reflow, and the pin button toggles it between pinned and peeked.',
  description:
    'A navigation sidebar that starts collapsed as a rail. The entries are CngxNavLink anchors with an icon and a label; in the rail the label is hidden visually but stays the accessible name, and a CngxTooltip shows it on hover and focus. Resting the pointer on the rail peeks the sidebar at full size over the content: the content column keeps its position because the reserved space stays at the rail size. While peeked, the pin button calls pin() and the sidebar stays expanded. The same button stays in place while expanded and reports aria-pressed; pressing it again collapses the sidebar back into a peek, so the focused button never disappears. Escape on it moves focus to the panel trigger before the peek ends. The head rows of the sidebar and the content column keep one fixed height in every state. Escape, moving focus out or leaving with the pointer ends the peek. The [cngxPanelTrigger] at the top of the content column toggles collapsed and carries aria-expanded and aria-controls. Collapsed as hidden, the sidebar reserves no space and is inert and aria-hidden until expanded.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxSidebar', 'CngxPanelTrigger'],
  moduleImports: [
    "import { CngxPanelTrigger, CngxSidebar } from '@cngx/common/layout';",
    "import { CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { CngxTooltip } from '@cngx/common/popover';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxSidebar',
    'CngxPanelTrigger',
    'CngxNavLink',
    'CngxIconButton',
    'CngxAvatar',
    'CngxIcon',
    'CngxTooltip',
    'MatIconModule',
  ],
  setup: `
  protected readonly collapsed = signal(true);
  protected readonly collapsedAs = signal<'rail' | 'hidden'>('rail');
  protected readonly links = [
    { label: 'Dashboard', icon: 'dashboard' },
    { label: 'Projects', icon: 'folder' },
    { label: 'Reports', icon: 'bar_chart' },
    { label: 'Settings', icon: 'settings' },
  ];
  protected readonly current = signal('Dashboard');

  // Pinned, the same button unpins: the sidebar collapses back into a peek,
  // so the focused button stays rendered until focus leaves the sidebar.
  protected togglePin(sidebar: CngxSidebar): void {
    if (sidebar.collapsed()) {
      sidebar.pin();
      return;
    }
    sidebar.collapsed.set(true);
    sidebar.peek();
  }

  // Escape ends a peek and with it the pin button. Hand focus to the panel
  // trigger first so it never drops to the document body.
  protected handlePinEscape(event: Event, sidebar: CngxSidebar): void {
    if (!sidebar.peeked() || !(event.target instanceof HTMLElement)) {
      return;
    }
    const frame = event.target.closest('.demo-app-frame');
    frame?.querySelector<HTMLElement>('[aria-controls="' + sidebar.id() + '"]')?.focus();
  }

  protected go(event: Event, label: string): void {
    event.preventDefault();
    this.current.set(label);
  }`,
  template: `
  <div class="demo-drawer-container demo-drawer-container--bordered demo-app-frame demo-app-frame--row">
    <nav cngxSidebar #sidebar="cngxSidebar" id="rail-sidebar" [role]="null" label="Main"
         [(collapsed)]="collapsed" [collapsedAs]="collapsedAs()" [expandDelay]="450"
         class="demo-app-sidebar">
      <div class="demo-app-sidebar__head">
        <cngx-avatar initials="A" shape="square" size="sm" />
        <span class="demo-app-brand demo-app-sidebar__label">Acme</span>
        @if (sidebar.expanded()) {
          <span class="demo-app-spacer"></span>
          <button type="button" cngxIconButton aria-label="Keep sidebar open"
                  [attr.aria-pressed]="!sidebar.collapsed()"
                  (click)="togglePin(sidebar)" (keydown.escape)="handlePinEscape($event, sidebar)">
            <cngx-icon size="sm"><mat-icon>push_pin</mat-icon></cngx-icon>
          </button>
        }
      </div>
      <div class="demo-app-sidebar__nav">
        @for (link of links; track link.label) {
          <a cngxNavLink href="#" class="demo-nav__link demo-nav__link--icon"
             [active]="current() === link.label"
             [class.demo-nav__link--active]="current() === link.label"
             [cngxTooltip]="link.label" tooltipPlacement="right" [enabled]="!sidebar.expanded()"
             (click)="go($event, link.label)">
            <cngx-icon size="sm"><mat-icon>{{ link.icon }}</mat-icon></cngx-icon>
            <span class="demo-app-sidebar__label">{{ link.label }}</span>
          </a>
        }
      </div>
      <div class="demo-app-sidebar__foot">
        <cngx-avatar initials="JD" size="sm" />
        <span class="demo-app-sidebar__label">Jane Doe</span>
      </div>
    </nav>

    <div class="demo-app-column">
      <div class="demo-app-header">
        <button type="button" cngxIconButton [cngxPanelTrigger]="sidebar" label="Main sidebar">
          <cngx-icon><mat-icon>{{ sidebar.expanded() ? 'menu_open' : 'menu' }}</mat-icon></cngx-icon>
        </button>
        <span class="demo-app-brand">{{ current() }}</span>
      </div>
      <main class="demo-drawer-main demo-app-main">
        <p>Content column. Its start edge follows the reserved space, not the peek.</p>
      </main>
    </div>
  </div>`,
  setupChrome: `
  protected readonly rests: ('rail' | 'hidden')[] = ['rail', 'hidden'];`,
  templateChrome: `
  <div class="filter-row" role="group" aria-label="Collapsed as" style="margin-top: 12px">
    @for (r of rests; track r) {
      <button type="button" class="chip" [attr.aria-pressed]="collapsedAs() === r"
              (click)="collapsedAs.set(r)">{{ r }}</button>
    }
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">collapsed()</span>
      <span class="event-value">{{ collapsed() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">sidebar.state()</span>
      <span class="event-value">{{ sidebar.state() }}</span>
    </div>
  </div>`,
};
