import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavLink: active state and depth',
  subtitle:
    '<code>cngxNavLink</code> toggles <code>cngx-nav-link--active</code> and emits <code>aria-current="page"</code> when <code>[active]</code> is true. <code>[depth]</code> writes a <code>--cngx-nav-depth</code> CSS var the consumer maps to indentation.',
  description:
    'Top list demonstrates active-state switching against a tracked signal; each link sets <code>aria-current="page"</code> only while selected. Bottom list shows three depths so the indentation modifier classes can be compared side by side.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-current',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
    {
      label: 'WCAG 2.1 SC 1.3.1 Info and Relationships',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
    },
  ],
  apiComponents: ['CngxNavLink'],
  moduleImports: [`import { CngxNavLink } from '@cngx/common';`],
  imports: ['CngxNavLink'],
  setup: `protected readonly activeLink = signal('/dashboard');
  protected readonly links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/reports', label: 'Reports' },
  ];`,
  template: `
  <nav class="demo-nav__frame">
    @for (link of links; track link.path) {
      <a
        cngxNavLink
        [active]="activeLink() === link.path"
        [href]="link.path"
        (click)="activeLink.set(link.path); $event.preventDefault()"
        class="demo-nav__link"
        [class.demo-nav__link--active]="activeLink() === link.path"
      >
        {{ link.label }}
      </a>
    }

    <div class="demo-nav__divider"></div>

    <a cngxNavLink [depth]="0" [active]="false" href="#depth-0" class="demo-nav__link">
      Top level (depth 0)
    </a>
    <a cngxNavLink [depth]="1" [active]="false" href="#depth-1" class="demo-nav__link demo-nav__link--indent-1">
      Nested (depth 1)
    </a>
    <a cngxNavLink [depth]="2" [active]="false" href="#depth-2" class="demo-nav__link demo-nav__link--indent-2">
      Deep nested (depth 2)
    </a>
  </nav>`,
};
