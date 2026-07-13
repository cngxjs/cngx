import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: iconlabel skin',
  subtitle:
    'The <code>iconlabel</code> skin gives every crumb a leading icon while the label stays the accessible name. The icon is consumer content: one <code>*cngxBreadcrumbIcon</code> template renders inside each crumb link with a <code>{ crumb, index }</code> context, so the per-crumb <code>icon</code> token drives the glyph. cngx never interprets the token - here <code>&lt;mat-icon&gt;</code> renders it, proving the slot passes through any icon system. Selected through <code>skin="iconlabel"</code>.',
  description:
    'Icons are decorative (<code>aria-hidden</code>) and inherit <code>currentColor</code> from the crumb, so the active leaf tints its icon to the accent with no extra ARIA (Pillar 2). Fills resolve from <code>--cngx-color-primary</code> in the skin scope; retint via the <code>--cngx-breadcrumb-iconlabel-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
    { label: 'Projects', href: '#/projects', icon: 'folder' },
    { label: 'Atlas', href: '#/projects/atlas', icon: 'folder_open' },
    { label: 'Settings', icon: 'settings' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="iconlabel" label="Icon and label breadcrumb">
    <ng-template cngxBreadcrumbIcon let-crumb>
      <mat-icon class="demo-breadcrumb-icon" aria-hidden="true">{{ crumb.icon }}</mat-icon>
    </ng-template>
  </cngx-breadcrumb>`,
};
