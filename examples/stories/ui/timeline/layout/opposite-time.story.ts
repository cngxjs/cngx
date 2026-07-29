import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Time across the rail',
  subtitle:
    '<code>[cngxTimelineOpposite]</code> puts per-row content on the far side of the rail from the body. Move the timestamp there and the row becomes the classic left-time history.',
  description:
    'The row raster grows a third track only for rows that actually project into the slot, so markup written before this slot existed keeps its two-track geometry to the pixel. The gate is :has(> [cngxTimelineOpposite]) - the attribute rather than the directive class, so it agrees with the ng-content selector by construction, and a direct child rather than any descendant, because only a direct child can be a grid item at all. Content projected here sits across the rail under every placement, so the same markup keeps working when the rail moves.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxTimelineOpposite', 'CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineOpposite } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineOpposite',
    'CngxTime',
  ],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Branch created' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'First commit pushed' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Review requested' },
    { id: 4, at: new Date('2026-07-21T17:04:00'), summary: 'Merged to main' },
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
        <cngx-time cngxTimelineOpposite [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
