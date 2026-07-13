import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: path skin',
  subtitle:
    'The <code>path</code> skin renders the trail as a monospace file-explorer bar and keeps the <code>/</code> separators. The leading icon is consumer content: one <code>*cngxBreadcrumbIcon</code> template renders inside each crumb link with a <code>{ crumb, index }</code> context, so the per-crumb <code>icon</code> token switches folder vs file. cngx never interprets the token - here <code>&lt;mat-icon&gt;</code> renders it, proving the slot passes through any icon system. Selected through <code>skin="path"</code>.',
  description:
    'Icons are decorative (<code>aria-hidden</code>); the label stays the accessible name, so the skin adds no ARIA surface. Track and text colours resolve from <code>--cngx-color-*</code> in the skin scope; retint via the <code>--cngx-breadcrumb-path-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbIcon } from '@cngx/ui/breadcrumb';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon', 'MatIconModule'],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#/', icon: 'home' },
    { label: 'Catalog', href: '#/catalog', icon: 'folder' },
    { label: 'Books', href: '#/catalog/books', icon: 'folder' },
    { label: 'The Hobbit', icon: 'description' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="path" label="File path breadcrumb">
    <ng-template cngxBreadcrumbIcon let-crumb>
      <mat-icon class="demo-breadcrumb-icon" aria-hidden="true">{{ crumb.icon }}</mat-icon>
    </ng-template>
  </cngx-breadcrumb>`,
};
