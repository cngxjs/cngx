import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: app-wide labels via provideBreadcrumbConfig',
  subtitle:
    'Set the breadcrumb landmark name and the router <code>dataKey</code> once for a whole sub-tree with <code>provideBreadcrumbConfigAt(...)</code> (or <code>provideBreadcrumbConfig(...)</code> at <code>bootstrapApplication</code>). A per-instance <code>[label]</code> still wins.',
  description:
    'Resolution runs highest-to-lowest: a per-instance <code>[label]</code> / <code>[dataKey]</code> binding, then <code>provideBreadcrumbConfigAt(...)</code> in a component\'s <code>viewProviders</code>, then <code>provideBreadcrumbConfig(...)</code> at the app root, then the English library default. The top bar carries no <code>[label]</code>, so its <code>nav</code> landmark takes the <code>withBreadcrumbAriaLabels({ bar: \'Navigation trail\' })</code> value from the cascade; the bottom bar\'s explicit <code>[label]</code> overrides it. <code>withBreadcrumbDataKey(\'crumb\')</code> feeds the same cascade for router-sync mode (see the router demos) - it is inert here because these bars use static <code>[items]</code>, and is shown to illustrate composing both features in one provider call.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxBreadcrumbBar'],
  moduleImports: [
    "import { CngxBreadcrumbBar, provideBreadcrumbConfigAt, withBreadcrumbAriaLabels, withBreadcrumbDataKey, type CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';",
  ],
  imports: ['CngxBreadcrumbBar'],
  viewProviders: [
    "provideBreadcrumbConfigAt(withBreadcrumbAriaLabels({ bar: 'Navigation trail' }), withBreadcrumbDataKey('crumb'))",
  ],
  setup: `protected readonly trail: readonly CngxBreadcrumbCrumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Reports', href: '/reports' },
    { label: 'Q3 Summary' },
  ];`,
  template: `  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <cngx-breadcrumb [items]="trail" />
    <cngx-breadcrumb [items]="trail" label="Site breadcrumb" />
  </div>`,
  templateChromeBefore: `<p style="margin: 0 0 1rem;">
    Top bar: the <code>nav</code> landmark name comes from the config cascade
    (<code>Navigation trail</code>). Bottom bar: an explicit <code>[label]</code>
    (<code>Site breadcrumb</code>) still wins. Inspect each <code>nav</code>'s
    <code>aria-label</code> to confirm.
  </p>`,
};
