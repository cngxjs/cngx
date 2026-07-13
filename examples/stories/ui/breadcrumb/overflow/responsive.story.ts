import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: width-responsive collapse',
  subtitle:
    'Add one attribute - <code>responsive</code> - and the bar derives <code>[maxVisible]</code> from its own width. No hand-wired <code>CngxResizeObserver</code>, no <code>computed</code>. Drag the right edge or narrow the window: wider shows more crumbs, narrower folds the middle into the overflow menu.',
  description:
    'The headless recipe wires a <code>CngxResizeObserver</code> on the <code>nav</code> and a <code>computed()</code> <code>maxVisible</code> by hand. The organism packages that: an always-on observer hostDirective feeds the pure <code>resolveBreadcrumbTier</code>, so every skin becomes responsive through the one bar mechanism (Pillar 1, Pillar 3). <code>[responsiveTiers]</code> maps width breakpoints to a crumb cap - here tuned to the demo card so the full range from 6 crumbs down to 2 is visible as you resize. An explicit <code>[maxVisible]</code> still wins (controlled/uncontrolled); collapsed crumbs stay reachable through the overflow menu (Pillar 2).',
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
  ];
  protected readonly tiers = [
    { minWidth: 500, maxVisible: 6 },
    { minWidth: 380, maxVisible: 4 },
    { minWidth: 0, maxVisible: 2 },
  ];`,
  template: `  <cngx-breadcrumb
    [items]="crumbs"
    responsive
    [responsiveTiers]="tiers"
    label="Library breadcrumb"
    class="demo-breadcrumb-resizable"
  />`,
};
