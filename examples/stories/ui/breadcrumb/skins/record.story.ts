import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: record skin',
  subtitle:
    'The <code>record</code> skin turns the leaf into a record chip - a mono id, a status dot, and a status label - so a detail page shows identity and state without a second header. The mono id rides the leading <code>*cngxBreadcrumbIcon</code> slot; the dot and label ride the trailing <code>*cngxBreadcrumbItemAccessory</code> slot, both gated on the terminal crumb, reusing the two existing slots. Selected through <code>skin="record"</code>.',
  description:
    'The status dot is decorative (<code>aria-hidden</code>); the status label carries the semantics (Pillar 2). Chip and status colours resolve from <code>--cngx-color-surface</code> / <code>--cngx-color-success</code> in the skin scope; retint via the <code>--cngx-breadcrumb-record-*</code> tokens. Consumer markup is projected as <code>.rec-id</code>, <code>.status-dot</code>, and <code>.status-label</code>, the classes the skin paints against.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon', 'CngxBreadcrumbItemAccessory'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbIcon, CngxBreadcrumbItemAccessory } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbIcon', 'CngxBreadcrumbItemAccessory'],
  setup: `protected readonly crumbs = [
    { label: 'Records', href: '#/' },
    { label: 'Invoices', href: '#/invoices' },
    { label: 'Acme Corp', icon: 'INV-4821' },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" skin="record" label="Record status breadcrumb">
    <ng-template cngxBreadcrumbIcon let-crumb>
      @if (crumb.icon) {
        <span class="rec-id">{{ crumb.icon }}</span>
      }
    </ng-template>
    <ng-template cngxBreadcrumbItemAccessory let-crumb>
      @if (!crumb.href) {
        <span class="status-dot" aria-hidden="true"></span>
        <span class="status-label">Active</span>
      }
    </ng-template>
  </cngx-breadcrumb>`,
};
