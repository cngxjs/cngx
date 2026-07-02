import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbSiblings: custom row slot',
  subtitle:
    'Project a <code>*cngxBreadcrumbSiblingItem</code> template to own the row body. The slot context carries the <code>sibling</code> and its <code>index</code>, so the consumer renders whatever markup they need - here a leading glyph plus the link - while the component keeps the disclosure, the list role, and <code>aria-current</code> on the active level.',
  description:
    'The slot replaces only the row body, not the surrounding <code>&lt;li&gt;</code> or its <code>aria-current</code>, so a custom row keeps every a11y guarantee. The consumer stays responsible for the anchor: non-current rows render a real <code>&lt;a href&gt;</code> for keyboard and middle-click; the active level renders text. The decorative glyph is <code>aria-hidden</code> so the screen reader announces a clean link list.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxBreadcrumbSiblings',
    'CngxBreadcrumbSiblingItem',
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
  ],
  moduleImports: [
    "import { CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator } from '@cngx/common/interactive';",
    "import { CngxBreadcrumbSiblings, CngxBreadcrumbSiblingItem } from '@cngx/ui/breadcrumb';",
  ],
  imports: [
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
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
  setup: `protected readonly cities = [
    { label: 'Munich', href: '#/eu/munich' },
    { label: 'Berlin', current: true },
    { label: 'Hamburg', href: '#/eu/hamburg' },
  ];`,
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb">
    <ol>
      <li><a cngxBreadcrumbItem href="#/">Home</a></li>
      <li cngxBreadcrumbSeparator>/</li>
      <li>
        <a cngxBreadcrumbItem>Berlin</a>
        <cngx-breadcrumb-siblings [siblings]="cities">
          <ng-template cngxBreadcrumbSiblingItem let-sibling>
            @if (sibling.href && !sibling.current) {
              <a [attr.href]="sibling.href" style="display: inline-flex; gap: 0.4rem; align-items: center">
                <span aria-hidden="true">&#9679;</span>{{ sibling.label }}
              </a>
            } @else {
              <span style="display: inline-flex; gap: 0.4rem; align-items: center; font-weight: 600">
                <span aria-hidden="true">&#9679;</span>{{ sibling.label }}
              </span>
            }
          </ng-template>
        </cngx-breadcrumb-siblings>
      </li>
    </ol>
  </nav>`,
};
