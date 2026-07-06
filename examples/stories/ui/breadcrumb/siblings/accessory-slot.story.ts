import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbItemAccessory: per-crumb accessory slot',
  subtitle:
    'Project a <code>*cngxBreadcrumbItemAccessory</code> template to own the accessory area of every crumb. The context carries the <code>crumb</code> and its <code>index</code>, so the consumer decides per crumb what to render - here it re-dispatches <code>crumb.siblings</code>. Projecting the slot wins globally over the declarative auto-render, so the accessory area has one predictable owner.',
  description:
    'The slot is the escape hatch above the declarative <code>siblings</code> field. Its real payoff is the router-driven source: drop <code>&lt;cngx-breadcrumb-siblings cngxRouterSync [depth]&gt;</code> into this same slot and the dropdown derives its rows from the activated route tree, while <code>CngxBreadcrumbBar</code> keeps its <code>@angular/router</code> freedom (see the <code>CngxBreadcrumbSiblingsRouterSync</code> playground) - the declarative field is static-only and cannot reach the router. To customize the row body inside the dropdown, compose a <code>*cngxBreadcrumbSiblingItem</code> template here too (see the custom-row example).',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'integration'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbItemAccessory', 'CngxBreadcrumbSiblings'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbItemAccessory, CngxBreadcrumbSiblings } from '@cngx/ui/breadcrumb';",
    "import type { CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbItemAccessory', 'CngxBreadcrumbSiblings'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
    {
      label: 'Angular: template context (`ngTemplateContextGuard`)',
      href: 'https://angular.dev/guide/directives/structural-directives',
    },
  ],
  setup: `protected readonly crumbs: readonly CngxBreadcrumbCrumb[] = [
    { label: 'Home', href: '#/' },
    { label: 'Region EU', href: '#/eu' },
    {
      label: 'Berlin',
      siblings: [
        { label: 'Munich', href: '#/eu/munich' },
        { label: 'Berlin', current: true },
        { label: 'Hamburg', href: '#/eu/hamburg' },
      ],
    },
  ];`,
  template: `  <cngx-breadcrumb [items]="crumbs" label="Breadcrumb">
    <ng-template cngxBreadcrumbItemAccessory let-crumb>
      @if (crumb.siblings; as sibs) {
        <cngx-breadcrumb-siblings [siblings]="sibs" />
      }
    </ng-template>
  </cngx-breadcrumb>`,
};
