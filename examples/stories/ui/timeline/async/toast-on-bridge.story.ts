import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Transition bridge with no wiring',
  subtitle:
    "<code>cngxToastOn</code> sits on the host with no <code>[state]</code> binding of its own and still fires - it reads the timeline's <code>CNGX_STATEFUL</code>.",
  description:
    "This is the producer half of the timeline's state surface. The organism republishes whatever is bound to [state] through CNGX_STATEFUL, and the bridge picks it up with inject(CNGX_STATEFUL, { optional: true }) - element-injector resolution starts at the element the directive sits on, which is the one providing it, so no binding is needed. The token cannot hand out the input object directly - an Input can be rebound or absent, and a bridge that captured it would hold a stale state - so the timeline publishes a façade whose every member forwards to whatever is bound right now. Bind nothing and the façade reports a quiet idle rather than throwing, which is why a bridge can sit inside a timeline that has not been given a state yet. cngxAlertOn and cngxBannerOn compose the same way.",
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'integration'],
  apiComponents: ['CngxTimeline', 'CngxToastOn'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { CngxToastOn } from '@cngx/ui/feedback';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineTime',
    'CngxTime',
    'CngxToastOn',
  ],
  setup: `protected readonly feed = createManualState<{ id: number; at: Date; summary: string }[]>();

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `private readonly rows = [
    { id: 1, at: new Date('2026-07-21T09:31:00'), summary: 'Sync completed' },
  ];

  protected succeed(): void {
    this.feed.reset();
    this.feed.set('loading');
    setTimeout(() => this.feed.setSuccess(this.rows), 400);
  }

  protected fail(): void {
    this.feed.setSuccess(this.rows);
    this.feed.setError(new Error('Sync failed'));
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="succeed()">load ok</button>
    <button type="button" class="chip" (click)="fail()">fail (toasts)</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ feed.status() }}</span>
  </div>`,
  template: `<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="day"
    cngxToastOn
    [toastError]="'Could not sync the timeline'"
  >
    <ng-template [cngxTimelineItem]="feed.data()" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
