import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Nav Group — Accordion Sections',
  subtitle: '<code>cngxNavGroup</code> composes <code>CngxDisclosure</code> as a hostDirective. Click a group header to expand/collapse. <code>aria-expanded</code> is set automatically.',
  description: 'Composable navigation atoms: CngxNavLink (active state + depth), CngxNavGroup (accordion), CngxNavLabel (section header), CngxNavBadge (counter/dot). Combine them to build sidebar menus.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxNavLink',
    'CngxNavGroup',
    'CngxNavBadge',
    'CngxNavLabel',
  ],
  moduleImports: [
    'import { CngxNavLink, CngxNavGroup, CngxNavLabel } from \'@cngx/common\';',
  ],
  imports: ['CngxNavGroup', 'CngxNavLink', 'CngxNavLabel'],
  template: `
  <nav class="nav-demo" style="width: 240px; border: 1px solid var(--cngx-color-border); border-radius: 6px; padding: 0.5rem 0; background: var(--cngx-surface-alt, #f9fafb);">
    <span cngxNavLabel style="display: block; padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--cngx-color-text-muted);">
      Application
    </span>

    <a cngxNavLink [active]="true"
       style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text); border-left: 3px solid var(--interactive, #f5a623); background: var(--interactive-subtle-bg, rgba(245, 166, 35, 0.08)); font-weight: 600;">
      Dashboard
    </a>

    <button cngxNavGroup #settings="cngxNavGroup" [controls]="'settings-content'" id="settings-trigger"
            style="width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-size: 0.875rem; color: var(--cngx-color-text); display: flex; align-items: center; justify-content: space-between;">
      Settings
      <span style="font-size: 0.75rem; transition: transform 0.15s;"
            [style.transform]="settings.disclosure.opened() ? 'rotate(90deg)' : 'rotate(0)'">
        &#9654;
      </span>
    </button>
    @if (settings.disclosure.opened()) {
      <div id="settings-content" role="group" [attr.aria-labelledby]="'settings-trigger'">
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
          General
        </a>
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
          Security
        </a>
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
          Notifications
        </a>
      </div>
    }

    <button cngxNavGroup #account="cngxNavGroup" [controls]="'account-content'" id="account-trigger"
            style="width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-size: 0.875rem; color: var(--cngx-color-text); display: flex; align-items: center; justify-content: space-between;">
      Account
      <span style="font-size: 0.75rem; transition: transform 0.15s;"
            [style.transform]="account.disclosure.opened() ? 'rotate(90deg)' : 'rotate(0)'">
        &#9654;
      </span>
    </button>
    @if (account.disclosure.opened()) {
      <div id="account-content" role="group" [attr.aria-labelledby]="'account-trigger'">
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
          Profile
        </a>
        <a cngxNavLink [depth]="1" style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
          Billing
        </a>
      </div>
    }
  </nav>`,
};
