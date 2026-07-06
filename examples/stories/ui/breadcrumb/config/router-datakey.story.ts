import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: router dataKey via provideBreadcrumbConfig',
  subtitle:
    'Set the route-data key the router-sync directives read once for a whole sub-tree with <code>provideBreadcrumbConfigAt(withBreadcrumbDataKey(...))</code> (or <code>provideBreadcrumbConfig(...)</code> at <code>bootstrapApplication</code>). No per-instance <code>[dataKey]</code>: the bar below reads the cascade value.',
  description:
    "The bar carries <code>cngxRouterSync</code> but no <code>[dataKey]</code>, so its key resolves through the cascade to <code>withBreadcrumbDataKey('title')</code> - and the directive derives the trail from the live route's <code>data.title</code> (the examples catalogue annotates every route with <code>data.title</code>). This is the dataKey tier of the same cascade the <code>app-wide-defaults</code> story shows for the ARIA labels, exercised live rather than inert. A per-instance <code>[dataKey]</code> binding would still win over the cascade; the same value also flows to <code>CngxBreadcrumbSiblingsRouterSync</code>.",
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'composition'],
  apiComponents: ['CngxBreadcrumbBar', 'CngxBreadcrumbRouterSync'],
  moduleImports: [
    "import { CngxBreadcrumbBar, CngxBreadcrumbRouterSync, provideBreadcrumbConfigAt, withBreadcrumbDataKey } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxBreadcrumbRouterSync'],
  viewProviders: ["provideBreadcrumbConfigAt(withBreadcrumbDataKey('title'))"],
  template: `  <cngx-breadcrumb cngxRouterSync label="Route breadcrumb" />`,
};
