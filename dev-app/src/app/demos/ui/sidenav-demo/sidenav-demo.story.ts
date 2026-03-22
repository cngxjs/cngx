import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sidenav',
  description:
    'Declarative sidebar organism with Material theming, nav atoms (links, groups, badges, labels), dual sidebar support, and responsive mode switching.',
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

  <cngx-sidenav-layout style="height: 420px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; margin-top: 0.75rem; --cngx-nav-link-radius: 0; --cngx-nav-link-active-bg: transparent; --cngx-nav-link-active-color: inherit; --cngx-nav-link-active-font-weight: inherit;">
    <cngx-sidenav position="start" [(opened)]="navOpen" [mode]="navMode()" width="240px" [resizable]="true">
      <cngx-sidenav-header style="padding: 1rem; font-weight: 700; font-size: 1rem;">
        Workspace
      </cngx-sidenav-header>

      <span cngxNavLabel style="display: block; padding: 0.75rem 1rem 0.25rem; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted, #888);">
        Main
      </span>

      <a cngxNavLink [active]="activeLink() === '/dashboard'"
         (click)="activeLink.set('/dashboard'); $event.preventDefault()"
         style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.85rem; color: inherit; border-left: 3px solid transparent;"
         [style.border-left-color]="activeLink() === '/dashboard' ? '#f5a623' : 'transparent'"
         [style.background]="activeLink() === '/dashboard' ? 'rgba(245, 166, 35, 0.08)' : ''"
         [style.font-weight]="activeLink() === '/dashboard' ? '600' : '400'">
        Dashboard
      </a>

      <a cngxNavLink [active]="activeLink() === '/inbox'"
         (click)="activeLink.set('/inbox'); $event.preventDefault()"
         style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.85rem; color: inherit; border-left: 3px solid transparent;"
         [style.border-left-color]="activeLink() === '/inbox' ? '#f5a623' : 'transparent'"
         [style.background]="activeLink() === '/inbox' ? 'rgba(245, 166, 35, 0.08)' : ''"
         [style.font-weight]="activeLink() === '/inbox' ? '600' : '400'">
        Inbox
        <span cngxNavBadge [value]="7" ariaLabel="7 unread"
              style="background: #f5a623; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.1em 0.45em; border-radius: 10px; min-width: 1.1em; text-align: center;">
          7
        </span>
      </a>

      <a cngxNavLink [active]="activeLink() === '/calendar'"
         (click)="activeLink.set('/calendar'); $event.preventDefault()"
         style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.85rem; color: inherit; border-left: 3px solid transparent;"
         [style.border-left-color]="activeLink() === '/calendar' ? '#f5a623' : 'transparent'"
         [style.background]="activeLink() === '/calendar' ? 'rgba(245, 166, 35, 0.08)' : ''"
         [style.font-weight]="activeLink() === '/calendar' ? '600' : '400'">
        Calendar
        <span cngxNavBadge variant="dot" [value]="1"
              style="width: 7px; height: 7px; border-radius: 50%; background: var(--success-bg, #22c55e); flex-shrink: 0;">
        </span>
      </a>

      <span cngxNavLabel style="display: block; padding: 0.75rem 1rem 0.25rem; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted, #888);">
        Manage
      </span>

      <button cngxNavGroup #settingsGroup="cngxNavGroup" [controls]="'settings-items'" id="settings-lbl"
              style="width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-size: 0.85rem; color: inherit; display: flex; align-items: center; justify-content: space-between;">
        Settings
        <span style="font-size: 0.6rem; transition: transform 0.15s;"
              [style.transform]="settingsGroup.disclosure.opened() ? 'rotate(90deg)' : ''">&#9654;</span>
      </button>
      @if (settingsGroup.disclosure.opened()) {
        <div id="settings-items" role="group" [attr.aria-labelledby]="'settings-lbl'">
          @for (sub of ['General', 'Security', 'Notifications', 'Billing']; track sub) {
            <a cngxNavLink [depth]="1" [active]="activeLink() === '/settings/' + sub.toLowerCase()"
               (click)="activeLink.set('/settings/' + sub.toLowerCase()); $event.preventDefault()"
               style="display: block; padding: 0.4rem 1rem 0.4rem calc(1rem + 14px); text-decoration: none; font-size: 0.8rem; color: inherit;"
               [style.color]="activeLink() === '/settings/' + sub.toLowerCase() ? '#f5a623' : ''"
               [style.font-weight]="activeLink() === '/settings/' + sub.toLowerCase() ? '600' : '400'">
              {{ sub }}
            </a>
          }
        </div>
      }

      <button cngxNavGroup #teamGroup="cngxNavGroup" [controls]="'team-items'" id="team-lbl"
              style="width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-size: 0.85rem; color: inherit; display: flex; align-items: center; justify-content: space-between;">
        Team
        <span style="font-size: 0.6rem; transition: transform 0.15s;"
              [style.transform]="teamGroup.disclosure.opened() ? 'rotate(90deg)' : ''">&#9654;</span>
      </button>
      @if (teamGroup.disclosure.opened()) {
        <div id="team-items" role="group" [attr.aria-labelledby]="'team-lbl'">
          @for (sub of ['Members', 'Roles', 'Invites']; track sub) {
            <a cngxNavLink [depth]="1"
               style="display: block; padding: 0.4rem 1rem 0.4rem calc(1rem + 14px); text-decoration: none; font-size: 0.8rem; color: inherit;">
              {{ sub }}
            </a>
          }
        </div>
      }

      <cngx-sidenav-footer style="padding: 0.75rem 1rem; font-size: 0.7rem; color: var(--text-muted, #888);">
        Workspace v2.1
      </cngx-sidenav-footer>
    </cngx-sidenav>

    <cngx-sidenav-content style="padding: 1.25rem;">
      <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem;">{{ activeLink().substring(1) || 'Dashboard' }}</h3>
      <p style="color: var(--text-muted, #888); font-size: 0.85rem; margin: 0;">
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

  <cngx-sidenav-layout style="height: 320px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; margin-top: 0.75rem;">
    <cngx-sidenav position="start" [(opened)]="leftOpen" mode="push" width="160px">
      @for (item of ['Orders', 'Products', 'Customers', 'Reports']; track item) {
        <a cngxNavLink style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.85rem; color: inherit;">
          {{ item }}
        </a>
      }
    </cngx-sidenav>

    <cngx-sidenav-content style="padding: 1rem;">
      <h3 style="margin: 0 0 0.75rem; font-size: 1rem;">Orders</h3>
      @for (item of items; track item) {
        <div (click)="selectItem(item)" style="padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; border: 1px solid var(--border-color, #e0e0e0); border-radius: 4px; cursor: pointer; font-size: 0.85rem; transition: background 0.15s;"
             [style.background]="selectedItem() === item ? 'rgba(245, 166, 35, 0.08)' : ''"
             [style.border-color]="selectedItem() === item ? '#f5a623' : ''">
          {{ item }}
        </div>
      }
    </cngx-sidenav-content>

    <cngx-sidenav position="end" [(opened)]="rightOpen" mode="over" width="280px">
      <div style="padding: 1.25rem;">
        @if (selectedItem()) {
          <h3 style="margin: 0 0 0.5rem; font-size: 1rem;">{{ selectedItem() }}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted, #888); margin: 0 0 0.75rem;">
            Detail view for the selected order. Status, items, shipping info would go here.
          </p>
          <div style="display: flex; gap: 0.5rem;">
            <button class="sort-btn" (click)="rightOpen.set(false)">Close</button>
          </div>
        } @else {
          <p style="color: var(--text-muted, #888); font-size: 0.85rem;">Select an order to view details.</p>
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
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
    <!-- Light theme (M3 light via sidenav-theme.scss) -->
    <div>
      <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #888); margin-bottom: 0.5rem;">Light (M3)</div>
      <cngx-sidenav-layout style="height: 300px; border-radius: 6px; overflow: hidden;">
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
    <div data-theme="dark" style="background: var(--bg, #121212); color: var(--text-primary, #e0e0e0); border-radius: 6px;">
      <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #888); margin-bottom: 0.5rem; padding: 0.5rem 0.5rem 0;">Dark (M3)</div>
      <cngx-sidenav-layout style="height: 300px; border-radius: 6px; overflow: hidden;">
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
