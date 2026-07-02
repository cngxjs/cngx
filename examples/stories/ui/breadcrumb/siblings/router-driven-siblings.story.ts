import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbSiblingsRouterSync: route-driven siblings',
  subtitle:
    'Add <code>cngxRouterSync</code> and the dropdown derives its rows from the activated route tree - the sibling routes at <code>[depth]</code> whose <code>data[dataKey]</code> is a non-empty string, with the active child marked <code>aria-current="page"</code>. No <code>[siblings]</code>: the directive feeds the component through the <code>CNGX_BREADCRUMB_SIBLINGS_SOURCE</code> seam, never by writing an input (Pillar 1).',
  description:
    "The directive reads <code>data.breadcrumb</code> by default; here it reads <code>[dataKey]=\"'title'\"</code> because the demo catalogue annotates each route with <code>data.title</code>. The catalogue routes are flat, so the level at <code>[depth]=\"1\"</code> has no sibling routes and the dropdown self-hides - there is nothing to render here. A real app nests routes, each carrying a label, so the level yields the full sibling set:<br><br><code>{ path: 'eu', data: { breadcrumb: 'Region EU' }, children: [{ path: 'munich', data: { breadcrumb: 'Munich' } }, { path: 'berlin', data: { breadcrumb: 'Berlin' } }] }</code><br><br>For a runnable nested-route version, open the StackBlitz playground on the <code>CngxBreadcrumbSiblingsRouterSync</code> API page. Every <code>NavigationEnd</code> re-derives the set; a same-shape navigation keeps the previous <code>siblings()</code> reference via a shape-based <code>equal</code>, so it does not cascade.",
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxBreadcrumbSiblings', 'CngxBreadcrumbSiblingsRouterSync'],
  moduleImports: [
    "import { CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator } from '@cngx/common/interactive';",
    "import { CngxBreadcrumbSiblings, CngxBreadcrumbSiblingsRouterSync } from '@cngx/ui/breadcrumb';",
  ],
  imports: [
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
    'CngxBreadcrumbSiblings',
    'CngxBreadcrumbSiblingsRouterSync',
  ],
  references: [
    {
      label: 'Angular Router: `ActivatedRouteSnapshot`',
      href: 'https://angular.dev/api/router/ActivatedRouteSnapshot',
    },
    {
      label: 'WAI-ARIA: `aria-current`',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
  ],
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb">
    <ol>
      <li><a cngxBreadcrumbItem href="#/">Home</a></li>
      <li cngxBreadcrumbSeparator>/</li>
      <li>
        <a cngxBreadcrumbItem>This page</a>
        <cngx-breadcrumb-siblings cngxRouterSync [dataKey]="'title'" [depth]="1" />
      </li>
    </ol>
  </nav>`,
};
