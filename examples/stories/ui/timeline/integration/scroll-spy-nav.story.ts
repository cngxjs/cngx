import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Scroll-spy band navigation',
  subtitle:
    'A long history gets a jump nav. <code>CngxScrollSpy</code> watches the rows, the nav resolves the active row back to its band, and the timeline knows about none of it.',
  description:
    'Deep-linking and scroll tracking are v2 timeline features, but a consumer does not have to wait for them: the rows carry consumer-owned ids, CngxScrollSpy observes those ids inside the scroll container, and the nav maps the active id back to a month. Spying on rows rather than on band headers is deliberate - rows tile the container with no gaps, so there is no scroll position where nothing is active. aria-current marks the band the reader is actually in, which is what a screen reader needs from a jump nav.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA aria-current',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
  ],
  apiComponents: ['CngxTimeline', 'CngxScrollSpy'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { CngxScrollSpy } from '@cngx/common/layout';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineTime',
    'CngxTime',
    'CngxScrollSpy',
  ],
  setup: `protected readonly bands = ['March', 'April', 'May', 'June'];

  protected readonly events = this.bands.flatMap((band, index) =>
    ['Planned', 'Started', 'Shipped'].map((stage, step) => ({
      id: index * 10 + step,
      at: new Date(2026, 2 + index, 4 + step * 9, 10, 0),
      summary: stage + ': milestone ' + (index + 1),
    })),
  );

  // The ids the spy observes. The timeline renders them because the item
  // template asks it to, and never reads them back.
  protected readonly rowIds = this.events.map((event) => 'row-' + event.id);

  /** Which band a spied row sits in. The nav highlights that band. */
  protected bandOf(rowId: string | null): string | null {
    const event = this.events.find((candidate) => 'row-' + candidate.id === rowId);
    return event ? this.bands[event.at.getMonth() - 2] : null;
  }

  protected jumpTo(band: string): void {
    const first = this.events.find((event) => this.bands[event.at.getMonth() - 2] === band);
    if (first) {
      document
        .getElementById('row-' + first.id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">rows observed</span>
      <span class="event-value">{{ rowIds.length }}</span>
    </div>
  </div>`,
  template: `<div style="display:flex;gap:16px;align-items:flex-start">
    <nav
      [cngxScrollSpy]="rowIds"
      [root]="'.timeline-scroll'"
      [threshold]="0"
      #spy="cngxScrollSpy"
      aria-label="Jump to month"
      style="position:sticky;top:0;display:flex;flex-direction:column;gap:4px;min-width:96px"
    >
      @for (band of bands; track band) {
        <button
          type="button"
          class="chip"
          [attr.aria-current]="bandOf(spy.activeId()) === band ? 'location' : null"
          [attr.aria-pressed]="bandOf(spy.activeId()) === band"
          (click)="jumpTo(band)"
        >
          {{ band }}
        </button>
      }
    </nav>

    <div class="timeline-scroll" style="flex:1;min-width:0;height:320px;overflow-y:auto;padding-inline:4px">
      <cngx-timeline
        [items]="events"
        [dateAccessor]="at"
        [idAccessor]="byId"
        groupBy="month"
        direction="asc"
        aria-label="Programme milestones"
      >
        <ng-template [cngxTimelineItem]="events" let-event let-last="last">
          <cngx-timeline-item
            [attr.id]="'row-' + event.id"
            [position]="last ? 'last' : 'middle'"
            status="done"
          >
            <cngx-time cngxTimelineTime [date]="event.at" />
            <p style="margin:0">{{ event.summary }}</p>
          </cngx-timeline-item>
        </ng-template>
      </cngx-timeline>
    </div>
  </div>`,
};
