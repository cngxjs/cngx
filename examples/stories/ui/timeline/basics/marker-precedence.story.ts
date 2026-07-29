import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: One row, a different dot',
  subtitle:
    'The timeline-wide <code>*cngxTimelineMarkerTpl</code> is the default. A row that projects <code>[cngxTimelineMarkerContent]</code> overrides it, for that row only.',
  description:
    'Both marker paths in one place, because the rule only means something when they compete. Most-local-wins is the same direction every other slot in the family resolves: the more specific binding beats the broader one, so a single milestone can carry its own glyph without the timeline default being torn out for the rest. The dot is aria-hidden either way, so whatever renders there is decoration - the status reaches assistive tech through the config labels.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxTimeline', 'CngxTimelineMarkerTpl', 'CngxTimelineMarkerContent'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineMarkerContent, CngxTimelineMarkerTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineMarkerTpl',
    'CngxTimelineMarkerContent',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Spec agreed', release: false },
    { id: 2, at: new Date('2026-07-20T14:30:00'), summary: 'Implementation merged', release: false },
    { id: 3, at: new Date('2026-07-20T17:05:00'), summary: 'Release 4.2 shipped', release: true },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">rows using the timeline-wide dot</span>
      <span class="event-value">2</span>
    </div>
    <div class="event-row">
      <span class="event-label">rows overriding it</span>
      <span class="event-value">1</span>
    </div>
  </div>`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="none"
    direction="asc"
    aria-label="Release history"
  >
    <!-- Applies to every row that does not say otherwise. -->
    <ng-template [cngxTimelineMarkerTpl]="events">
      <span style="font-size:0.625rem">&#9679;</span>
    </ng-template>

    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        [status]="event.release ? 'done' : 'active'"
        [item]="event"
      >
        <!-- Only the release row carries this, and only it is overridden. -->
        @if (event.release) {
          <span cngxTimelineMarkerContent>&#10003;</span>
        }
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
