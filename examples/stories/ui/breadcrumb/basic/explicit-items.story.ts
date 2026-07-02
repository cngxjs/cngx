import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: explicit items',
  subtitle:
    'The drop-in <code>&lt;cngx-breadcrumb [items]="..."&gt;</code> organism renders a trail through the headless <code>@cngx/common/interactive</code> trio - the bar forwards the input and owns the skin, the trio owns terminal marking and the <code>nav</code> landmark.',
  description:
    'Pass a <code>CngxBreadcrumbCrumb[]</code>: each entry is a <code>{ label, href }</code>, the terminal crumb omits <code>href</code> and is derived as the current page (<code>aria-current="page"</code>). No wiring, no collapse config - the trail is derived from the input in a <code>computed()</code> (Pillar 1).',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern'],
  apiComponents: ['CngxBreadcrumbBar'],
  moduleImports: ["import { CngxBreadcrumbBar } from '@cngx/ui/breadcrumb';"],
  imports: ['CngxBreadcrumbBar'],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    },
    {
      label: 'WAI-ARIA: `aria-current`',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
  ],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#/' },
    { label: 'Catalog', href: '#/catalog' },
    { label: 'Books', href: '#/catalog/books' },
    { label: 'The Hobbit' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" label="Catalog breadcrumb" />`,
};
