import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbOverflowItem: custom overflow row',
  subtitle:
    'Project a <code>*cngxBreadcrumbOverflowItem</code> template into <code>&lt;cngx-breadcrumb&gt;</code> and the bar forwards it to the composed overflow menu, so the collapsed-crumb rows render your markup - here a leading folder glyph plus the label. The <code>&lt;li cngxMenuItem&gt;</code> shell (role, highlight, activation) stays library-owned.',
  description:
    'The bar composes <code>CngxBreadcrumbOverflow</code> internally, so a consumer cannot reach its row slot as <code>contentChild</code>. The bar queries the projected <code>*cngxBreadcrumbOverflowItem</code> and forwards it through the overflow`s <code>[itemTemplate]</code> input (input wins over a directly-projected slot). The context carries the collapsed <code>crumb</code> and its <code>index</code>; read <code>crumb.resolvedLabel()</code> for the reactive label. Raise <code>[maxVisible]</code> above the crumb count and the overflow - and this template - disappear (Pillar 1).',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbOverflow', 'CngxBreadcrumbOverflowItem'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbOverflowItem } from '@cngx/ui/breadcrumb';",
    "import type { CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbOverflowItem'],
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
  setup: `protected readonly crumbs: readonly CngxBreadcrumbCrumb[] = [
    { label: 'Home', href: '#/' },
    { label: 'Catalog', href: '#/catalog' },
    { label: 'Books', href: '#/catalog/books' },
    { label: 'Fantasy', href: '#/catalog/books/fantasy' },
    { label: 'Tolkien', href: '#/catalog/books/fantasy/tolkien' },
    { label: 'The Hobbit' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" [maxVisible]="3" label="Library breadcrumb">
    <ng-template cngxBreadcrumbOverflowItem let-crumb>
      <span style="display: inline-flex; gap: 0.4rem; align-items: center">
        <span aria-hidden="true">&#128193;</span>{{ crumb.resolvedLabel() }}
      </span>
    </ng-template>
  </cngx-breadcrumb>`,
};
