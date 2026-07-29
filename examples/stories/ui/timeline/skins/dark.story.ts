import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Dark mode and status colours',
  subtitle:
    'Every timeline colour chains to a <code>--cngx-color-*</code> foundation token, so dark mode arrives without a single per-token override.',
  description:
    'The family redefines nothing for dark. Each --cngx-timeline-* colour resolves through the foundation tier, which already carries its own light and dark values, so flipping the colour scheme re-themes the timeline for free - and so does overriding --cngx-color-primary for a brand. The four statuses are readable without colour too: upcoming is hollow and dashed on both the dot and the rail, so it stays distinguishable from the neutral rail rather than relying on telling two greys apart. Toggle the page theme to see the whole family move together.',
  level: 'organism',
  audience: ['design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxTimeline'],
  references: [
    {
      label: 'WCAG 1.4.1 Use of Color',
      href: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',
    },
  ],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: ['CngxTimeline', 'CngxTimelineItem', 'CngxTimelineItemTpl', 'CngxTimelineTime', 'CngxTime'],
  setup: `protected readonly events = [
    { id: 1, at: new Date('2026-07-21T17:04:00'), summary: 'Rollout scheduled', status: 'upcoming' },
    { id: 2, at: new Date('2026-07-21T09:31:00'), summary: 'Canary running', status: 'active' },
    { id: 3, at: new Date('2026-07-20T16:48:00'), summary: 'Staging rejected', status: 'rejected' },
    { id: 4, at: new Date('2026-07-20T09:12:00'), summary: 'Build published', status: 'done' },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="day"
    skin="card"
  >
    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        [status]="$any(event).status"
      >
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0">{{ $any(event).summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
