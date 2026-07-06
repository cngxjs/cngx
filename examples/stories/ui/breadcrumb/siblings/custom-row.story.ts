import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbSiblingItem: custom row slot',
  subtitle:
    'Inside the bar, the accessory slot composes a <code>&lt;cngx-breadcrumb-siblings&gt;</code> whose row body you own via <code>*cngxBreadcrumbSiblingItem</code>. The slot context carries the <code>sibling</code> and its <code>index</code>, so the consumer renders whatever markup they need - here a leading glyph plus the link - while the component keeps the disclosure, the list role, and <code>aria-current</code> on the active level.',
  description:
    'Row customization is only reachable through the <code>*cngxBreadcrumbItemAccessory</code> slot: the declarative <code>crumb.siblings</code> field auto-renders default rows and has no content-projection seam. The row slot replaces only the body, not the surrounding <code>&lt;li&gt;</code> or its <code>aria-current</code>, so a custom row keeps every a11y guarantee. The consumer stays responsible for the anchor: non-current rows render a real <code>&lt;a href&gt;</code> for keyboard and middle-click; the active level renders text. The decorative glyph is <code>aria-hidden</code> so the screen reader announces a clean link list.',
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
