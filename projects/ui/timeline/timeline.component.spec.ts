import { Component, computed, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CNGX_TIMELINE_GROUPING_FACTORY,
  CngxTimelineDateHeader,
  CngxTimelineItem,
  CngxTimelineItemTpl,
  CngxTimelineMarkerTpl,
  createTimelineGrouping,
  provideTimelineConfig,
  withTimelineLabels,
  withTimelineTemplates,
  type TimelineGroupBy,
} from '@cngx/common/timeline';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxTimeline, type CngxTimelineMode, type CngxTimelineSkin } from './timeline.component';
import {
  CNGX_TIMELINE_VIEW_FACTORY,
  createTimelineView,
  type CngxTimelineViewFactory,
} from './timeline-view';

interface Event {
  readonly id: number;
  readonly at: Date;
  readonly summary: string;
}

const EVENTS: readonly Event[] = [
  { id: 1, at: new Date(2026, 6, 20, 9), summary: 'opened' },
  { id: 2, at: new Date(2026, 6, 21, 9), summary: 'reviewed' },
  { id: 3, at: new Date(2026, 6, 21, 17), summary: 'merged' },
];

@Component({
  selector: 'cngx-timeline-host',
  standalone: true,
  imports: [CngxTimeline, CngxTimelineItemTpl, CngxTimelineDateHeader],
  template: `
    <cngx-timeline
      [items]="items()"
      [dateAccessor]="at"
      [idAccessor]="byId"
      [groupBy]="groupBy()"
      [mode]="mode()"
      [skin]="skin()"
      [attr.aria-label]="null"
    >
      <ng-template cngxTimelineItem let-i="index" let-first="first" let-last="last">
        <span class="row">{{ i }}:{{ first }}:{{ last }}</span>
      </ng-template>
      @if (withHeaderSlot()) {
        <ng-template cngxTimelineDateHeader let-group>
          <span class="slot-header">SLOT {{ group.key }}</span>
        </ng-template>
      }
    </cngx-timeline>
  `,
})
class Host {
  readonly items = signal<readonly Event[]>(EVENTS);
  readonly groupBy = signal<TimelineGroupBy<Event>>('day');
  readonly mode = signal<CngxTimelineMode>('narrative');
  readonly skin = signal<CngxTimelineSkin>('line');
  readonly withHeaderSlot = signal(false);
  readonly at = (event: Event): Date => event.at;
  readonly byId = (event: Event): unknown => event.id;
}

/** Names the timeline the way a consumer does: a plain static attribute. */
@Component({
  selector: 'cngx-timeline-labelled-host',
  standalone: true,
  imports: [CngxTimeline, CngxTimelineItemTpl],
  template: `
    <cngx-timeline [items]="items" [dateAccessor]="at" aria-label="Audit trail">
      <ng-template cngxTimelineItem>x</ng-template>
    </cngx-timeline>
  `,
})
class LabelledHost {
  readonly items = EVENTS;
  readonly at = (event: Event): Date => event.at;
}

function mount(): { host: Host; el: HTMLElement; detect: () => void } {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline');
  if (!el) {
    throw new Error('cngx-timeline did not render');
  }
  return {
    host: fixture.componentInstance,
    el: el as HTMLElement,
    detect: () => fixture.detectChanges(),
  };
}

const text = (el: Element | null): string => (el?.textContent ?? '').trim();

/**
 * The default `groupLabel` formats the band's start date in the browser
 * locale, so the expectation has to be built the same way rather than
 * hardcoded - otherwise the spec only passes in one locale.
 */
const dayLabel = (year: number, monthIndex: number, day: number): string =>
  new Date(year, monthIndex, day).toLocaleDateString();

describe('CngxTimeline', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  describe('rendering', () => {
    it('renders groups and rows in presenter order, newest first', () => {
      const { el } = mount();

      const headers = Array.from(el.querySelectorAll('.cngx-timeline__date-header')).map(text);
      expect(headers).toEqual([dayLabel(2026, 6, 21), dayLabel(2026, 6, 20)]);

      const groups = el.querySelectorAll('.cngx-timeline__group');
      expect(groups[0].querySelectorAll('.cngx-timeline__item')).toHaveLength(2);
      expect(groups[1].querySelectorAll('.cngx-timeline__item')).toHaveLength(1);
    });

    it('feeds each row its position within the group', () => {
      const { el } = mount();

      expect(Array.from(el.querySelectorAll('.row')).map(text)).toEqual([
        '0:true:false',
        '1:false:true',
        '0:true:true',
      ]);
    });

    it('re-renders when the source list changes', () => {
      const { el, host, detect } = mount();

      host.items.set([EVENTS[0]]);
      detect();

      expect(el.querySelectorAll('.cngx-timeline__item')).toHaveLength(1);
      expect(Array.from(el.querySelectorAll('.cngx-timeline__date-header')).map(text)).toEqual([
        dayLabel(2026, 6, 20),
      ]);
    });

    it('renders no list at all when there is nothing to show', () => {
      const { el, host, detect } = mount();

      host.items.set([]);
      detect();

      expect(el.querySelector('.cngx-timeline__list')).toBeNull();
    });

    it('re-groups when groupBy changes', () => {
      const { el, host, detect } = mount();

      host.groupBy.set('month');
      detect();

      expect(el.querySelectorAll('.cngx-timeline__group')).toHaveLength(1);
      expect(el.querySelectorAll('.cngx-timeline__item')).toHaveLength(3);
    });
  });

  describe('host attributes', () => {
    it('derives data-mode from the input', () => {
      const { el, host, detect } = mount();
      expect(el.getAttribute('data-mode')).toBe('narrative');

      host.mode.set('activity');
      detect();

      expect(el.getAttribute('data-mode')).toBe('activity');
    });

    it.each<CngxTimelineSkin>(['line', 'card', 'bands'])(
      'derives data-skin="%s" from the input',
      (skin) => {
        const { el, host, detect } = mount();

        host.skin.set(skin);
        detect();

        expect(el.getAttribute('data-skin')).toBe(skin);
      },
    );
  });

  describe('ARIA chain', () => {
    it('renders group -> list -> listitem when grouped', () => {
      const { el } = mount();

      // One list per band, not one list owning group wrappers: a list may
      // not own a group, and a per-band item count is what AT should report.
      const container = el.querySelector('.cngx-timeline__list');
      expect(container?.getAttribute('role')).toBe('group');

      const bands = Array.from(el.querySelectorAll('.cngx-timeline__group'));
      expect(bands.map((band) => band.getAttribute('role'))).toEqual(['list', 'list']);

      const items = Array.from(el.querySelectorAll('.cngx-timeline__item'));
      expect(items.map((i) => i.getAttribute('role'))).toEqual([
        'listitem',
        'listitem',
        'listitem',
      ]);
    });

    it('gives every listitem a list parent in both configurations', () => {
      const { el, host, detect } = mount();

      const parentsAreLists = (): boolean =>
        Array.from(el.querySelectorAll('[role="listitem"]')).every(
          (item) => item.parentElement?.closest('[role="list"]') !== null,
        );

      expect(parentsAreLists()).toBe(true);

      host.groupBy.set('none');
      detect();

      expect(parentsAreLists()).toBe(true);
    });

    it('names every band by its own header element', () => {
      const { el } = mount();

      for (const group of Array.from(el.querySelectorAll('.cngx-timeline__group'))) {
        const header = group.querySelector('.cngx-timeline__date-header');
        expect(group.getAttribute('aria-labelledby')).toBe(header?.id);
        expect(header?.id).toBeTruthy();
        expect(text(header)).not.toBe('');
      }
    });

    it('keeps the header id resolvable when a custom grouper returns prose keys', () => {
      const { el, host, detect } = mount();

      // The documented escape hatch is exactly this shape - "today / this
      // week / earlier". Whitespace in an id makes the aria-labelledby
      // reference resolve to nothing and the band goes unnamed.
      host.groupBy.set((date) => ({
        key: date.getDate() === 21 ? 'this week' : 'earlier',
        start: date,
      }));
      detect();

      const groups = Array.from(el.querySelectorAll('.cngx-timeline__group'));
      expect(groups).toHaveLength(2);
      for (const group of groups) {
        const id = group.getAttribute('aria-labelledby') ?? '';
        expect(id).not.toMatch(/\s/);
        expect(el.querySelector(`#${id}`)).toBe(group.querySelector('.cngx-timeline__date-header'));
      }
    });

    it('collapses to list -> listitem when ungrouped', () => {
      const { el, host, detect } = mount();

      host.groupBy.set('none');
      detect();

      expect(el.querySelector('.cngx-timeline__list')?.getAttribute('role')).toBe('list');
      const group = el.querySelector('.cngx-timeline__group');
      // presentation, not absent: a role-less wrapper would still own the
      // rows and break listitem's required context.
      expect(group?.getAttribute('role')).toBe('presentation');
      expect(group?.hasAttribute('aria-labelledby')).toBe(false);
      expect(el.querySelectorAll('.cngx-timeline__date-header')).toHaveLength(0);
      expect(Array.from(el.querySelectorAll('.cngx-timeline__item')).map((i) => i.getAttribute('role'))
      ).toEqual(['listitem', 'listitem', 'listitem']);
    });

    it('moves a static aria-label off the host and onto the region it names', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [LabelledHost] });
      const fixture = TestBed.createComponent(LabelledHost);
      fixture.detectChanges();
      const el = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline');

      // Left on the role-less host it would name a generic wrapper and
      // duplicate the list's own name in the accessibility tree.
      expect(el?.hasAttribute('aria-label')).toBe(false);
      expect(el?.querySelector('.cngx-timeline__list')?.getAttribute('aria-label')).toBe(
        'Audit trail',
      );
    });

    it('names the list from the config when the consumer names nothing', () => {
      const { el } = mount();

      expect(el.querySelector('.cngx-timeline__list')?.getAttribute('aria-label')).toBe('Timeline');
    });

    it('takes the list name from a config override', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host],
        providers: [provideTimelineConfig(withTimelineLabels({ timelineRegion: 'Audit trail' }))],
      });
      const { el } = mount();

      expect(el.querySelector('.cngx-timeline__list')?.getAttribute('aria-label')).toBe(
        'Audit trail',
      );
    });
  });

  describe('slot cascade', () => {
    it('falls back to the config groupLabel when no header slot is bound', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host],
        providers: [
          provideTimelineConfig(withTimelineLabels({ groupLabel: (g) => `G:${g.key}` })),
        ],
      });
      const { el } = mount();

      expect(Array.from(el.querySelectorAll('.cngx-timeline__date-header')).map(text)).toEqual([
        'G:2026-07-21',
        'G:2026-07-20',
      ]);
    });

    it('prefers the instance slot over the config template', () => {
      @Component({
        selector: 'cngx-timeline-config-tpl-host',
        standalone: true,
        template: `<ng-template #cfg let-group><span>CFG {{ group.key }}</span></ng-template>`,
      })
      class TplCarrier {
        readonly tpl = viewChild.required('cfg', { read: TemplateRef });
      }

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [TplCarrier] });
      const carrier = TestBed.createComponent(TplCarrier);
      carrier.detectChanges();
      const configTpl = carrier.componentInstance.tpl();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host],
        providers: [provideTimelineConfig(withTimelineTemplates({ dateHeader: configTpl }))],
      });
      const { el, host, detect } = mount();

      // Config tier renders while no instance slot is projected.
      expect(text(el.querySelector('.cngx-timeline__date-header'))).toBe('CFG 2026-07-21');

      host.withHeaderSlot.set(true);
      detect();

      expect(text(el.querySelector('.cngx-timeline__date-header'))).toBe('SLOT 2026-07-21');
    });
  });

  describe('marker slot', () => {
    it('reaches the dot inside a row the consumer wrote', () => {
      @Component({
        selector: 'cngx-timeline-marker-slot-host',
        standalone: true,
        imports: [CngxTimeline, CngxTimelineItemTpl, CngxTimelineMarkerTpl, CngxTimelineItem],
        template: `
          <cngx-timeline [items]="items" [dateAccessor]="at" groupBy="none">
            <ng-template cngxTimelineMarkerTpl let-event let-status="status">
              <span class="glyph">{{ $any(event).id }}/{{ status }}</span>
            </ng-template>
            <ng-template cngxTimelineItem let-event>
              <cngx-timeline-item status="done" [item]="event" />
            </ng-template>
          </cngx-timeline>
        `,
      })
      class MarkerSlotHost {
        readonly items = [EVENTS[0]];
        readonly at = (event: Event): Date => event.at;
      }

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [MarkerSlotHost] });
      const fixture = TestBed.createComponent(MarkerSlotHost);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // The organism never renders the marker itself - this only appears if
      // the template travelled down through CNGX_TIMELINE_MARKER_HOST.
      expect(text(el.querySelector('cngx-timeline-marker .glyph'))).toBe('1/done');
    });
  });

  describe('CNGX_TIMELINE_GROUPING_FACTORY', () => {
    it('renders through a consumer-supplied factory override', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host],
        providers: [
          {
            provide: CNGX_TIMELINE_GROUPING_FACTORY,
            // Keep only the newest band - proof the override sits in the
            // organism's real data path, not beside it.
            useValue: <T,>(options: Parameters<typeof createTimelineGrouping<T>>[0]) => {
              const inner = createTimelineGrouping<T>(options);
              return { groups: () => inner.groups().slice(0, 1) };
            },
          },
        ],
      });
      const { el } = mount();

      expect(el.querySelectorAll('.cngx-timeline__group')).toHaveLength(1);
      expect(text(el.querySelector('.cngx-timeline__date-header'))).toBe(dayLabel(2026, 6, 21));
    });
  });

  describe('CNGX_TIMELINE_VIEW_FACTORY', () => {
    it('renders through a consumer-supplied body-view override', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host],
        providers: [
          {
            provide: CNGX_TIMELINE_VIEW_FACTORY,
            // Force the empty surface over a list that has rows - proof the
            // override drives the real body switch rather than sitting beside it.
            useValue: ((state, isEmpty, labels) => ({
              ...createTimelineView(state, isEmpty, labels),
              activeView: computed(() => 'empty' as const),
              showsContent: computed(() => false),
            })) satisfies CngxTimelineViewFactory,
          },
        ],
      });
      const { el } = mount();

      expect(el.querySelector('.cngx-timeline__list')).toBeNull();
      expect(text(el.querySelector('.cngx-timeline__empty'))).toBe('No events yet.');
    });
  });
});
