import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: header skin',
  subtitle:
    'The <code>header</code> skin keeps the trail compact and breaks the leaf onto its own row via <code>:has([aria-current="page"])</code>, where it reads as the page title - the Fiori/Azure detail-page pattern. Selected through <code>skin="header"</code> and reflected onto <code>[data-skin]</code>.',
  description:
    'No template branch drives the title: the leaf styling keys off the existing <code>aria-current="page"</code> marker, so structure stays skin-agnostic (Pillar 3). Type scale and colours come from <code>--cngx-breadcrumb-header-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
  template: `  <cngx-breadcrumb [items]="crumbs" skin="header" label="Header breadcrumb" />`,
};
