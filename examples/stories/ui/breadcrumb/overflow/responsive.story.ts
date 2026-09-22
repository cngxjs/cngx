import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: width-responsive collapse',
  subtitle:
    'Nothing to bind: the bar derives <code>[maxVisible]</code> from its own width out of the box. No hand-wired <code>CngxResizeObserver</code>, no <code>computed</code>. Drag the right edge: wider shows more crumbs, narrower folds the middle into the overflow menu.',
  description:
    'The crumb cap lives in CSS, not in TypeScript. <code>breadcrumb-bar.component.css</code> declares the bar as its own query container and writes <code>--cngx-breadcrumb-max-visible</code> on <code>.cngx-breadcrumb::after</code> - 2 crumbs below <code>30rem</code>, 4 below <code>48rem</code>, 6 above. The bar reads that resolved value back and never evaluates a width itself, so the threshold exists exactly once and moves with the stylesheet when a consumer ejects the skin (Pillar 1). Re-aim it with your own rule on the same pseudo-element: <code>.my-nav .cngx-breadcrumb::after { --cngx-breadcrumb-max-visible: 8 }</code>. An explicit <code>[maxVisible]</code> still wins and is therefore the opt-out (controlled/uncontrolled); collapsed crumbs stay reachable through the overflow menu (Pillar 2). Note the box resizes, not the window - the bar reacts to its container, so it behaves the same in a drawer on a desktop as on a phone.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxBreadcrumbBar'],
  moduleImports: ["import { CngxBreadcrumbBar } from '@cngx/ui/breadcrumb';"],
  imports: ['CngxBreadcrumbBar'],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
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
  template: `  <cngx-breadcrumb
    [items]="crumbs"
    label="Library breadcrumb"
    class="demo-breadcrumb-resizable"
  />`,
};
