import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: toolbar skin',
  subtitle:
    'The <code>toolbar</code> skin packs the crumbs into a full-width bordered bar of cells with vertical dividers and no wrap, the active leaf a soft accent cell - a path-bar look for dense data apps. Selected through <code>skin="toolbar"</code> and reflected onto <code>[data-skin]</code>.',
  description:
    'The cells run <code>nowrap</code>, so long trails should pair this skin with <code>[maxVisible]</code> overflow collapse. Surfaces and borders resolve from <code>--cngx-color-surface</code> / <code>-border</code> in the skin scope; retint via the <code>--cngx-breadcrumb-toolbar-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
  template: `  <cngx-breadcrumb [items]="crumbs" skin="toolbar" label="Toolbar breadcrumb" />`,
};
