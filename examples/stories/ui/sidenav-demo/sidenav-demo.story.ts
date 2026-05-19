import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sidenav',
  navLabel: 'Sidenav',
  description:
    'Declarative sidebar organism with Material theming, nav atoms (links, groups, badges, labels), dual sidebar support, and responsive mode switching.',
  apiComponents: ['CngxSidenav', 'CngxSidenavLayout', 'CngxSidenavContent'],
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  moduleImports: [
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter } from '@cngx/ui';",
    "import { CngxNavLink, CngxNavLabel, CngxNavGroup, CngxNavBadge } from '@cngx/common';",
  ],
  setup: `
  // Demo 1: Full nav
  protected readonly navOpen = signal(true);
  protected readonly navMode = signal<'over' | 'push' | 'side' | 'mini'>('side');
  protected readonly modes: ('over' | 'push' | 'side' | 'mini')[] = ['over', 'push', 'side', 'mini'];
  protected readonly activeLink = signal('/dashboard');

  // Demo 2: Dual sidebar
  protected readonly leftOpen = signal(true);
  protected readonly rightOpen = signal(false);
  protected readonly selectedItem = signal<string | null>(null);
  protected readonly items = ['Order #1042', 'Order #1043', 'Order #1044', 'Order #1045'];

  protected selectItem(item: string): void {
    this.selectedItem.set(item);
    this.rightOpen.set(true);
  }
  `,
  sections: [
    {
      title: 'Full Navigation Sidebar',
      subtitle:
        'Composing all nav atoms inside <code>cngx-sidenav</code>: ' +
        '<code>CngxNavLabel</code> for section headers, ' +
        '<code>CngxNavLink</code> with active state and badges, ' +
        '<code>CngxNavGroup</code> for collapsible accordion sections. ' +
        'Material theming via <code>sidenav-theme.scss</code> provides surface colors, borders, and density.',
      imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel', 'CngxNavGroup', 'CngxNavBadge'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Mode:</span>
    @for (m of modes; track m) {
      <button class="chip" [class.chip--active]="navMode() === m"
              (click)="navMode.set(m)">{{ m }}</button>
    }
    <button class="sort-btn" (click)="navOpen.set(!navOpen())">
      {{ navOpen() ? 'Close' : 'Open' }}
    </button>
  </div>

  <cngx-sidenav-layout class="demo-sidenav__container">
    <cngx-sidenav position="start" [(opened)]="navOpen" [mode]="navMode()" width="240px" [resizable]="true" shortcut="mod+b">
      <cngx-sidenav-header class="demo-sidenav__header">
        Workspace
      </cngx-sidenav-header>

      <span cngxNavLabel class="demo-sidenav__label">Main</span>

      <a cngxNavLink class="demo-sidenav__link" [active]="activeLink() === '/dashboard'"
         (click)="activeLink.set('/dashboard'); $event.preventDefault()"
         [style.border-left-color]="activeLink() === '/dashboard' ? 'var(--cngx-color-primary)' : 'transparent'"
         [style.background]="activeLink() === '/dashboard' ? 'color-mix(in oklch, var(--cngx-color-primary) 8%, transparent)' : ''"
         [style.font-weight]="activeLink() === '/dashboard' ? '600' : '400'">
        Dashboard
      </a>

      <a cngxNavLink class="demo-sidenav__link" [active]="activeLink() === '/inbox'"
         (click)="activeLink.set('/inbox'); $event.preventDefault()"
         [style.border-left-color]="activeLink() === '/inbox' ? 'var(--cngx-color-primary)' : 'transparent'"
         [style.background]="activeLink() === '/inbox' ? 'color-mix(in oklch, var(--cngx-color-primary) 8%, transparent)' : ''"
         [style.font-weight]="activeLink() === '/inbox' ? '600' : '400'">
        Inbox
        <span cngxNavBadge [value]="7" ariaLabel="7 unread" class="demo-sidenav__badge">7</span>
      </a>

      <a cngxNavLink class="demo-sidenav__link" [active]="activeLink() === '/calendar'"
         (click)="activeLink.set('/calendar'); $event.preventDefault()"
         [style.border-left-color]="activeLink() === '/calendar' ? 'var(--cngx-color-primary)' : 'transparent'"
         [style.background]="activeLink() === '/calendar' ? 'color-mix(in oklch, var(--cngx-color-primary) 8%, transparent)' : ''"
         [style.font-weight]="activeLink() === '/calendar' ? '600' : '400'">
        Calendar
        <span cngxNavBadge variant="dot" [value]="1" class="demo-sidenav__badge-dot"></span>
      </a>

      <span cngxNavLabel class="demo-sidenav__label">Manage</span>

      <button cngxNavGroup #settingsGroup="cngxNavGroup" [controls]="'settings-items'" id="settings-lbl"
              class="demo-sidenav__group">
        Settings
        <span class="demo-sidenav__chevron"
              [style.transform]="settingsGroup.disclosure.opened() ? 'rotate(90deg)' : ''">&#9654;</span>
      </button>
      <div class="cngx-nav-group-content" [class.cngx-nav-group-content--open]="settingsGroup.disclosure.opened()">
        <div id="settings-items" role="group" [attr.aria-labelledby]="'settings-lbl'">
          @for (sub of ['General', 'Security', 'Notifications', 'Billing']; track sub) {
            <a cngxNavLink [depth]="1" class="demo-sidenav__link--sub"
               [active]="activeLink() === '/settings/' + sub.toLowerCase()"
               (click)="activeLink.set('/settings/' + sub.toLowerCase()); $event.preventDefault()"
               [style.color]="activeLink() === '/settings/' + sub.toLowerCase() ? 'var(--cngx-color-primary)' : ''"
               [style.font-weight]="activeLink() === '/settings/' + sub.toLowerCase() ? '600' : '400'">
              {{ sub }}
            </a>
          }
        </div>
      </div>

      <button cngxNavGroup #teamGroup="cngxNavGroup" [controls]="'team-items'" id="team-lbl"
              class="demo-sidenav__group">
        Team
        <span class="demo-sidenav__chevron"
              [style.transform]="teamGroup.disclosure.opened() ? 'rotate(90deg)' : ''">&#9654;</span>
      </button>
      <div class="cngx-nav-group-content" [class.cngx-nav-group-content--open]="teamGroup.disclosure.opened()">
        <div id="team-items" role="group" [attr.aria-labelledby]="'team-lbl'">
          @for (sub of ['Members', 'Roles', 'Invites']; track sub) {
            <a cngxNavLink [depth]="1" class="demo-sidenav__link--sub">
              {{ sub }}
            </a>
          }
        </div>
      </div>

      <cngx-sidenav-footer class="demo-sidenav__footer">
        Workspace v2.1
      </cngx-sidenav-footer>
    </cngx-sidenav>

    <cngx-sidenav-content class="demo-sidenav__content">
      <h3 class="demo-sidenav__content-title">{{ activeLink().substring(1) || 'Dashboard' }}</h3>
      <p class="demo-sidenav__content-hint">
        Mode: <strong>{{ navMode() }}</strong> &mdash;
        Click nav items to change the active state.
        Groups expand with <code>CngxNavGroup</code> + <code>CngxDisclosure</code>.
      </p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
    },
    {
      title: 'Dual Sidebar -- Master/Detail',
      subtitle:
        'Left sidebar with permanent navigation (<code>push</code> mode). ' +
        'Right sidebar as an overlay detail panel that opens when clicking an item in the content area. ' +
        'Shared backdrop managed by <code>CngxSidenavLayout</code>.',
      imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxNavLink'],
      template: `
  <div class="button-row">
    <button class="sort-btn" (click)="leftOpen.set(!leftOpen())">
      Left: {{ leftOpen() ? 'open' : 'closed' }}
    </button>
    <button class="sort-btn" (click)="rightOpen.set(!rightOpen())">
      Right: {{ rightOpen() ? 'open' : 'closed' }}
    </button>
  </div>

  <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav__container--short">
    <cngx-sidenav position="start" [(opened)]="leftOpen" mode="push" width="160px">
      @for (item of ['Orders', 'Products', 'Customers', 'Reports']; track item) {
        <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">
          {{ item }}
        </a>
      }
    </cngx-sidenav>

    <cngx-sidenav-content class="demo-sidenav__content--compact">
      <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">Orders</h3>
      @for (item of items; track item) {
        <div class="demo-sidenav__order-item"
             [class.is-selected]="selectedItem() === item"
             (click)="selectItem(item)">
          {{ item }}
        </div>
      }
    </cngx-sidenav-content>

    <cngx-sidenav position="end" [(opened)]="rightOpen" mode="over" width="280px">
      <div class="demo-sidenav__detail-pad">
        @if (selectedItem()) {
          <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">{{ selectedItem() }}</h3>
          <p class="demo-sidenav__content-hint">
            Detail view for the selected order. Status, items, shipping info would go here.
          </p>
          <div class="demo-sidenav__detail-actions">
            <button class="sort-btn" (click)="rightOpen.set(false)">Close</button>
          </div>
        } @else {
          <p class="demo-sidenav__content-hint">Select an order to view details.</p>
        }
      </div>
    </cngx-sidenav>
  </cngx-sidenav-layout>

  <div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="leftOpen()">left: {{ leftOpen() ? 'open' : 'closed' }}</span>
    <span class="status-badge" [class.active]="rightOpen()">right: {{ rightOpen() ? 'open' : 'closed' }}</span>
    @if (selectedItem()) {
      <span class="status-badge active">selected: {{ selectedItem() }}</span>
    }
  </div>`,
    },
    {
      title: 'Material Theming -- Light vs Dark',
      subtitle:
        'Both panels use the real <code>sidenav-theme.scss</code> mixin applied via <code>styles.scss</code>. ' +
        'The right panel sets <code>data-theme="dark"</code> which activates the dark M3 color tokens. ' +
        'No inline overrides -- purely Material Design 3 system colors.',
      imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel'],
      template: `
  <div class="demo-sidenav__themes-grid">
    <!-- Light theme (M3 light via sidenav-theme.scss) -->
    <div>
      <div class="demo-sidenav__theme-label">Light (M3)</div>
      <cngx-sidenav-layout class="demo-sidenav__theme-panel">
        <cngx-sidenav position="start" [opened]="true" mode="side" width="170px">
          <cngx-sidenav-header>Workspace</cngx-sidenav-header>
          @for (item of ['Dashboard', 'Inbox', 'Calendar', 'Settings']; track item) {
            <a cngxNavLink [active]="item === 'Dashboard'">
              {{ item }}
            </a>
          }
          <cngx-sidenav-footer>v2.1</cngx-sidenav-footer>
        </cngx-sidenav>
        <cngx-sidenav-content style="padding: var(--cngx-sidenav-padding, 16px);">
          <p style="font-size: 0.8rem; margin: 0; opacity: 0.6;">M3 light surface tokens via <code>sidenav.theme($theme)</code>.</p>
        </cngx-sidenav-content>
      </cngx-sidenav-layout>
    </div>

    <!-- Dark theme (M3 dark via data-theme="dark") -->
    <div data-theme="dark" class="demo-sidenav__theme-panel--dark">
      <div class="demo-sidenav__theme-label demo-sidenav__theme-label--inset">Dark (M3)</div>
      <cngx-sidenav-layout class="demo-sidenav__theme-panel">
        <cngx-sidenav position="start" [opened]="true" mode="side" width="170px">
          <cngx-sidenav-header>Workspace</cngx-sidenav-header>
          @for (item of ['Dashboard', 'Inbox', 'Calendar', 'Settings']; track item) {
            <a cngxNavLink [active]="item === 'Dashboard'">
              {{ item }}
            </a>
          }
          <cngx-sidenav-footer>v2.1</cngx-sidenav-footer>
        </cngx-sidenav>
        <cngx-sidenav-content style="padding: var(--cngx-sidenav-padding, 16px);">
          <p style="font-size: 0.8rem; margin: 0; opacity: 0.6;">M3 dark surface tokens via <code>sidenav.theme($dark-theme)</code>.</p>
        </cngx-sidenav-content>
      </cngx-sidenav-layout>
    </div>
  </div>

  <pre class="code-block" style="margin-top: 1rem;"><code>@use '@angular/material' as mat;
@use '@cngx/ui/sidenav/sidenav-theme' as sidenav;

$theme: mat.define-theme((color: (primary: mat.$azure-palette)));
$dark:  mat.define-theme((color: (primary: mat.$azure-palette, theme-type: dark)));

html &#123;
  @include mat.all-component-themes($theme);
  @include sidenav.theme($theme);
&#125;

[data-theme='dark'] &#123;
  @include mat.all-component-colors($dark);
  @include sidenav.theme($dark);
&#125;</code></pre>`,
    },
  ],
};
