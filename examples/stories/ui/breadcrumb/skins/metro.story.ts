import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: metro skin',
  subtitle:
    'The <code>metro</code> skin renders each level as a station: a ring dot via <code>::before</code>, the separator repurposed as the connecting rail, the active dot filled with a halo. Selected through <code>skin="metro"</code> and reflected onto <code>[data-skin]</code>.',
  description:
    'The dot and rail geometry are structural and stay literal; their colours resolve from <code>--cngx-color-primary</code> / <code>-border</code> assigned in the skin scope, so they adapt to the scheme. Retint via the <code>--cngx-breadcrumb-metro-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
  template: `  <cngx-breadcrumb [items]="crumbs" skin="metro" label="Metro breadcrumb" />`,
};
