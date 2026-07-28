import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Refreshing tail',
  subtitle:
    'A background refresh keeps every row on screen and appends a tail. <code>*cngxTimelineLoadingTail</code> replaces it.',
  description:
    'refreshing over existing content is the one state that would otherwise be invisible: the view stays on content and only aria-busy flips, which tells a sighted reader nothing. The tail sits outside the list rather than inside it, so it never reads as an event of its own, and carries role="status" so the update is announced politely instead of silently. Its default copy comes from CNGX_TIMELINE_CONFIG.labels.refreshing - the slot is for apps that want a spinner or their own wording.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'a11y-pattern'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineLoadingTail, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineLoadingTail',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly feed = createManualState<{ id: number; at: Date; summary: string }[]>();

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `private next = 3;

  private readonly seed = [
    { id: 1, at: new Date('2026-07-21T09:31:00'), summary: 'Deploy queued' },
    { id: 2, at: new Date('2026-07-21T09:44:00'), summary: 'Deploy running' },
  ];

  constructor() {
    this.feed.setSuccess(this.seed);
  }

  protected poll(): void {
    this.feed.set('refreshing');
    setTimeout(() => {
      const grown = [
        ...(this.feed.data() ?? []),
        {
          id: this.next,
          at: new Date(2026, 6, 21, 9, 44 + this.next * 3),
          summary: 'Health check ' + this.next,
        },
      ];
      this.next += 1;
      this.feed.setSuccess(grown);
    }, 1400);
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="poll()">poll for new events</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ feed.status() }}</span>
    <span class="cngx-ex-status-readout">rows: {{ feed.data()?.length ?? 0 }}</span>
  </div>`,
  template: `<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="day"
  >
    <ng-template cngxTimelineLoadingTail>
      <span>Checking for new events&hellip;</span>
    </ng-template>

    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0">{{ $any(event).summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
