import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: path skin',
  subtitle:
    'The <code>path</code> skin renders the trail as a monospace file-explorer bar and keeps the <code>/</code> separators. A leading folder icon per crumb is consumer content projected through the <code>*cngxBreadcrumbItemAccessory</code> slot - the skin only paints it and orders it ahead of the label. Selected through <code>skin="path"</code>.',
  description:
    'The icon is decorative (<code>aria-hidden</code>); the label stays the accessible name, so the skin adds no ARIA surface. Track and text colours resolve from <code>--cngx-color-*</code> in the skin scope; retint via the <code>--cngx-breadcrumb-path-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbItemAccessory'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbItemAccessory } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbItemAccessory'],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#/' },
    { label: 'Catalog', href: '#/catalog' },
    { label: 'Books', href: '#/catalog/books' },
    { label: 'The Hobbit' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="path" label="File path breadcrumb">
    <ng-template cngxBreadcrumbItemAccessory>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    </ng-template>
  </cngx-breadcrumb>`,
};
