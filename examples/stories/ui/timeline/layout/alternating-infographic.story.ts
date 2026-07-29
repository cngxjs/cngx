import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Alternating infographic',
  subtitle:
    'The classic centred-rail milestone chart: <code>placement="alternate"</code>, <code>rail="continuous"</code>, the year opposite each card and an icon inside every marker.',
  description:
    'Three inputs and one projection slot, on top of the same organism every other timeline demo uses. Alternation comes from the loop index rather than :nth-child, so a filtered list still alternates correctly. The year sits in [cngxTimelineOpposite], which earns a third grid track only because a row projects into it. The enlarged markers show the two-token rule: --cngx-timeline-marker-size sizes the dot, and a projected CngxIcon carries its own --cngx-icon-size, because an atom pins its size on its own host where nothing inherited from the marker reaches it. Below 32rem of container width the alternation collapses to a single side, which is a container query rather than a viewport one, so the same timeline behaves correctly inside a narrow panel on a wide screen.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxTimeline', 'CngxTimelineOpposite'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineMarkerContent, CngxTimelineOpposite } from '@cngx/common/timeline';",
    "import { CngxIcon } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineMarkerContent',
    'CngxTimelineOpposite',
    'CngxIcon',
  ],
  setup: `protected readonly milestones = [
    { id: 1, at: new Date('2019-03-01'), year: '2019', title: 'Founded', body: 'Two people and a rented desk.', glyph: '\\u25CF' },
    { id: 2, at: new Date('2021-06-01'), year: '2021', title: 'First release', body: 'Version 1.0 shipped to eleven customers.', glyph: '\\u25B2' },
    { id: 3, at: new Date('2023-09-01'), year: '2023', title: 'Series A', body: 'The team grew past thirty.', glyph: '\\u25C6' },
    { id: 4, at: new Date('2026-01-01'), year: '2026', title: 'Today', body: 'Four offices, one product.', glyph: '\\u2605' },
  ];

  protected readonly at = (milestone: { at: Date }): Date => milestone.at;
  protected readonly byId = (milestone: { id: number }): number => milestone.id;`,
  template: `<cngx-timeline
    [items]="milestones"
    [dateAccessor]="at"
    [idAccessor]="byId"
    placement="alternate"
    rail="continuous"
    direction="asc"
    groupBy="none"
  >
    <ng-template [cngxTimelineItem]="milestones" let-milestone let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        status="done"
        [style.--cngx-timeline-marker-size]="'32px'"
      >
        <cngx-icon cngxTimelineMarkerContent [style.--cngx-icon-size]="'16px'">
          {{ milestone.glyph }}
        </cngx-icon>
        <strong cngxTimelineOpposite style="font-size:1.25rem">{{ milestone.year }}</strong>
        <h3 style="margin:0 0 4px;font-size:1rem">{{ milestone.title }}</h3>
        <p style="margin:0">{{ milestone.body }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
