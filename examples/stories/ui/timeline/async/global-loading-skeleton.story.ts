import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Loading skeleton',
  subtitle:
    'Bind <code>[state]</code> and the body follows it. First load draws placeholder rows on the same raster the content will use.',
  description:
    'The timeline owns no latency logic. The loading branch is a <cngx-skeleton>, which already carries show-delay and min-dwell, so a load that resolves faster than the delay never flashes a placeholder at all - throttle the fake loader below it and watch nothing happen. The placeholder rows carry the same class as real rows, so they resolve the same grid areas and the swap to content cannot reflow the page. Every branch comes from resolveAsyncView, the same lookup table the rest of cngx switches on.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['async-state'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxTimeline', 'CngxTimelineItem', 'CngxTimelineItemTpl', 'CngxTimelineTime', 'CngxTime'],
  setup: `protected readonly feed = createManualState<{ id: number; at: Date; summary: string }[]>();

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `private readonly rows = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Import started' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: '12,480 records read' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Import finished' },
  ];

  protected slowLoad(): void {
    this.feed.reset();
    this.feed.set('loading');
    setTimeout(() => this.feed.setSuccess(this.rows), 1200);
  }

  protected fastLoad(): void {
    this.feed.reset();
    this.feed.set('loading');
    // Under the show-delay: the placeholder never renders, so the reader
    // sees content appear rather than a skeleton blink.
    setTimeout(() => this.feed.setSuccess(this.rows), 80);
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="slowLoad()">slow load (1200ms)</button>
    <button type="button" class="chip" (click)="fastLoad()">fast load (80ms)</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ feed.status() }}</span>
    <span class="cngx-ex-status-readout">first load: {{ feed.isFirstLoad() }}</span>
  </div>`,
  template: `<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [skeletonRowCount]="3"
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
