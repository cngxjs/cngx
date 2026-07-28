import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Activity vs narrative',
  subtitle:
    '<code>[mode]</code> switches the row raster. <code>narrative</code> stacks the timestamp above the body; <code>activity</code> trails it on one line.',
  description:
    'Same DOM, same ARIA, same slots - only the [data-mode] host attribute changes, and the row stylesheet reads it. narrative is the default and suits a history someone reads; activity packs more rows into the same height, which is what a feed someone scans wants. The raster lives with the row rather than the organism, so a <cngx-timeline-item> in a hand-rolled layout still lays out completely; it defaults to narrative there and picks up activity only when a timeline above it says so.',
  level: 'organism',
  audience: ['design', 'dev'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: ['CngxTimeline', 'CngxTimelineItem', 'CngxTimelineItemTpl', 'CngxTimelineTime', 'CngxTime'],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Signed up' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'Completed onboarding' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Invited two teammates' },
    { id: 4, at: new Date('2026-07-21T17:04:00'), summary: 'Upgraded to Team' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `protected readonly rowMode = signal<'narrative' | 'activity'>('narrative');
  protected readonly look = signal<'line' | 'card' | 'bands'>('line');`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="rowMode.set('narrative')">narrative</button>
    <button type="button" class="chip" (click)="rowMode.set('activity')">activity</button>
    <button type="button" class="chip" (click)="look.set('line')">line</button>
    <button type="button" class="chip" (click)="look.set('card')">card</button>
    <button type="button" class="chip" (click)="look.set('bands')">bands</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">mode: {{ rowMode() }}</span>
    <span class="cngx-ex-status-readout">skin: {{ look() }}</span>
  </div>`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [mode]="rowMode()"
    [skin]="look()"
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
