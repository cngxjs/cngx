import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Nav',
  navLabel: 'Nav',
  navCategory: 'interactive',
  description:
    'Composable navigation atoms: CngxNavLink (active state + depth), CngxNavGroup (accordion), CngxNavLabel (section header), CngxNavBadge (counter/dot). Combine them to build sidebar menus.',
  apiComponents: ['CngxNavLink', 'CngxNavGroup', 'CngxNavBadge', 'CngxNavLabel'],
  moduleImports: [
    "import { CngxNavLink, CngxNavGroup, CngxNavLabel, CngxNavBadge } from '@cngx/common';",
  ],
  setup: `
  protected readonly activeLink = signal('/dashboard');
  protected readonly links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/analytics', label: 'Analytics', badge: 3 },
    { path: '/reports', label: 'Reports' },
  ];
  `,
  sections: [
    {
      title: 'Nav Links — Active State + Depth',
      subtitle:
        '<code>cngxNavLink</code> sets a <code>--cngx-nav-depth</code> CSS var for indentation ' +
        'and toggles <code>cngx-nav-link--active</code>. Click a link to change the active state.',
      imports: ['CngxNavLink'],
      template: `
  <nav class="nav-demo" style="width: 240px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; padding: 0.5rem 0; background: var(--cngx-surface-alt, #f9fafb);">
    @for (link of links; track link.path) {
      <a cngxNavLink [active]="activeLink() === link.path"
         (click)="activeLink.set(link.path); $event.preventDefault()"
         [href]="link.path"
         style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333); border-left: 3px solid transparent; transition: all 0.15s ease;"
         [style.border-left-color]="activeLink() === link.path ? 'var(--interactive, #f5a623)' : 'transparent'"
         [style.background]="activeLink() === link.path ? 'var(--interactive-subtle-bg, rgba(245, 166, 35, 0.08))' : 'transparent'"
         [style.font-weight]="activeLink() === link.path ? '600' : '400'">
        {{ link.label }}
      </a>
    }

    <div style="margin: 0.5rem 1rem; border-top: 1px solid var(--border-color, #e0e0e0);"></div>

    <a cngxNavLink [depth]="0" [active]="false"
       style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
      Top level (depth 0)
    </a>
    <a cngxNavLink [depth]="1" [active]="false"
       style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
      Nested (depth 1)
    </a>
    <a cngxNavLink [depth]="2" [active]="false"
       style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 24px); text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
      Deep nested (depth 2)
    </a>
  </nav>`,
    },
    {
      title: 'Nav Group — Accordion Sections',
      subtitle:
        '<code>cngxNavGroup</code> composes <code>CngxDisclosure</code> as a hostDirective. ' +
        'Click a group header to expand/collapse. <code>aria-expanded</code> is set automatically.',
      imports: ['CngxNavGroup', 'CngxNavLink', 'CngxNavLabel'],
      template: `
  <nav class="nav-demo" style="width: 240px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; padding: 0.5rem 0; background: var(--cngx-surface-alt, #f9fafb);">
    <span cngxNavLabel style="display: block; padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #888);">
      Application
    </span>

    <a cngxNavLink [active]="true"
       style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333); border-left: 3px solid var(--interactive, #f5a623); background: var(--interactive-subtle-bg, rgba(245, 166, 35, 0.08)); font-weight: 600;">
      Dashboard
    </a>

    <button cngxNavGroup #settings="cngxNavGroup" [controls]="'settings-content'" id="settings-trigger"
            style="width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-size: 0.875rem; color: var(--text-primary, #333); display: flex; align-items: center; justify-content: space-between;">
      Settings
      <span style="font-size: 0.75rem; transition: transform 0.15s;"
            [style.transform]="settings.disclosure.opened() ? 'rotate(90deg)' : 'rotate(0)'">
        &#9654;
      </span>
    </button>
    @if (settings.disclosure.opened()) {
      <div id="settings-content" role="group" [attr.aria-labelledby]="'settings-trigger'">
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
          General
        </a>
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
          Security
        </a>
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
          Notifications
        </a>
      </div>
    }

    <button cngxNavGroup #account="cngxNavGroup" [controls]="'account-content'" id="account-trigger"
            style="width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-size: 0.875rem; color: var(--text-primary, #333); display: flex; align-items: center; justify-content: space-between;">
      Account
      <span style="font-size: 0.75rem; transition: transform 0.15s;"
            [style.transform]="account.disclosure.opened() ? 'rotate(90deg)' : 'rotate(0)'">
        &#9654;
      </span>
    </button>
    @if (account.disclosure.opened()) {
      <div id="account-content" role="group" [attr.aria-labelledby]="'account-trigger'">
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
          Profile
        </a>
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
          Billing
        </a>
      </div>
    }
  </nav>`,
    },
    {
      title: 'Nav Badge — Counts and Dots',
      subtitle:
        '<code>cngxNavBadge</code> adds count/dot/status indicators. ' +
        '<code>aria-hidden="true"</code> by default — provide <code>[ariaLabel]</code> for unique information.',
      imports: ['CngxNavLink', 'CngxNavBadge'],
      template: `
  <nav class="nav-demo" style="width: 240px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; padding: 0.5rem 0; background: var(--cngx-surface-alt, #f9fafb);">
    <a cngxNavLink style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
      Inbox
      <span cngxNavBadge [value]="12" ariaLabel="12 unread"
            style="background: var(--interactive, #f5a623); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.1em 0.5em; border-radius: 10px; min-width: 1.2em; text-align: center;">
        12
      </span>
    </a>
    <a cngxNavLink style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
      Updates
      <span cngxNavBadge variant="dot" [value]="1"
            style="width: 8px; height: 8px; border-radius: 50%; background: var(--success-bg, #22c55e);">
      </span>
    </a>
    <a cngxNavLink style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--text-primary, #333);">
      Archive
      <span cngxNavBadge [value]="0"
            style="background: var(--cngx-border, #ddd); color: var(--text-muted, #888); font-size: 0.7rem; padding: 0.1em 0.5em; border-radius: 10px;">
        0
      </span>
    </a>
  </nav>
  <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted, #888);">
    "Archive" badge has value 0 — <code>cngx-nav-badge--hidden</code> class is applied.
  </p>`,
    },
  ],
};
