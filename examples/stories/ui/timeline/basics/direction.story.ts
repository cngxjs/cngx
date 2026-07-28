import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Direction',
  subtitle:
    '<code>[direction]</code> flips both the band order and the order of rows inside each band.',
  description:
    'desc is the default and reads as an activity feed - the newest thing first. asc reads as a history someone follows from the beginning, which is usually what a narrative timeline wants. The flip is a single sort in the presenter, so bands and rows can never disagree about which way time runs. Rows sharing a timestamp keep their input order in both directions, because the sort is stable.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: ['CngxTimeline', 'CngxTimelineItem', 'CngxTimelineItemTpl', 'CngxTimelineTime', 'CngxTime'],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Draft' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'In review' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Approved' },
    { id: 4, at: new Date('2026-07-21T17:04:00'), summary: 'Published' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `protected readonly order = signal<'asc' | 'desc'>('desc');`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="order.set('desc')">desc (newest first)</button>
    <button type="button" class="chip" (click)="order.set('asc')">asc (oldest first)</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">direction: {{ order() }}</span>
  </div>`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [direction]="order()"
    groupBy="day"
  >
    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0">{{ $any(event).summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
