import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavBadge: counts and dots',
  subtitle:
    '<code>cngxNavBadge</code> renders count, dot, and status variants. Decorative by default (<code>aria-hidden="true"</code>); set <code>[ariaLabel]</code> when the badge conveys information the link text does not.',
  description:
    'Three inbox-style links with badges. Inbox shows an unread count with an explicit accessible label, Updates shows a presence dot (purely visual), Archive holds a zero count so <code>isEmpty()</code> applies the hidden modifier.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-hidden',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden',
    },
    {
      label: 'WCAG 2.1 SC 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxNavBadge', 'CngxNavLink'],
  moduleImports: [`import { CngxNavLink, CngxNavBadge } from '@cngx/common';`],
  imports: ['CngxNavLink', 'CngxNavBadge'],
  template: `
  <nav class="demo-nav__frame">
    <a cngxNavLink href="#inbox" class="demo-nav__link demo-nav__link--row">
      Inbox
      <span cngxNavBadge [value]="12" ariaLabel="12 unread" class="demo-nav__badge--count">12</span>
    </a>
    <a cngxNavLink href="#updates" class="demo-nav__link demo-nav__link--row">
      Updates
      <span cngxNavBadge variant="dot" [value]="1" class="demo-nav__badge--dot"></span>
    </a>
    <a cngxNavLink href="#archive" class="demo-nav__link demo-nav__link--row">
      Archive
      <span cngxNavBadge [value]="0" class="demo-nav__badge--muted">0</span>
    </a>
  </nav>
  <p class="demo-nav__note">
    "Archive" has value 0, so <code>cngx-nav-badge--hidden</code> hides it.
  </p>`,
};
