import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Custom date header and marker',
  subtitle:
    '<code>*cngxTimelineDateHeader</code> receives the whole band; <code>*cngxTimelineMarkerTpl</code> fills the dot.',
  description:
    'The header slot gets the group, not just its date, so a header can fold in the row count without a second pass over the data. It is also the element the group is named by, which means a header rendering nothing leaves that band unnamed - keep something readable in it. The marker template is app-wide but the row is written by the consumer, so it travels down through CNGX_TIMELINE_MARKER_HOST rather than being threaded through the row by hand; bind [item] on the row when that template needs the payload. Whatever it renders sits inside an aria-hidden element, so a glyph there is decoration only - the status still reaches assistive tech through CNGX_TIMELINE_CONFIG.labels.status. Without either slot the header falls back to the config groupLabel and the marker to a bare coloured dot. A single row that needs its own glyph uses [cngxTimelineMarkerContent] projection instead.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineDateHeader, CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineMarkerTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineDateHeader',
    'CngxTimelineMarkerTpl',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Build queued', kind: 'queued' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'Tests green', kind: 'passed' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Deploy rejected', kind: 'failed' },
    { id: 4, at: new Date('2026-07-21T17:04:00'), summary: 'Deploy succeeded', kind: 'passed' },
  ];

  protected readonly glyphs: Record<string, string> = {
    queued: '\\u00b7',
    passed: '\\u2713',
    failed: '\\u2715',
  };

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="day"
  >
    <ng-template cngxTimelineDateHeader let-group>
      <span style="text-transform:uppercase;letter-spacing:0.04em">
        {{ group.start | date: 'fullDate' }}
      </span>
      <span style="opacity:0.7"> &middot; {{ group.items.length }} events</span>
    </ng-template>

    <ng-template cngxTimelineMarkerTpl let-event>
      {{ glyphs[$any(event).kind] }}
    </ng-template>

    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        [item]="event"
        [status]="$any(event).kind === 'failed' ? 'rejected' : 'done'"
      >
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0">{{ $any(event).summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
