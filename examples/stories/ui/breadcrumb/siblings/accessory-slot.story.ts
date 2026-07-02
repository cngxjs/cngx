import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbItemAccessory: per-crumb accessory slot',
  subtitle:
    'Project a <code>*cngxBreadcrumbItemAccessory</code> template to own the accessory area of every crumb. The context carries the <code>crumb</code> and its <code>index</code>, so the consumer decides per crumb what to render - here it guards <code>crumb.siblings</code> and composes a custom <code>*cngxBreadcrumbSiblingItem</code> row.',
  description:
    'The slot is the escape hatch above the declarative <code>siblings</code> field: when projected it wins globally, so the accessory area has one predictable owner. It is also the only path to a router-driven source at the bar tier - drop <code>&lt;cngx-breadcrumb-siblings cngxRouterSync [depth]&gt;</code> into this same slot and the dropdown derives its rows from the activated route tree, while <code>CngxBreadcrumbBar</code> keeps its <code>@angular/router</code> freedom (see the <code>CngxBreadcrumbSiblingsRouterSync</code> playground). The row slot replaces only the body, not the <code>&lt;li&gt;</code> or its <code>aria-current</code>, so the active level keeps every a11y guarantee.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxBreadcrumbBar',
    'CngxBreadcrumbItemAccessory',
    'CngxBreadcrumbSiblings',
    'CngxBreadcrumbSiblingItem',
  ],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbItemAccessory, CngxBreadcrumbSiblings, CngxBreadcrumbSiblingItem } from '@cngx/ui/breadcrumb';",
    "import type { CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';",
  ],
  imports: [
    'CngxBreadcrumbBar',
    'CngxBreadcrumbItemAccessory',
    'CngxBreadcrumbSiblings',
    'CngxBreadcrumbSiblingItem',
  ],
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
        <cngx-breadcrumb-siblings [siblings]="sibs">
          <ng-template cngxBreadcrumbSiblingItem let-sibling>
            @if (sibling.href && !sibling.current) {
              <a [attr.href]="sibling.href" style="display: inline-flex; gap: 0.4rem; align-items: center">
                <span aria-hidden="true">&#9679;</span>{{ sibling.label }}
              </a>
            } @else {
              <span style="display: inline-flex; gap: 0.4rem; align-items: center">
                <span aria-hidden="true">&#9679;</span>{{ sibling.label }}
              </span>
            }
          </ng-template>
        </cngx-breadcrumb-siblings>
      }
    </ng-template>
  </cngx-breadcrumb>`,
};
