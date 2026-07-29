import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Media markers',
  subtitle:
    'The dot clips to its circle, so a photo, an avatar or a glyph renders inside it with no extra markup. Sizing has two halves, and they are not the same.',
  description:
    'Bare media is sized by the marker: an img or picture fills the dot edge to edge, an svg insets to --cngx-timeline-marker-glyph-size, and both follow --cngx-timeline-marker-size on their own. A projected CngxAvatar or CngxIcon sizes itself instead, because those atoms pin --cngx-avatar-size / --cngx-icon-size on their own host where nothing inherited from the marker can reach them. So enlarging a marker that holds an atom means setting the marker token and the atom size together, which is what the rows below do. A marker rule reaching for .cngx-avatar--lg would put a sibling atom class in the marker stylesheet at equal specificity, and which one won would depend on stylesheet injection order. The rail follows either way: --cngx-timeline-rail-inset derives from the marker size at the row host, so it meets an enlarged dot centre with no extra wiring. Everything in the marker is inside an aria-hidden element, so it decorates and never carries meaning on its own.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxTimelineMarker', 'CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineMarkerContent, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxAvatar, CngxIcon, CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineMarkerContent',
    'CngxTimelineTime',
    'CngxAvatar',
    'CngxIcon',
    'CngxTime',
  ],
  setup: `protected readonly events = [
    {
      id: 1,
      at: new Date('2026-07-20T09:12:00'),
      summary: 'Photo uploaded - a bare <img> fills the dot and follows the marker token alone',
      kind: 'photo' as const,
    },
    {
      id: 2,
      at: new Date('2026-07-20T16:48:00'),
      summary:
        'Reviewed by Jane - <cngx-avatar size="lg"> is 3rem, paired with a 48px marker on purpose',
      kind: 'avatar' as const,
    },
    {
      id: 3,
      at: new Date('2026-07-21T09:31:00'),
      summary:
        'Released - <cngx-icon> sizes in em against the marker font-size, so pin --cngx-icon-size',
      kind: 'icon' as const,
    },
    {
      id: 4,
      at: new Date('2026-07-21T17:04:00'),
      summary: 'Archived - a bare <svg> insets to the glyph token instead of bleeding to the edge',
      kind: 'svg' as const,
    },
  ];

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  template: `<cngx-timeline
    [items]="events"
    [dateAccessor]="at"
    [idAccessor]="byId"
    groupBy="none"
  >
    <ng-template [cngxTimelineItem]="events" let-event let-last="last">
      <cngx-timeline-item
        [position]="last ? 'last' : 'middle'"
        status="done"
        [style.--cngx-timeline-marker-size]="'48px'"
      >
        @switch (event.kind) {
          @case ('photo') {
            <img
              cngxTimelineMarkerContent
              src="https://picsum.photos/seed/cngx-timeline/96/96"
              alt=""
            />
          }
          @case ('avatar') {
            <cngx-avatar cngxTimelineMarkerContent size="lg" initials="JD" />
          }
          @case ('icon') {
            <cngx-icon cngxTimelineMarkerContent [style.--cngx-icon-size]="'24px'">
              &#9679;
            </cngx-icon>
          }
          @default {
            <svg cngxTimelineMarkerContent viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3h12v3H2zM3 7h10v6H3z" />
            </svg>
          }
        }
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
