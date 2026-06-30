import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Custom separator',
  subtitle:
    'The separator is a slot - any glyph works. Here a chevron replaces the slash; it stays <code>aria-hidden</code>.',
  description:
    'Because <code>[cngxBreadcrumbSeparator]</code> only adds <code>aria-hidden</code>, the visible glyph is entirely yours - a slash, a chevron, an icon component. The trail semantics are unchanged.',
  level: 'molecule',
  audience: ['design', 'dev'],
  artifact: 'building-block',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxBreadcrumbSeparator'],
  imports: ['CngxBreadcrumb', 'CngxBreadcrumbItem', 'CngxBreadcrumbSeparator'],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    },
  ],
  setup: `protected readonly crumbs = [
    { label: 'Dashboard', href: '#' },
    { label: 'Projects', href: '#' },
    { label: 'cngx', href: '#' },
    { label: 'Settings', href: '' },
  ];`,
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb">
    <ol>
      @for (crumb of crumbs; track crumb.label; let first = $first; let last = $last) {
        @if (!first) {
          <li cngxBreadcrumbSeparator aria-hidden="true">&rsaquo;</li>
        }
        <li>
          <a cngxBreadcrumbItem [attr.href]="last ? null : crumb.href">{{ crumb.label }}</a>
        </li>
      }
    </ol>
  </nav>`,
};
