import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStatCard: Composed KPI tile',
  subtitle:
    'One <code>&lt;cngx-stat-card&gt;</code> frames a complete dashboard metric: card surface, the four coordinated <code>cngxStat*</code> slots, an inline sparkline and a footer.',
  description:
    'The slot directives are the same atoms <code>cngx-stat</code> uses, not copies. They resolve CNGX_STAT at their declaration site, so the card hosts the shared CngxStatCoordinator brain and re-points the token at it. The whole tile therefore carries one accessible name in reading order rather than four disconnected fragments.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxStatCard'],
  moduleImports: [
    "import { CngxStatCard, CngxStatCardViz, CngxStatCardFooter, CngxStatLabel, CngxStatValue, CngxStatDelta, CngxStatCaption } from '@cngx/ui/stat-card';",
    "import { CngxMetric, CngxDelta } from '@cngx/common/data';",
    "import { CngxCardTimestamp } from '@cngx/common/card';",
    "import { CngxSparkline } from '@cngx/common/chart';",
  ],
  imports: [
    'CngxStatCard',
    'CngxStatCardViz',
    'CngxStatCardFooter',
    'CngxStatLabel',
    'CngxStatValue',
    'CngxStatDelta',
    'CngxStatCaption',
    'CngxMetric',
    'CngxDelta',
    'CngxSparkline',
    'CngxCardTimestamp',
  ],
  setup: `protected readonly trend: readonly number[] = [4, 6, 5, 8, 7, 9, 11, 10, 13];
  protected readonly lastSync = new Date('2026-07-27T09:55:00');`,
  template: `<cngx-stat-card style="max-width:260px">
    <span cngxStatLabel>Revenue</span>
    <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
    <cngx-delta cngxStatDelta [value]="5.3" />
    <span cngxStatCaption>vs. last quarter</span>

    <cngx-sparkline cngxStatCardViz [data]="trend" [width]="220" [height]="36" />

    <cngx-card-timestamp cngxStatCardFooter [date]="lastSync" prefix="Updated" />
  </cngx-stat-card>`,
};
