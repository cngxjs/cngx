import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: overflow menu',
  subtitle:
    'Set <code>[maxVisible]</code> and a long trail collapses the middle crumbs into <code>CngxBreadcrumbOverflow</code> - an ellipsis trigger plus a <code>CngxPopoverPanel</code> dropdown of the collapsed crumbs. Open the menu to see them.',
  description:
    'The overflow is composed inside the bar, so there is nothing to wire: it reads the collapse set through the <code>CNGX_BREADCRUMB</code> contract and self-hides when nothing is collapsed. Chrome comes from <code>CngxPopoverPanel</code> - no bespoke overflow styles. Raise <code>maxVisible</code> above the crumb count and the ellipsis disappears; the trail derives the whole thing from one count (Pillar 1).',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition', 'a11y-pattern'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbOverflow'],
  moduleImports: ["import { CngxBreadcrumbBar } from '@cngx/ui/breadcrumb';"],
  imports: ['CngxBreadcrumbBar'],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    },
    {
      label: 'WAI-ARIA APG: Menu pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
  ],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#/' },
    { label: 'Catalog', href: '#/catalog' },
    { label: 'Books', href: '#/catalog/books' },
    { label: 'Fantasy', href: '#/catalog/books/fantasy' },
    { label: 'Tolkien', href: '#/catalog/books/fantasy/tolkien' },
    { label: 'The Hobbit' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" [maxVisible]="3" label="Library breadcrumb" />`,
};
