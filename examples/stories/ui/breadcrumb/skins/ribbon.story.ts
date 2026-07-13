import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: ribbon skin',
  subtitle:
    'The <code>ribbon</code> skin paints each crumb as a chevron segment via <code>clip-path</code>, the active leaf as a solid accent, and suppresses the separator - a directional cue for process flows (checkout, wizards). Selected through <code>skin="ribbon"</code> and reflected onto <code>[data-skin]</code>.',
  description:
    'Every colour resolves adaptively from <code>--cngx-color-*</code> assigned in the skin scope; the arrow silhouette is structural and stays with the skin. Retint with the <code>--cngx-breadcrumb-ribbon-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
  template: `  <cngx-breadcrumb [items]="crumbs" skin="ribbon" label="Ribbon breadcrumb" />`,
};
