import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Custom placeholder that follows the alternation',
  subtitle:
    'A <code>*cngxTimelineSkeleton</code> under <code>placement="alternate"</code> reads <code>let-side</code>, so each placeholder row sits on the side its content row will take.',
  description:
    'The skeleton slot context carries <code>index</code>, <code>count</code> and <code>side</code> - the same position the built-in placeholder uses. <code>side</code> follows <code>placement</code> and <code>mode</code> (activity mode stays single-sided), so a custom shape that aligns on it lands where the loaded row will, and the swap to content does not jump across the rail. The placeholder stays inside the aria-hidden wrapper; the load is announced through the timeline live region.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxTimeline', 'CngxTimelineSkeleton'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineSkeleton, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineSkeleton',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly feed = createManualState<{ id: number; at: Date; title: string }[]>();

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `private readonly rows = [
    { id: 1, at: new Date('2026-07-20T09:00:00'), title: 'Kick-off' },
    { id: 2, at: new Date('2026-07-20T11:30:00'), title: 'Design review' },
    { id: 3, at: new Date('2026-07-20T14:00:00'), title: 'Build' },
    { id: 4, at: new Date('2026-07-20T16:45:00'), title: 'Release' },
  ];

  protected load(): void {
    this.feed.reset();
    this.feed.set('loading');
    setTimeout(() => this.feed.setSuccess(this.rows), 1400);
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="load()">load (1400ms)</button>
  </div>`,
  template: `<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [skeletonRowCount]="4"
    placement="alternate"
    groupBy="none"
    aria-label="Project milestones"
  >
    <ng-template cngxTimelineSkeleton let-side="side">
      <div
        style="display:grid;gap:6px;margin-bottom:16px;inline-size:45%"
        [style.margin-inline-start]="side === 'end' ? 'auto' : '0'"
      >
        <span style="block-size:12px;inline-size:40%;border-radius:4px;background:color-mix(in oklch, currentColor 14%, transparent)"></span>
        <span style="block-size:12px;border-radius:4px;background:color-mix(in oklch, currentColor 14%, transparent)"></span>
      </div>
    </ng-template>

    <ng-template [cngxTimelineItem]="feed.data()" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0;font-weight:600">{{ event.title }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
