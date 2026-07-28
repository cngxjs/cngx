import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Group by week and month',
  subtitle:
    'Switch <code>[groupBy]</code> between <code>day</code>, <code>week</code> and <code>month</code>. The band boundaries move; nothing else changes.',
  description:
    'Weeks start on Monday, following ISO, and a band is anchored on its own Monday rather than on a week number - that sidesteps the year-boundary edge cases week numbering brings with it. All three built-ins read local calendar fields. When none of them fits, groupBy also accepts a function returning a key and a start instant, which is how a consumer gets fiscal quarters or UTC days without forking anything.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: ['CngxTimeline', 'CngxTimelineItem', 'CngxTimelineItemTpl', 'CngxTimelineTime', 'CngxTime'],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-06-29T10:00:00'), summary: 'Kickoff' },
    { id: 2, at: new Date('2026-07-02T14:20:00'), summary: 'Spec agreed' },
    { id: 3, at: new Date('2026-07-08T09:05:00'), summary: 'Prototype demoed' },
    { id: 4, at: new Date('2026-07-20T09:12:00'), summary: 'Implementation started' },
    { id: 5, at: new Date('2026-08-03T11:45:00'), summary: 'Shipped' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `protected readonly grouping = signal<'day' | 'week' | 'month'>('week');`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="grouping.set('day')">day</button>
    <button type="button" class="chip" (click)="grouping.set('week')">week</button>
    <button type="button" class="chip" (click)="grouping.set('month')">month</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">groupBy: {{ grouping() }}</span>
  </div>`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [groupBy]="grouping()"
  >
    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0">{{ $any(event).summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
