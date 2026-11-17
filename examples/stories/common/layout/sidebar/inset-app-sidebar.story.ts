import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidebar: Inset app sidebar',
  subtitle:
    'An app shell assembled from a sidebar and the nav atoms; <code>cngx-sidenav</code> ships the same shell finished. A full-height <code>[cngxSidebar]</code> with the brand in its head, grouped navigation and the account in its foot. A <code>[cngxPanelToggle]</code> at the top of the content column collapses it to an icon rail.',
  description:
    'The inset app layout: there is no global header, the brand lives in the sidebar and the sidebar toggle sits at the top of the content column. The navigation groups are CngxNavGroup disclosures that expand inline. Collapsed, the sidebar rests as a rail: <code>[cngxNavRailed]</code> crops the rows to the brand mark, one icon per entry and the avatar, the labels stay in the accessible name and show as a tooltip on hover and focus, and an opened group shows its entries as a flyout beside its head. The rail width comes from <code>--cngx-nav-railed-size</code> plus the sidebar border, so the icons sit centred.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  apiComponents: ['CngxSidebar', 'CngxPanelToggle'],
  moduleImports: [
    "import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';",
    "import { CngxNavFooter, CngxNavGroup, CngxNavGroupContent, CngxNavHeader, CngxNavIcon, CngxNavLabel, CngxNavLink, CngxNavMark, CngxNavName, CngxNavRailed } from '@cngx/common/interactive';",
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { CngxStack } from '@cngx/ui/layout';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxSidebar',
    'CngxPanelToggle',
    'CngxNavHeader',
    'CngxNavFooter',
    'CngxNavMark',
    'CngxNavName',
    'CngxNavGroup',
    'CngxNavGroupContent',
    'CngxNavIcon',
    'CngxNavLabel',
    'CngxNavLink',
    'CngxNavRailed',
    'CngxAvatar',
    'CngxIcon',
    'CngxStack',
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
  <cngx-stack direction="row" gap="none">
    <nav cngxSidebar #appSidebar="cngxSidebar" id="inset-sidebar" [(collapsed)]="collapsed"
         [expandOnHover]="false" [role]="null" label="Main" class="cngx-sidebar"
         style="--cngx-sidebar-rail-size: calc(var(--cngx-nav-railed-size) + var(--cngx-sidebar-border-width, 1px))"
         [cngxNavRailed]="appSidebar.state() === 'rail'" [cngxNavRailedSide]="appSidebar.side()">
      <cngx-nav-header>
        <cngx-avatar cngxNavMark initials="A" shape="square" />
        <span cngxNavName>Acme Inc</span>
      </cngx-nav-header>

      <span cngxNavLabel>Platform</span>
      @for (group of groups; track group.id) {
        <button cngxNavGroup #navGroup="cngxNavGroup" type="button"
                [id]="group.id + '-trigger'" [controls]="group.id + '-items'">
          <cngx-icon cngxNavIcon size="sm"><mat-icon>{{ group.icon }}</mat-icon></cngx-icon>
          {{ group.label }}
        </button>
        <div [cngxNavGroupContent]="navGroup">
          <div [id]="group.id + '-items'" role="group" [attr.aria-labelledby]="group.id + '-trigger'">
            @for (item of group.items; track item) {
              <a cngxNavLink [depth]="1" href="#" [active]="current() === item"
                 (click)="go($event, item)">{{ item }}</a>
            }
          </div>
        </div>
      }

      <cngx-nav-footer>
        <cngx-avatar cngxNavMark initials="JD" />
        <span cngxNavName>Jane Doe</span>
      </cngx-nav-footer>
    </nav>

    <div style="flex: 1 1 auto; min-inline-size: 0; padding: var(--cngx-space-md, 1rem)">
      <button type="button" [cngxPanelToggle]="appSidebar" label="Main sidebar"></button>
      <h2>{{ current() }}</h2>
      <p>Content column. It reflows when the sidebar collapses to the rail.</p>
    </div>
  </cngx-stack>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">collapsed()</span>
      <span class="event-value">{{ collapsed() }}</span>
    </div>
  </div>`,
};
