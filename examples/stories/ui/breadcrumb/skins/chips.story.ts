import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: chips skin',
  subtitle:
    'The <code>chips</code> skin renders each level as a quiet outline chip with a large hit area and the leaf in a soft accent - neutral, touch-friendly. Selected through <code>skin="chips"</code> and reflected onto <code>[data-skin]</code>.',
  description:
    'Chips self-delimit, so the separator is suppressed and spacing comes from the list gap. Borders and fills resolve from <code>--cngx-color-border</code> / <code>-primary</code> in the skin scope; retint via the <code>--cngx-breadcrumb-chips-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxBreadcrumbBar'],
  moduleImports: ["import { CngxBreadcrumbBar } from '@cngx/ui/breadcrumb';"],
  imports: ['CngxBreadcrumbBar'],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#/' },
    { label: 'Catalog', href: '#/catalog' },
    { label: 'Books', href: '#/catalog/books' },
    { label: 'The Hobbit' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="chips" label="Chips breadcrumb" />`,
};
