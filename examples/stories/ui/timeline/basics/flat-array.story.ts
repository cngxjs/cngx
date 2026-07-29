import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Flat array',
  subtitle:
    'A flat, unsorted list plus a <code>[dateAccessor]</code> is the whole input. The organism buckets by local calendar day and sorts newest-first.',
  description:
    "The source array here is deliberately out of order. Sorting is the presenter's job, not the consumer's - createTimelineGrouping sorts defensively on every run, so data arriving straight from an endpoint needs no pre-processing. Bucketing reads local date fields rather than dividing the epoch, which is what keeps a 23-hour or 25-hour DST day intact. The row template is the one slot with no built-in fallback: only the consumer knows what an event of theirs looks like.",
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition'],
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
    { id: 3, at: new Date('2026-07-21T17:04:00'), summary: 'Merged to main' },
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Branch created' },
    { id: 4, at: new Date('2026-07-21T09:31:00'), summary: 'Review requested' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'First commit pushed' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="day"
  >
    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
