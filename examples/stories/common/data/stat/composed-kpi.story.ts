import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStat: Composed KPI',
  subtitle:
    'Label, <code>cngx-metric</code>, <code>cngx-delta</code> and a caption compose into one stat. <code>CngxStat</code> derives a single <code>aria-labelledby</code> so a screen reader reads it as one phrase.',
  description:
    'Each slot registers its generated id; the molecule joins them in reading order into one accessible name ("Revenue, 1.2 M EUR, +5.3% improved, vs. last quarter"). Set aria-live for a KPI whose value updates in place.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxStat'],
  moduleImports: [
    "import { CngxStat, CngxStatLabel, CngxStatValue, CngxStatDelta, CngxStatCaption, CngxMetric, CngxDelta } from '@cngx/common/data';",
  ],
  imports: [
    'CngxStat',
    'CngxStatLabel',
    'CngxStatValue',
    'CngxStatDelta',
    'CngxStatCaption',
    'CngxMetric',
    'CngxDelta',
  ],
  template: `<cngx-stat [live]="'polite'" style="max-width:220px">
    <span cngxStatLabel class="demo-card-label">Revenue</span>
    <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
    <cngx-delta cngxStatDelta [value]="5.3" />
    <span cngxStatCaption class="demo-card-label">vs. last quarter</span>
  </cngx-stat>`,
};
