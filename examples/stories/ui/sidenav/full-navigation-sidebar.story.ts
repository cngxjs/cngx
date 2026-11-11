import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: full navigation sidebar',
  subtitle: 'Composing all nav atoms inside <code>cngx-sidenav</code>: <code>CngxNavLabel</code> for section headers, <code>CngxNavLink</code> with active state and badges, <code>CngxNavGroup</code> for collapsible accordion sections. The library paints the row states; Material theming via <code>sidenav-theme.scss</code> maps them onto M3 roles.',
  description: 'Full nav surface: section labels, active-state links with numeric and dot badges, two collapsible nav groups, and a footer. No <code>mode</code> is bound, so the rail follows the width class of its layout: docked beside the content from 64rem (<code>expanded</code>), where the toggle button and <code>shortcut="mod+b"</code> collapse it to an icon rail that peeks on hover; an icon rail with the full nav as an overlay from 48rem (<code>medium</code>); an overlay drawer below that (<code>compact</code>). The toggle is a <code>[cngxPanelTrigger]</code>, so its <code>aria-expanded</code> states the resting state and ignores a hover peek.',
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
    'import { CngxNavLink, CngxNavLabel, CngxNavGroup, CngxNavGroupContent, CngxNavBadge } from \'@cngx/common\';',
    'import { CngxPanelTrigger } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel', 'CngxNavGroup', 'CngxNavGroupContent', 'CngxNavBadge', 'CngxPanelTrigger'],
  setup: `protected readonly navOpen = signal(true);
  protected readonly navCollapsed = signal(false);
  protected readonly activeLink = signal('/dashboard');
  protected readonly items = ['Order #1042', 'Order #1043', 'Order #1044', 'Order #1045'];`,
  template: `
  <div class="filter-row">
    <button class="sort-btn" type="button" [cngxPanelTrigger]="nav.panelTarget">
      Toggle navigation
    </button>
  </div>

  <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav-uncapped">
    <cngx-sidenav #nav="cngxSidenav" position="start" [(opened)]="navOpen" [(collapsed)]="navCollapsed"
                  width="240px" [resizable]="true" shortcut="mod+b">
      <cngx-sidenav-header class="demo-sidenav__header">
        <span class="demo-sidenav__brand-mark" aria-hidden="true">W</span>
        <span class="demo-sidenav__brand-name">Workspace</span>
      </cngx-sidenav-header>

      <span cngxNavLabel class="demo-sidenav__label">Main</span>

      <a cngxNavLink class="demo-sidenav__link"
         [active]="activeLink() === '/dashboard'"
         (click)="activeLink.set('/dashboard'); $event.preventDefault()">
        Dashboard
      </a>

      <a cngxNavLink class="demo-sidenav__link"
         [active]="activeLink() === '/inbox'"
         (click)="activeLink.set('/inbox'); $event.preventDefault()">
        Inbox
        <span cngxNavBadge [value]="7" ariaLabel="7 unread" class="demo-sidenav__badge">7</span>
      </a>

      <a cngxNavLink class="demo-sidenav__link"
         [active]="activeLink() === '/calendar'"
         (click)="activeLink.set('/calendar'); $event.preventDefault()">
        Calendar
        <span cngxNavBadge variant="dot" [value]="1" ariaLabel="New events" class="demo-sidenav__badge-dot"></span>
      </a>

      <span cngxNavLabel class="demo-sidenav__label">Manage</span>

      <button cngxNavGroup #settingsGroup="cngxNavGroup" [controls]="'settings-items'" id="settings-lbl"
              class="demo-sidenav__group" type="button">
        Settings
        <span class="demo-sidenav__chevron" aria-hidden="true"
              [style.transform]="settingsGroup.disclosure.opened() ? 'rotate(90deg)' : ''">&#9654;</span>
      </button>
      <div [cngxNavGroupContent]="settingsGroup">
        <div id="settings-items" role="group" [attr.aria-labelledby]="'settings-lbl'">
          @for (sub of ['General', 'Security', 'Notifications', 'Billing']; track sub) {
            <a cngxNavLink [depth]="1" class="demo-sidenav__link--sub"
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
        <span class="demo-sidenav__chevron" aria-hidden="true"
              [style.transform]="teamGroup.disclosure.opened() ? 'rotate(90deg)' : ''">&#9654;</span>
      </button>
      <div [cngxNavGroupContent]="teamGroup">
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
        Click nav items to change the active state.
        Groups expand with <code>CngxNavGroup</code> + <code>CngxDisclosure</code>.
      </p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
};
