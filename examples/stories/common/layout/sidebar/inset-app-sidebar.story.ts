import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidebar: Inset app sidebar',
  subtitle:
    'A full-height <code>[cngxSidebar]</code> with the brand in its head, grouped navigation and the account in its foot. A <code>[cngxPanelTrigger]</code> at the top of the content column collapses it to an icon rail.',
  description:
    'The inset app layout: there is no global header, the brand lives in the sidebar and the sidebar toggle sits at the top of the content column. The navigation groups are CngxNavGroup disclosures that expand inline. Collapsed, the sidebar rests as a rail with the brand mark, one icon per entry and the avatar; the labels stay in the accessible name and show as a tooltip on hover and focus. Group entries are hidden in the rail until the rail flyout exists (planned for a later phase); expanding the sidebar shows them again.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  apiComponents: ['CngxSidebar', 'CngxPanelTrigger'],
  moduleImports: [
    "import { CngxPanelTrigger, CngxSidebar } from '@cngx/common/layout';",
    "import { CngxNavGroup, CngxNavLabel, CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { CngxTooltip } from '@cngx/common/popover';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxSidebar',
    'CngxPanelTrigger',
    'CngxNavGroup',
    'CngxNavLabel',
    'CngxNavLink',
    'CngxIconButton',
    'CngxAvatar',
    'CngxIcon',
    'CngxTooltip',
    'MatIconModule',
  ],
  setup: `
  protected readonly collapsed = signal(false);
  protected readonly groups = [
    { id: 'playground', label: 'Playground', icon: 'terminal', items: ['History', 'Starred', 'Settings'] },
    { id: 'models', label: 'Models', icon: 'hub', items: ['Overview', 'Fine-tuning'] },
    { id: 'docs', label: 'Documentation', icon: 'menu_book', items: ['Introduction', 'Tutorials'] },
  ];
  protected readonly current = signal('History');

  protected go(event: Event, label: string): void {
    event.preventDefault();
    this.current.set(label);
  }`,
  template: `
  <div class="demo-drawer-container demo-drawer-container--bordered demo-app-frame demo-app-frame--row">
    <nav cngxSidebar #appSidebar="cngxSidebar" id="inset-sidebar" [(collapsed)]="collapsed"
         [expandOnHover]="false" [role]="null" label="Main" class="demo-app-sidebar">
      <div class="demo-app-sidebar__head">
        <cngx-avatar initials="A" shape="square" size="sm" />
        <span class="demo-app-sidebar__meta demo-app-sidebar__label">
          <strong>Acme Inc</strong><small>Enterprise</small>
        </span>
      </div>

      <div class="demo-app-sidebar__nav">
        <span cngxNavLabel class="demo-nav__label">Platform</span>
        @for (group of groups; track group.id) {
          <button cngxNavGroup #navGroup="cngxNavGroup" type="button"
                  [id]="group.id + '-trigger'" [controls]="group.id + '-items'"
                  class="demo-nav__trigger demo-nav__link--icon"
                  [cngxTooltip]="group.label" tooltipPlacement="right"
                  [enabled]="!appSidebar.expanded()">
            <cngx-icon size="sm"><mat-icon>{{ group.icon }}</mat-icon></cngx-icon>
            <span class="demo-app-sidebar__label">{{ group.label }}</span>
            <span class="demo-nav__caret" aria-hidden="true"
                  [style.transform]="navGroup.disclosure.opened() ? 'rotate(90deg)' : null">&#9654;</span>
          </button>
          @if (navGroup.disclosure.opened() && appSidebar.expanded()) {
            <div [id]="group.id + '-items'" role="group" [attr.aria-labelledby]="group.id + '-trigger'">
              @for (item of group.items; track item) {
                <a cngxNavLink [depth]="1" href="#" class="demo-nav__link demo-nav__link--indent-1"
                   [active]="current() === item"
                   [class.demo-nav__link--active]="current() === item"
                   (click)="go($event, item)">{{ item }}</a>
              }
            </div>
          }
        }
      </div>

      <div class="demo-app-sidebar__foot">
        <cngx-avatar initials="JD" size="sm" />
        <span class="demo-app-sidebar__meta demo-app-sidebar__label">
          <strong>Jane Doe</strong><small>jane&#64;example.com</small>
        </span>
      </div>
    </nav>

    <div class="demo-app-column">
      <div class="demo-app-header">
        <button type="button" cngxIconButton [cngxPanelTrigger]="appSidebar" label="Main sidebar">
          <cngx-icon><mat-icon>{{ appSidebar.expanded() ? 'menu_open' : 'menu' }}</mat-icon></cngx-icon>
        </button>
        <span class="demo-app-brand">{{ current() }}</span>
      </div>
      <main class="demo-drawer-main demo-app-main">
        <p>Content column. It reflows when the sidebar collapses to the rail.</p>
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
