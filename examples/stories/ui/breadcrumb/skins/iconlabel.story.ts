import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: iconlabel skin',
  subtitle:
    'The <code>iconlabel</code> skin gives every crumb a leading icon while the label stays the name. The icon is consumer content projected through the <code>*cngxBreadcrumbItemAccessory</code> slot - the skin paints the pill and orders the icon ahead of the label. Selected through <code>skin="iconlabel"</code>.',
  description:
    'The icon is decorative (<code>aria-hidden</code>), so the accessible name is unchanged and no ARIA surface is added (Pillar 2). Fills resolve from <code>--cngx-color-primary</code> in the skin scope; retint via the <code>--cngx-breadcrumb-iconlabel-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
  template: `  <cngx-breadcrumb [items]="crumbs" skin="iconlabel" label="Icon and label breadcrumb">
    <ng-template cngxBreadcrumbItemAccessory>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    </ng-template>
  </cngx-breadcrumb>`,
};
