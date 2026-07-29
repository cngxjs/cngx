import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Per-row state',
  subtitle:
    'A single row can carry its own <code>[state]</code>. It repaints as rejected and announces the failure without disturbing the rows around it.',
  description:
    "The row keeps two channels apart. status is editorial - where the event sits in the history - while state is whether this row's own data loaded. They compose: a done row whose state fails paints rejected and shows an inline error, but data-status still says done, so a successful retry restores its colour with no bookkeeping on the consumer side. The inline error and the screen-reader status line are read as the row's own content in DOM order, not through aria-describedby: the row host carries no role for a description to resolve against. A row that is merely pending announces the busy label instead of its status, because a row still loading has nothing settled to report.",
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['error-handling', 'async-state'],
  apiComponents: ['CngxTimelineItem'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly attachment = createManualState<string>();

  protected readonly events = [
    { id: 1, at: new Date('2026-07-21T09:31:00'), summary: 'Report generated', local: true },
    { id: 2, at: new Date('2026-07-21T09:12:00'), summary: 'Job started', local: false },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `protected loadAttachment(): void {
    this.attachment.reset();
    this.attachment.set('pending');
    setTimeout(() => this.attachment.setSuccess('report.pdf'), 900);
  }

  protected failAttachment(): void {
    this.attachment.reset();
    this.attachment.set('pending');
    setTimeout(() => this.attachment.setError(new Error('Attachment missing')), 900);
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="loadAttachment()">load attachment</button>
    <button type="button" class="chip" (click)="failAttachment()">fail attachment</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">row state: {{ attachment.status() }}</span>
  </div>`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="none"
  >
    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        [state]="event.local ? attachment : undefined"
        status="done"
      >
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
