import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Error and retry',
  subtitle:
    'A failed first load replaces the body. A failed refresh keeps the rows on screen and adds the error beneath them.',
  description:
    "Both branches come from the same lookup: error on first load resolves to the error view, error after a prior success resolves to content+error. That second case is the one that matters in practice - dropping a timeline the user was reading because a background poll failed is worse than the failure. Two override tiers are shown side by side. *cngxTimelineRetryButton swaps only the control and leaves the copy on the config cascade, which is what an app with its own button component wants. *cngxTimelineError replaces the whole surface, for when the message and the control have to be written together - it receives the raw error alongside the same retry callback. Either way the callback is the organism's, so (retry) fires exactly once per press.",
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['error-handling', 'async-state'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineError, CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineRetryButton, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineError',
    'CngxTimelineRetryButton',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly feed = createManualState<{ id: number; at: Date; summary: string }[]>();

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;

  // The error slot hands out \`unknown\` - anything can be thrown - and a
  // template cannot narrow it. Narrowing in the component is the fix; a
  // cast in the template would only hide the case where it is not an Error.
  protected readonly messageOf = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unknown error';

  protected onRetry(): void {
    this.feed.set('refreshing');
    setTimeout(() => this.feed.setSuccess(this.rows), 400);
  }`,
  setupChrome: `protected readonly rows = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Webhook delivered' },
    { id: 2, at: new Date('2026-07-21T09:31:00'), summary: 'Webhook retried' },
  ];

  protected readonly retryCount = signal(0);
  protected readonly surface = signal<'button-slot' | 'whole-surface'>('button-slot');

  protected failFirstLoad(): void {
    this.feed.reset();
    this.feed.set('loading');
    this.feed.setError(new Error('Endpoint unreachable'));
  }

  protected failRefresh(): void {
    this.feed.setSuccess(this.rows);
    this.feed.setError(new Error('Refresh failed'));
  }

  protected countRetry(): void {
    this.retryCount.set(this.retryCount() + 1);
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="failFirstLoad()">fail first load</button>
    <button type="button" class="chip" (click)="failRefresh()">fail refresh (keeps rows)</button>
    <button type="button" class="chip" [attr.aria-pressed]="surface() === 'button-slot'" (click)="surface.set('button-slot')">override button only</button>
    <button type="button" class="chip" [attr.aria-pressed]="surface() === 'whole-surface'" (click)="surface.set('whole-surface')">override whole surface</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ feed.status() }}</span>
    <span class="cngx-ex-status-readout">(retry) fired: {{ retryCount() }}</span>
  </div>`,
  template: `<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="day"
    (retry)="onRetry(); countRetry()"
  >
    @if (surface() === 'button-slot') {
      <ng-template cngxTimelineRetryButton let-retry>
        <button type="button" class="chip" (click)="retry()">Try that again</button>
      </ng-template>
    } @else {
      <ng-template cngxTimelineError let-error let-retry="retry">
        <p style="margin:0 0 8px">We could not reach the webhook log: {{ messageOf(error) }}</p>
        <button type="button" class="chip" (click)="retry()">Reconnect</button>
      </ng-template>
    }

    <ng-template [cngxTimelineItem]="feed.data()" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
