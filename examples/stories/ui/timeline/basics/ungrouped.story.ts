import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Ungrouped',
  subtitle:
    '<code>groupBy="none"</code> renders one continuous run with no date headers - and shortens the ARIA chain to match.',
  description:
    'Grouped, the chain is list -> group -> listitem, and each group is named by its own date header. Ungrouped, the wrapper drops its role and its header rather than disappearing, so the chain becomes list -> listitem with no unnamed group left behind. That is one derived chain in two configurations rather than two code paths, and it is why the presenter still returns a single synthetic band here instead of a special case. Inspect the rendered markup to see it.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxTimeline'],
  references: [
    {
      label: 'WAI-ARIA: list role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#list',
    },
  ],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: ['CngxTimeline', 'CngxTimelineItem', 'CngxTimelineItemTpl', 'CngxTimelineTime', 'CngxTime'],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-20T09:12:00'), summary: 'Ticket opened' },
    { id: 2, at: new Date('2026-07-20T16:48:00'), summary: 'Assigned to platform' },
    { id: 3, at: new Date('2026-07-21T09:31:00'), summary: 'Root cause identified' },
    { id: 4, at: new Date('2026-07-21T17:04:00'), summary: 'Fix released' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="none"
    aria-label="Incident history"
  >
    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0">{{ $any(event).summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
