import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: iconlabel skin',
  subtitle:
    'The <code>iconlabel</code> skin gives every crumb a leading icon while the label stays the name. Icons are consumer content: one <code>*cngxBreadcrumbItemAccessory</code> template renders per crumb with a <code>{ crumb, index }</code> context, so the consumer switches the glyph per level. The skin paints the pill and orders the icon ahead of the label. Selected through <code>skin="iconlabel"</code>.',
  description:
    'Icons are decorative (<code>aria-hidden</code>) and inherit <code>currentColor</code> from the crumb, so the active leaf tints its icon to the accent with no extra ARIA (Pillar 2). Fills resolve from <code>--cngx-color-primary</code> in the skin scope; retint via the <code>--cngx-breadcrumb-iconlabel-*</code> tokens (each an <code>@property</code> under <code>@group Skin</code>).',
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
    { label: 'Projects', href: '#/projects' },
    { label: 'Atlas', href: '#/projects/atlas' },
    { label: 'Settings' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="iconlabel" label="Icon and label breadcrumb">
    <ng-template cngxBreadcrumbItemAccessory let-index="index">
      @switch (index) {
        @case (0) {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
          </svg>
        }
        @case (1) {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        }
        @case (2) {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 2h7l4 4v16H7z" />
            <path d="M14 2v4h4" />
          </svg>
        }
        @default {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2v3M12 19v3M4.2 4.2l2.2 2.2M17.6 17.6l2.2 2.2M2 12h3M19 12h3M4.2 19.8l2.2-2.2M17.6 6.4l2.2-2.2" />
          </svg>
        }
      }
    </ng-template>
  </cngx-breadcrumb>`,
};
