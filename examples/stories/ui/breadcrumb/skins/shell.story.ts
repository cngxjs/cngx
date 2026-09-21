import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: shell skin',
  subtitle:
    'The <code>shell</code> skin opens the trail with a product chip - an initial mark on the root crumb - then dims the rest of the path, the SaaS app-shell look. The mark rides the <code>*cngxBreadcrumbIcon</code> slot gated on <code>index === 0</code>, so it reuses the one leading slot rather than a root-specific one. Selected through <code>skin="shell"</code>.',
  description:
    'The mark is consumer content projected as <code>.product-mark</code>, the class the skin paints against. Its fill resolves from <code>--cngx-color-primary</code> in the skin scope; retint via the <code>--cngx-breadcrumb-shell-*</code> tokens. The root label reads as the product name; deeper crumbs stay muted until hover.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbIcon } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon'],
  setup: `protected readonly crumbs = [
    { label: 'Acme', href: '#/', icon: 'A' },
    { label: 'Projects', href: '#/projects' },
    { label: 'Atlas', href: '#/projects/atlas' },
    { label: 'Overview' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="shell" label="Product shell breadcrumb">
    <ng-template cngxBreadcrumbIcon let-crumb let-index="index">
      @if (index === 0) {
        <span class="product-mark">{{ crumb.icon }}</span>
      }
    </ng-template>
  </cngx-breadcrumb>`,
};
