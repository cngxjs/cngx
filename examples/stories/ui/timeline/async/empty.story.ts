import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTimeline: Empty reasons',
  subtitle:
    '<code>*cngxTimelineEmpty</code> receives an <code>EmptyReason</code>, so "nothing yet" and "your filter matched nothing" can say different things.',
  description:
    'The organism cannot work the reason out for itself - only the consumer knows whether a filter cleared the list or the account is simply new - so it takes [emptyReason] and forwards it. The vocabulary is the same EmptyReason CngxCardGrid uses, which means an app writes one empty-state component and reuses it across both. Without the slot the body falls back to CNGX_TIMELINE_CONFIG.labels.emptyFallback, which is a sentence rather than a blank area, because an empty surface that says nothing reads as a broken one.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxTimeline'],
  moduleImports: [
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { CngxTimelineEmpty, CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxTimeline',
    'CngxTimelineItem',
    'CngxTimelineItemTpl',
    'CngxTimelineEmpty',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly feed = createManualState<{ id: number; at: Date; summary: string }[]>();
  protected readonly reason = signal<'first-use' | 'no-results' | 'cleared'>('first-use');

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;`,
  setupChrome: `constructor() {
    this.feed.setSuccess([]);
  }

  protected show(next: 'first-use' | 'no-results' | 'cleared'): void {
    this.reason.set(next);
    this.feed.setSuccess([]);
  }

  protected showContent(): void {
    this.feed.setSuccess([
      { id: 1, at: new Date('2026-07-21T09:31:00'), summary: 'Account created' },
    ]);
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="show('first-use')">first-use</button>
    <button type="button" class="chip" (click)="show('no-results')">no-results</button>
    <button type="button" class="chip" (click)="show('cleared')">cleared</button>
    <button type="button" class="chip" (click)="showContent()">with content</button>
  </div>`,
  template: `<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [emptyReason]="reason()"
    groupBy="day"
  >
    <ng-template cngxTimelineEmpty let-reason>
      @switch (reason) {
        @case ('no-results') { <p style="margin:0">No events match this filter.</p> }
        @case ('cleared') { <p style="margin:0">History cleared.</p> }
        @default { <p style="margin:0">Nothing has happened on this account yet.</p> }
      }
    </ng-template>

    <ng-template cngxTimelineItem let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="$any(event).at" />
        <p style="margin:0">{{ $any(event).summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>`,
};
