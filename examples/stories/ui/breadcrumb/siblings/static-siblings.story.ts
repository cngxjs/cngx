import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: per-crumb siblings from the model',
  subtitle:
    'Give a crumb a <code>siblings</code> array and <code>&lt;cngx-breadcrumb [items]&gt;</code> auto-renders the lateral-navigation dropdown for it - no headless trail, no <code>&lt;cngx-breadcrumb-siblings&gt;</code> in your template. The consumer imports only <code>CngxBreadcrumbBar</code>; the organism composes the disclosure.',
  description:
    'The dropdown is a disclosure over real links: keyboard activation, screen-reader link roles, and middle-click come from the native anchors. The active level (<code>current: true</code>) renders as text with <code>aria-current="page"</code> and no link. The bar reads <code>crumb.siblings</code> and renders the dropdown inside that crumb through a <code>computed()</code> (Pillar 1); an empty or absent array renders nothing (the dropdown self-hides). Static data only - router-driven siblings compose through the <code>*cngxBreadcrumbItemAccessory</code> slot instead, so the bar stays free of <code>@angular/router</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbSiblings'],
  moduleImports: [
    "import { CngxBreadcrumbBar } from '@cngx/ui/breadcrumb';",
    "import type { CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar'],
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
  template: `  <cngx-breadcrumb [items]="crumbs" label="Breadcrumb" />`,
};
