import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Horizontal bands',
  subtitle:
    'Grouping survives the axis swap: each band becomes a labelled column, its header at the block-start.',
  description:
    'The band is still the presenter\'s unit and still its own role="list" named by its own header, so a screen reader counts items per week exactly as it does in a vertical run. Only the box tree changes: the list flips to a row, each band keeps its own width instead of sharing the container\'s, and the whole run scrolls. That is why the ARIA chain assertion in the spec runs the full placement and orientation matrix rather than one case - the promise is that none of these attributes reach the accessibility tree at all.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-06-29T09:00:00'), summary: 'Kickoff' },
    { id: 2, at: new Date('2026-07-01T14:00:00'), summary: 'Design review' },
    { id: 3, at: new Date('2026-07-07T10:00:00'), summary: 'Build started' },
    { id: 4, at: new Date('2026-07-09T16:00:00'), summary: 'First demo' },
    { id: 5, at: new Date('2026-07-14T11:00:00'), summary: 'Beta cut' },
    { id: 6, at: new Date('2026-07-21T17:00:00'), summary: 'Shipped' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    orientation="horizontal"
    direction="asc"
    groupBy="week"
  >
    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        status="done"
        [style.--cngx-timeline-item-inline-size]="'11rem'"
      >
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
