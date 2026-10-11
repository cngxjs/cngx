import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Date and number format',
  subtitle:
    "<code>withTreetableDateFormat</code> and <code>withTreetableNumberFormat</code> set how a default cell renders a <code>Date</code> and a number. Both go through <code>Intl</code> with the treetable's locale.",
  description:
    'The defaults are date-only (<code>Oct 5, 2026</code>) and the <code>Intl.NumberFormat</code> defaults with at most three fraction digits. The formatters are cached per locale and options, not created per cell, and follow a locale switch. Per-instance <code>[options]</code> <code>dateFormat</code> / <code>numberFormat</code> win over the feature; a <code>*cngxCell</code> template still receives the raw value. <code>columnLabels</code> names the headers through the same provider.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['visual-variants', 'integration'],
  apiComponents: ['CngxTreetable'],
  moduleImports: [
    "import { CngxTreetable, provideTreetableAt, withTreetableDateFormat, withTreetableLabels, withTreetableNumberFormat, type CngxTreetableNode } from '@cngx/data-display/treetable';",
  ],
  imports: ['CngxTreetable'],
  viewProviders: [
    "...provideTreetableAt(withTreetableDateFormat({ dateStyle: 'medium' }), withTreetableNumberFormat({ style: 'currency', currency: 'EUR' }), withTreetableLabels({ columnLabels: { item: 'Item', amount: 'Budget', due: 'Due' } }))",
  ],
  setup: `protected readonly budget: CngxTreetableNode<{ item: string; amount: number; due: Date }> = {
  value: { item: 'Platform', amount: 184250.5, due: new Date(2026, 11, 31) },
  children: [
    { value: { item: 'Design system', amount: 62000, due: new Date(2026, 8, 30) } },
    { value: { item: 'Accessibility audit', amount: 18450.75, due: new Date(2026, 10, 15) } },
    { value: { item: 'Data grid', amount: 103799.75, due: new Date(2026, 11, 31) } },
  ],
};`,
  template: `<cngx-treetable [tree]="budget" />`,
};
