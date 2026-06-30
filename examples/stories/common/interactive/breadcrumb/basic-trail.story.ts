import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Basic trail',
  subtitle:
    'A <code>nav</code> landmark with a linked trail; the terminal crumb is marked <code>aria-current="page"</code> automatically.',
  description:
    '<code>[cngxBreadcrumb]</code> names the landmark; each <code>[cngxBreadcrumbItem]</code> derives whether it is the current page from its position - no manual flag - and <code>[cngxBreadcrumbSeparator]</code> marks the glyphs <code>aria-hidden</code> so screen readers read a clean list of links.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxBreadcrumb', 'CngxBreadcrumbItem', 'CngxBreadcrumbSeparator'],
  imports: ['CngxBreadcrumb', 'CngxBreadcrumbItem', 'CngxBreadcrumbSeparator'],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    },
  ],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#' },
    { label: 'Library', href: '#' },
    { label: 'Fantasy', href: '#' },
    { label: 'The Hobbit', href: '' },
  ];`,
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb">
    <ol>
      @for (crumb of crumbs; track crumb.label; let first = $first; let last = $last) {
        @if (!first) {
          <li cngxBreadcrumbSeparator>/</li>
        }
        <li>
          <a cngxBreadcrumbItem [attr.href]="last ? null : crumb.href">{{ crumb.label }}</a>
        </li>
      }
    </ol>
  </nav>`,
};
