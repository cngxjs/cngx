import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavGroup: accordion sections',
  subtitle:
    '<code>cngxNavGroup</code> composes <code>CngxDisclosure</code> as a host directive, so the trigger toggles via click, <kbd>Enter</kbd>, or <kbd>Space</kbd> and exposes <code>aria-expanded</code>/<code>aria-controls</code> automatically.',
  description:
    'Sidebar layout with a section label, an active top-level link, and two collapsible groups. Each group trigger is a real <code>&lt;button&gt;</code>; its content is rendered with <code>&#64;if</code> and wired to the trigger via <code>id</code>/<code>aria-labelledby</code>/<code>role="group"</code>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
    {
      label: 'WCAG 2.1 SC 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
  ],
  apiComponents: ['CngxNavGroup', 'CngxNavLink', 'CngxNavLabel'],
  moduleImports: [`import { CngxNavLink, CngxNavGroup, CngxNavLabel } from '@cngx/common';`],
  imports: ['CngxNavGroup', 'CngxNavLink', 'CngxNavLabel'],
  template: `
  <nav class="demo-nav__frame">
    <span cngxNavLabel class="demo-nav__label">Application</span>

    <a cngxNavLink [active]="true" href="#dashboard" class="demo-nav__link demo-nav__link--active">
      Dashboard
    </a>

    <button
      cngxNavGroup
      #settings="cngxNavGroup"
      type="button"
      id="settings-trigger"
      [controls]="'settings-content'"
      class="demo-nav__trigger"
    >
      Settings
      <span
        class="demo-nav__caret"
        aria-hidden="true"
        [style.transform]="settings.disclosure.opened() ? 'rotate(90deg)' : 'rotate(0)'"
      >&#9654;</span>
    </button>
    @if (settings.disclosure.opened()) {
      <div id="settings-content" role="group" aria-labelledby="settings-trigger">
        <a cngxNavLink [depth]="1" href="#settings-general" class="demo-nav__link demo-nav__link--indent-1">General</a>
        <a cngxNavLink [depth]="1" href="#settings-security" class="demo-nav__link demo-nav__link--indent-1">Security</a>
        <a cngxNavLink [depth]="1" href="#settings-notifications" class="demo-nav__link demo-nav__link--indent-1">Notifications</a>
      </div>
    }

    <button
      cngxNavGroup
      #account="cngxNavGroup"
      type="button"
      id="account-trigger"
      [controls]="'account-content'"
      class="demo-nav__trigger"
    >
      Account
      <span
        class="demo-nav__caret"
        aria-hidden="true"
        [style.transform]="account.disclosure.opened() ? 'rotate(90deg)' : 'rotate(0)'"
      >&#9654;</span>
    </button>
    @if (account.disclosure.opened()) {
      <div id="account-content" role="group" aria-labelledby="account-trigger">
        <a cngxNavLink [depth]="1" href="#account-profile" class="demo-nav__link demo-nav__link--indent-1">Profile</a>
        <a cngxNavLink [depth]="1" href="#account-billing" class="demo-nav__link demo-nav__link--indent-1">Billing</a>
      </div>
    }
  </nav>`,
};
