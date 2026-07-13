import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: editorial skin',
  subtitle:
    'The <code>editorial</code> skin wipes a gradient underline in on hover and renders the active leaf as gradient text via <code>background-clip: text</code> - a magazine register. Selected through <code>skin="editorial"</code> and reflected onto <code>[data-skin]</code>.',
  description:
    'The gradient endpoints resolve from <code>--cngx-color-primary</code> mixed toward <code>--cngx-color-text</code>, assigned in the skin scope so they adapt to the colour scheme. Retint via <code>--cngx-breadcrumb-editorial-accent</code> / <code>-text</code> (each an <code>@property</code> under <code>@group Skin</code>).',
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
  template: `  <cngx-breadcrumb [items]="crumbs" skin="editorial" label="Editorial breadcrumb" />`,
};
