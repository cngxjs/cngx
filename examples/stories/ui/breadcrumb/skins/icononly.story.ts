import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: icononly skin',
  subtitle:
    'The <code>icononly</code> skin collapses each crumb to a compact icon square for tight headers. The label is visually hidden but stays the accessible name, and a pure-CSS tooltip surfaces it from <code>[data-label]</code> on hover and keyboard focus. The icon rides the <code>*cngxBreadcrumbIcon</code> slot; here <code>&lt;mat-icon&gt;</code> renders the per-crumb <code>icon</code> token. Selected through <code>skin="icononly"</code>.',
  description:
    'The bar always wraps the label in a <code>.cngx-breadcrumb__label</code> span and sets <code>[data-label]</code>, so hiding is a skin concern, not a template branch: the label remains in the DOM as the link name (Pillar 2), and the tooltip is decorative - empty CSS alt text (<code>content: attr(data-label) / ''</code>) keeps it out of the accessible name. Icons are <code>aria-hidden</code>. Fills resolve from <code>--cngx-color-*</code> in the skin scope; retint via the <code>--cngx-breadcrumb-icononly-*</code> tokens.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbIcon } from '@cngx/ui/breadcrumb';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon', 'MatIconModule'],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#/', icon: 'home' },
    { label: 'Library', href: '#/library', icon: 'folder' },
    { label: 'Settings', icon: 'settings' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="icononly" label="Icon-only breadcrumb">
    <ng-template cngxBreadcrumbIcon let-crumb>
      <mat-icon class="demo-breadcrumb-icon" aria-hidden="true">{{ crumb.icon }}</mat-icon>
    </ng-template>
  </cngx-breadcrumb>`,
};
