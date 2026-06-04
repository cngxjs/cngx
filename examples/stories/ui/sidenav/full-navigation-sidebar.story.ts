import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: full navigation sidebar',
  subtitle: 'Composing all nav atoms inside <code>cngx-sidenav</code>: <code>CngxNavLabel</code> for section headers, <code>CngxNavLink</code> with active state and badges, <code>CngxNavGroup</code> for collapsible accordion sections. Material theming via <code>sidenav-theme.scss</code> provides surface colors, borders, and density.',
  description: 'Full nav surface: section labels, active-state links with numeric and dot badges, two collapsible nav groups, and a footer. Mode toggle covers <code>over</code>, <code>push</code>, <code>side</code>, <code>mini</code>; <code>shortcut="mod+b"</code> wires the open toggle.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG - Disclosure', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/' },
  ],
  apiComponents: [
    'CngxSidenav',
    'CngxSidenavLayout',
    'CngxSidenavContent',
  ],
  moduleImports: [
    'import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter } from \'@cngx/ui\';',
    'import { CngxNavLink, CngxNavLabel, CngxNavGroup, CngxNavBadge } from \'@cngx/common\';',
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel', 'CngxNavGroup', 'CngxNavBadge'],
  setup: `protected readonly navOpen = signal(true);
  protected readonly navMode = signal<'over' | 'push' | 'side' | 'mini'>('side');
  protected readonly modes: ('over' | 'push' | 'side' | 'mini')[] = ['over', 'push', 'side', 'mini'];
  protected readonly activeLink = signal('/dashboard');
  protected readonly items = ['Order #1042', 'Order #1043', 'Order #1044', 'Order #1045'];`,
  template: `
  <div class="filter-row">
    <span class="filter-label">Mode:</span>
    @for (m of modes; track m) {
      <button type="button" class="chip" [attr.aria-pressed]="navMode() === m"
              (click)="navMode.set(m)">{{ m }}</button>
    }
    <button class="sort-btn" type="button" (click)="navOpen.set(!navOpen())">
      {{ navOpen() ? 'Close' : 'Open' }}
    </button>
  </div>

  <cngx-sidenav-layout class="demo-sidenav__container">
    <cngx-sidenav position="start" [(opened)]="navOpen" [mode]="navMode()" width="240px" [resizable]="true" shortcut="mod+b">
      <cngx-sidenav-header class="demo-sidenav__header">
        Workspace
      </cngx-sidenav-header>

      <span cngxNavLabel class="demo-sidenav__label">Main</span>

      <a cngxNavLink class="demo-sidenav__link" [class.demo-sidenav-active-link]="activeLink() === '/dashboard'"
         [active]="activeLink() === '/dashboard'"
         (click)="activeLink.set('/dashboard'); $event.preventDefault()">
        Dashboard
      </a>

      <a cngxNavLink class="demo-sidenav__link" [class.demo-sidenav-active-link]="activeLink() === '/inbox'"
         [active]="activeLink() === '/inbox'"
         (click)="activeLink.set('/inbox'); $event.preventDefault()">
        Inbox
        <span cngxNavBadge [value]="7" ariaLabel="7 unread" class="demo-sidenav__badge">7</span>
      </a>

      <a cngxNavLink class="demo-sidenav__link" [class.demo-sidenav-active-link]="activeLink() === '/calendar'"
         [active]="activeLink() === '/calendar'"
         (click)="activeLink.set('/calendar'); $event.preventDefault()">
        Calendar
        <span cngxNavBadge variant="dot" [value]="1" class="demo-sidenav__badge-dot"></span>
      </a>

      <span cngxNavLabel class="demo-sidenav__label">Manage</span>

      <button cngxNavGroup #settingsGroup="cngxNavGroup" [controls]="'settings-items'" id="settings-lbl"
              class="demo-sidenav__group" type="button">
        Settings
        <span class="demo-sidenav__chevron"
              [style.transform]="settingsGroup.disclosure.opened() ? 'rotate(90deg)' : ''">&#9654;</span>
      </button>
      <div class="cngx-nav-group-content" [class.cngx-nav-group-content--open]="settingsGroup.disclosure.opened()">
        <div id="settings-items" role="group" [attr.aria-labelledby]="'settings-lbl'">
          @for (sub of ['General', 'Security', 'Notifications', 'Billing']; track sub) {
            <a cngxNavLink [depth]="1" class="demo-sidenav__link--sub"
               [class.demo-sidenav-sub-active]="activeLink() === '/settings/' + sub.toLowerCase()"
               [active]="activeLink() === '/settings/' + sub.toLowerCase()"
               (click)="activeLink.set('/settings/' + sub.toLowerCase()); $event.preventDefault()">
              {{ sub }}
            </a>
          }
        </div>
      </div>

      <button cngxNavGroup #teamGroup="cngxNavGroup" [controls]="'team-items'" id="team-lbl"
              class="demo-sidenav__group" type="button">
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
        Mode: <strong>{{ navMode() }}</strong> -
        Click nav items to change the active state.
        Groups expand with <code>CngxNavGroup</code> + <code>CngxDisclosure</code>.
      </p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
};
