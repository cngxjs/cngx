import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Horizontal run',
  subtitle:
    '<code>orientation="horizontal"</code> lays the run along the inline axis. The rail becomes the axis, the cards stack away from it.',
  description:
    'One attribute and a transposed stylesheet. The row raster is not restated by the organism - the atoms carry both axes, so a <cngx-timeline-item> in a hand-rolled horizontal layout lays out completely on its own. The run sits behind overflow-x: auto, which makes it keyboard-scrollable natively; no roving tabindex is involved, because v1 rows are content rather than widgets. Everything is logical properties, so the main axis being the inline axis is exactly what makes dir="rtl" reverse the whole run for free.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineMarkerContent, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxIcon, CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineMarkerContent',
    'CngxTimelineTime',
    'CngxIcon',
    'CngxTime',
  ],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Branch created', glyph: '\\u25CF' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'First commit pushed', glyph: '\\u25B2' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Review requested', glyph: '\\u25C6' },
    { id: 4, at: new Date('2026-07-21T17:04:00'), summary: 'Merged to main', glyph: '\\u2605' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    orientation="horizontal"
    direction="asc"
    groupBy="none"
  >
    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        status="done"
        [style.--cngx-timeline-marker-size]="'28px'"
      >
        <cngx-icon cngxTimelineMarkerContent [style.--cngx-icon-size]="'14px'">
          {{ event.glyph }}
        </cngx-icon>
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
