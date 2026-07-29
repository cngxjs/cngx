import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Horizontal alternating',
  subtitle:
    'Orientation composes with placement. <code>horizontal</code> plus <code>alternate</code> puts cards above and below one axis, with the year across it.',
  description:
    'The two axes are separate copies of one cascade rather than steps in it, which is what lets orientation combine with placement instead of cancelling it. The organism derives a side per row from the loop index and never a direction - the stylesheet decides which axis that side lives on. So the same rowSide() that flips cards left and right in a vertical run flips them above and below here, and the opposite slot lands across the axis either way. The symmetric outer rows pin the axis to one line however tall each card is.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxTimeline', 'CngxTimelineOpposite'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineOpposite } from '@cngx/common/timeline';",
  ],
  imports: ['CngxTimeline', 'CngxTimelineItem', 'CngxTimelineItemTpl', 'CngxTimelineOpposite'],
  setup: `protected readonly milestones = [
    { id: 1, at: new Date('2019-03-01'), year: '2019', title: 'Founded' },
    { id: 2, at: new Date('2021-06-01'), year: '2021', title: 'First release' },
    { id: 3, at: new Date('2023-09-01'), year: '2023', title: 'Series A' },
    { id: 4, at: new Date('2026-01-01'), year: '2026', title: 'Today' },
  ];

  protected readonly at = (milestone: { at: Date }): Date => milestone.at;
  protected readonly byId = (milestone: { id: number }): number => milestone.id;`,
  template: `<cngx-timeline
    [items]="milestones"
    [dateAccessor]="at"
    [idAccessor]="byId"
    orientation="horizontal"
    placement="alternate"
    rail="continuous"
    direction="asc"
    groupBy="none"
  >
    <ng-template [cngxTimelineItem]="milestones" let-milestone let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <strong cngxTimelineOpposite>{{ milestone.year }}</strong>
        <p style="margin:0">{{ milestone.title }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
