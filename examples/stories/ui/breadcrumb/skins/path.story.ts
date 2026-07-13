import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: path skin',
  subtitle:
    'The <code>path</code> skin renders the trail as a monospace file-explorer bar and keeps the <code>/</code> separators. Leading icons are consumer content: one <code>*cngxBreadcrumbItemAccessory</code> template renders per crumb with a <code>{ crumb, index }</code> context, so the consumer switches folder vs file per level. The skin paints and orders the icon ahead of the label. Selected through <code>skin="path"</code>.',
  description:
    'Icons are decorative (<code>aria-hidden</code>); the label stays the accessible name, so the skin adds no ARIA surface. Track and text colours resolve from <code>--cngx-color-*</code> in the skin scope; retint via the <code>--cngx-breadcrumb-path-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
    <ng-template cngxBreadcrumbItemAccessory let-index="index">
      @switch (index) {
        @case (0) {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
          </svg>
        }
        @case (3) {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 2h7l4 4v16H7z" />
            <path d="M14 2v4h4" />
          </svg>
        }
        @default {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        }
      }
    </ng-template>
  </cngx-breadcrumb>`,
};
