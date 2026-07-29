import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Filter before the timeline',
  subtitle:
    'The timeline has no filter API and never will. Narrow the list in a <code>computed()</code>, hand it to <code>[items]</code>, and tell the empty surface which of the two empties it is looking at.',
  description:
    'Filtering, searching and paging are orthogonal in cngx: no component injects CngxFilter or CngxPaginate, consumers connect them with a computed(). That keeps one filter usable across a timeline, a table and a chart at once instead of three component-local reimplementations. The one thing the timeline cannot derive is why it is empty - only the consumer knows whether a filter cleared the list or nothing has ever happened - so emptyReason is an input, and the empty slot reads it.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineEmpty, CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTag, CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineTime',
    'CngxTimelineEmpty',
    'CngxTime',
    'CngxTag',
  ],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T08:15:00'), channel: 'deploy', status: 'done', summary: 'api-gateway v4.2 rolled out' },
    { id: 2, at: new Date('2026-07-20T11:02:00'), channel: 'incident', status: 'rejected', summary: 'Checkout latency above budget' },
    { id: 3, at: new Date('2026-07-20T11:48:00'), channel: 'incident', status: 'done', summary: 'Latency back within budget' },
    { id: 4, at: new Date('2026-07-21T09:31:00'), channel: 'deploy', status: 'done', summary: 'search-index v1.9 rolled out' },
    { id: 5, at: new Date('2026-07-21T15:10:00'), channel: 'deploy', status: 'active', summary: 'billing v3.0 canary at 10%' },
  ];

  protected readonly channel = signal<'all' | 'deploy' | 'incident' | 'maintenance'>('all');

  protected readonly visible = computed(() => {
    const channel = this.channel();
    return channel === 'all' ? this.events : this.events.filter((event) => event.channel === channel);
  });

  // The organism cannot infer this: an empty list after a filter run reads
  // differently from a list that has never had anything in it.
  protected readonly reason = computed(() =>
    this.channel() === 'all' ? 'first-use' : 'no-results',
  );

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `protected readonly channels = ['all', 'deploy', 'incident', 'maintenance'] as const;`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    @for (name of channels; track name) {
      <button
        type="button"
        class="chip"
        [attr.aria-pressed]="channel() === name"
        (click)="channel.set(name)"
      >
        {{ name }}
      </button>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">events passed to the timeline</span>
      <span class="event-value">{{ visible().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">emptyReason</span>
      <span class="event-value">{{ reason() }}</span>
    </div>
  </div>`,
  template: `<cngx-timeline
    [items]="visible()"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [emptyReason]="reason()"
    groupBy="day"
    aria-label="Service events"
  >
    <ng-template [cngxTimelineItem]="visible()" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" [status]="event.status">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0 0 4px">{{ event.summary }}</p>
        <cngx-tag>{{ event.channel }}</cngx-tag>
      </cngx-timeline-item>
    </ng-template>

    <ng-template cngxTimelineEmpty let-emptyReason>
      <p style="margin:0">
        {{ emptyReason === 'no-results' ? 'No events on this channel yet.' : 'Nothing has happened yet.' }}
      </p>
    </ng-template>
  </cngx-timeline>`,
};
