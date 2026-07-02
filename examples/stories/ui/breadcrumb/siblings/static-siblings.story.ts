import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbSiblings: static siblings',
  subtitle:
    'Attach <code>&lt;cngx-breadcrumb-siblings&gt;</code> to a crumb to offer the sibling pages at that level. The chevron is a disclosure over a <code>CngxPopoverPanel</code> holding a list of native <code>&lt;a href&gt;</code> anchors - open it and Tab through the alternatives.',
  description:
    'Siblings are lateral navigation, so the surface is a disclosure of real links, not a command menu: keyboard activation, screen-reader link roles, and middle-click come from the native anchors for free. The active level (<code>current: true</code>) renders as text with <code>aria-current="page"</code> and no link. Rows derive from the static <code>[siblings]</code> input through a <code>computed()</code> (Pillar 1); the component self-hides when the list is empty.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxBreadcrumbSiblings',
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
  ],
  moduleImports: [
    "import { CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator } from '@cngx/common/interactive';",
    "import { CngxBreadcrumbSiblings } from '@cngx/ui/breadcrumb';",
  ],
  imports: [
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
    'CngxBreadcrumbSiblings',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    },
    {
      label: 'WAI-ARIA APG: Disclosure pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
    {
      label: 'WAI-ARIA: `aria-current`',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
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
      <li><a cngxBreadcrumbItem href="#/eu">Region EU</a></li>
      <li cngxBreadcrumbSeparator>/</li>
      <li>
        <a cngxBreadcrumbItem>Berlin</a>
        <cngx-breadcrumb-siblings [siblings]="cities" />
      </li>
    </ol>
  </nav>`,
};
