import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbRouterSync: route-driven trail',
  subtitle:
    'Add <code>cngxRouterSync</code> and the trail is derived from the activated route tree - every route whose <code>data[dataKey]</code> is a non-empty string contributes a crumb. No <code>[items]</code>: the directive feeds the bar through the <code>CNGX_BREADCRUMB_ITEMS_SOURCE</code> seam, never by writing an input (Pillar 1).',
  description:
    "The directive reads <code>data.breadcrumb</code> by default; here it reads <code>[dataKey]=\"'title'\"</code> because the demo catalogue annotates each route with <code>data.title</code>. The catalogue routes are flat, so the live trail is this one page - the deepest matched crumb, marked <code>aria-current=\"page\"</code>. A real app nests routes, each carrying a breadcrumb label, so the trail is the full ancestor chain:<br><br><code>{ path: 'catalog', data: { breadcrumb: 'Catalog' }, children: [{ path: 'books', data: { breadcrumb: 'Books' } }] }</code><br><br>Every <code>NavigationEnd</code> re-derives the trail; a same-shape navigation keeps the previous <code>crumbs()</code> reference via a shape-based <code>equal</code>, so it does not cascade the bar.",
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbRouterSync'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbRouterSync } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbRouterSync'],
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
  template: `  <cngx-breadcrumb cngxRouterSync [dataKey]="'title'" label="Route breadcrumb" />`,
};
