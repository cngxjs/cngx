import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Custom placeholder row',
  subtitle:
    'Bind <code>*cngxTimelineSkeleton</code> when your rows are taller than the built-in placeholder, so the swap to content does not shove the page.',
  description:
    'The default placeholder is a dot, a rail and two bars - right for a one-line event, too short for a row carrying an avatar and a paragraph. The slot replaces one placeholder row and is rendered skeletonRowCount times, so shaping it to your real row is what keeps the reserved space honest. It stays inside the aria-hidden wrapper whoever supplies it: the load is announced through the timeline live region, never through the placeholder.',
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
  setup: `protected readonly feed = createManualState<{ id: number; at: Date; who: string; note: string }[]>();

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `private readonly rows = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), who: 'Mara', note: 'Filed the incident and paged the on-call rotation.' },
    { id: 2, at: new Date('2026-07-20T09:41:00'), who: 'Ilya', note: 'Rolled the release back to the previous tag.' },
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
    [skeletonRowCount]="2"
    groupBy="day"
    aria-label="Incident log"
  >
    <ng-template cngxTimelineSkeleton>
      <div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;margin-bottom:16px">
        <span style="inline-size:32px;block-size:32px;border-radius:50%;background:color-mix(in oklch, currentColor 14%, transparent)"></span>
        <div style="display:grid;gap:6px">
          <span style="block-size:12px;inline-size:40%;border-radius:4px;background:color-mix(in oklch, currentColor 14%, transparent)"></span>
          <span style="block-size:12px;border-radius:4px;background:color-mix(in oklch, currentColor 14%, transparent)"></span>
          <span style="block-size:12px;inline-size:75%;border-radius:4px;background:color-mix(in oklch, currentColor 14%, transparent)"></span>
        </div>
      </div>
    </ng-template>

    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0 0 4px;font-weight:600">{{ $any(event).who }}</p>
        <p style="margin:0">{{ $any(event).note }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
