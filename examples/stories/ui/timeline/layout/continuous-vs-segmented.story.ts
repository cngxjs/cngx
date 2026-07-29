import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Continuous vs segmented rail',
  subtitle:
    '<code>rail="continuous"</code> stretches each segment across the row gap so a band reads as one line. Per segment, so the status colours survive.',
  description:
    'The obvious implementation is one line behind the whole run, and it is the wrong one: a single element cannot be red for three rows and dashed for the next two. Continuity is therefore built per segment, each stretching over the inter-row gap to meet the next marker, which is opaque and carries the line through its own diameter. Toggle the rail below and watch the rejected run stay red segment by segment either way. The last segment of a band never stretches, so the gap between groups stays open - a band is a semantic boundary, not a rendering accident.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
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
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Pipeline started', status: 'done' as const },
    { id: 2, at: new Date('2026-07-20T09:31:00'), summary: 'Unit tests passed', status: 'done' as const },
    { id: 3, at: new Date('2026-07-20T09:48:00'), summary: 'Integration tests failed', status: 'rejected' as const },
    { id: 4, at: new Date('2026-07-20T10:02:00'), summary: 'Retry failed again', status: 'rejected' as const },
    { id: 5, at: new Date('2026-07-20T10:20:00'), summary: 'Deploy blocked', status: 'upcoming' as const },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `protected readonly railStyle = signal<'segmented' | 'continuous'>('continuous');`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" [attr.aria-pressed]="railStyle() === 'segmented'" (click)="railStyle.set('segmented')">segmented</button>
    <button type="button" class="chip" [attr.aria-pressed]="railStyle() === 'continuous'" (click)="railStyle.set('continuous')">continuous</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">rail: {{ railStyle() }}</span>
  </div>`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [rail]="railStyle()"
    groupBy="day"
  >
    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" [status]="event.status">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
