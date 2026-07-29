import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Loader plus a CngxDataSource',
  subtitle:
    'One derivation, two consumers. <code>createAsyncState</code> owns the lifecycle the body switches on; <code>injectDataSource</code> republishes the same rows for anything that speaks the CDK contract.',
  description:
    'The timeline takes the state and nothing else - it never asks where the rows came from. Here they come from an execute() call that a CDK DataSource also wraps, so a cdk-table or a virtual viewport in the same view can consume the identical signal without a second fetch and without the two ever drifting. Load again and the rows stay on screen: the second execute() is no longer a first load, so the body keeps its content instead of dropping back to placeholders.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'async-state'],
  apiComponents: ['CngxTimeline', 'CngxDataSource'],
  moduleImports: [
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { createAsyncState, injectDataSource } from '@cngx/common/data';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly feed = createAsyncState<{ id: number; at: Date; summary: string }[]>();

  // The rows, once. The timeline reads them through [state]; the DataSource
  // republishes the same computed for a CDK consumer sitting next to it.
  private readonly rows = computed(() => this.feed.data() ?? []);
  private readonly source = injectDataSource(this.rows);
  protected readonly streamed = toSignal(this.source.connect(), {
    initialValue: [] as { id: number; at: Date; summary: string }[],
  });

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;

  protected load(): Promise<void> {
    return this.feed.execute(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(this.nextBatch()), 900);
        }),
    );
  }`,
  setupChrome: `private batch = 0;

  private nextBatch(): { id: number; at: Date; summary: string }[] {
    this.batch += 1;
    const day = 19 + this.batch;
    return [
      { id: this.batch * 10 + 1, at: new Date(\`2026-07-\${day}T08:15:00\`), summary: 'Deploy queued' },
      { id: this.batch * 10 + 2, at: new Date(\`2026-07-\${day}T08:41:00\`), summary: 'Canary healthy' },
      { id: this.batch * 10 + 3, at: new Date(\`2026-07-\${day}T09:02:00\`), summary: 'Rollout complete' },
    ];
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="load()">load a batch</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state status</span>
      <span class="event-value">{{ feed.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">rows on the DataSource stream</span>
      <span class="event-value">{{ streamed().length }}</span>
    </div>
  </div>`,
  template: `<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [skeletonRowCount]="3"
    groupBy="day"
    aria-label="Deployment history"
  >
    <ng-template [cngxTimelineItem]="feed.data()" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
