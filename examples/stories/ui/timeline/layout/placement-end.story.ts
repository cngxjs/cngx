import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Rail at the inline end',
  subtitle:
    '<code>placement="end"</code> mirrors every row: the body leads, the rail trails it. One attribute, no template change.',
  description:
    'The organism sets [data-placement] on its host and stamps [data-row-side] on each row wrapper; the row stylesheet reads both off an ancestor and swaps its grid tracks and areas. Nothing about the DOM changes, so the ARIA chain is byte-identical to the default and a screen reader reads the same run in the same order. Everything is logical properties, so dir="rtl" mirrors this again without a second rule. The timestamp follows the raster and hugs the rail from its new side.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Branch created' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'First commit pushed' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Review requested' },
    { id: 4, at: new Date('2026-07-21T17:04:00'), summary: 'Merged to main' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `protected readonly side = signal<'start' | 'end'>('end');`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" [attr.aria-pressed]="side() === 'start'" (click)="side.set('start')">start</button>
    <button type="button" class="chip" [attr.aria-pressed]="side() === 'end'" (click)="side.set('end')">end</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">placement: {{ side() }}</span>
  </div>`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [placement]="side()"
    groupBy="day"
  >
    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
