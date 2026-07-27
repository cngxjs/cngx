import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_TIMELINE_GROUPING_FACTORY,
  createTimelineGrouping,
  type CngxTimelineGroupingFactory,
  type TimelineGroupBy,
  type TimelineGrouping,
  type TimelineGroupingOptions,
} from './grouping';

interface Entry {
  readonly id: number;
  readonly at: Date;
}

function entry(id: number, at: Date): Entry {
  return { id, at };
}

describe('createTimelineGrouping', () => {
  describe('sorting', () => {
    it('sorts unsorted input defensively, newest first by default', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 22, 9)),
        entry(3, new Date(2026, 6, 21, 9)),
      ]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      expect(groups().map((g) => g.key)).toEqual(['2026-07-22', '2026-07-21', '2026-07-20']);
    });

    it('flips group and item order with direction', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 20, 17)),
        entry(3, new Date(2026, 6, 21, 9)),
      ]);
      const direction = signal<'asc' | 'desc'>('desc');
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        direction,
      });

      expect(groups().map((g) => g.key)).toEqual(['2026-07-21', '2026-07-20']);
      expect(groups()[1].items.map((e) => e.id)).toEqual([2, 1]);

      direction.set('asc');

      expect(groups().map((g) => g.key)).toEqual(['2026-07-20', '2026-07-21']);
      expect(groups()[0].items.map((e) => e.id)).toEqual([1, 2]);
    });

    it('keeps input order for items sharing a timestamp', () => {
      const at = new Date(2026, 6, 20, 9);
      const items = signal([entry(1, at), entry(2, at), entry(3, at)]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      expect(groups()[0].items.map((e) => e.id)).toEqual([1, 2, 3]);
    });

    it('accepts ISO strings and epoch numbers from the accessor', () => {
      const items = signal([
        { id: 1, at: '2026-07-20T09:00:00' } as const,
        { id: 2, at: new Date(2026, 6, 21, 9).getTime() } as const,
      ]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      expect(groups().map((g) => g.key)).toEqual(['2026-07-21', '2026-07-20']);
    });
  });

  describe('local-calendar bucketing', () => {
    // The runner's timezone decides whether these days are 23, 24 or 25
    // hours long. Both assertions hold in all three cases because the
    // grouper reads local date fields; an epoch-division grouper fails
    // them in every zone with a non-zero offset.
    it('keeps a whole local day in one group across a spring-forward transition', () => {
      const items = signal([
        entry(1, new Date(2026, 2, 29, 0, 30)),
        entry(2, new Date(2026, 2, 29, 23, 30)),
      ]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      expect(groups()).toHaveLength(1);
      expect(groups()[0].key).toBe('2026-03-29');
      expect(groups()[0].start.getTime()).toBe(new Date(2026, 2, 29).getTime());
    });

    it('keeps a whole local day in one group across a fall-back transition', () => {
      const items = signal([
        entry(1, new Date(2026, 9, 25, 0, 30)),
        entry(2, new Date(2026, 9, 25, 23, 30)),
      ]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      expect(groups()).toHaveLength(1);
      expect(groups()[0].key).toBe('2026-10-25');
    });

    it('splits adjacent local days that are only an hour apart', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 20, 23, 30)),
        entry(2, new Date(2026, 6, 21, 0, 30)),
      ]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      expect(groups().map((g) => g.key)).toEqual(['2026-07-21', '2026-07-20']);
    });

    it('groups by ISO week, starting Monday', () => {
      // 2026-07-20 is a Monday; the 26th is the Sunday that closes the week.
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 26, 21)),
        entry(3, new Date(2026, 6, 27, 9)),
      ]);
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        groupBy: () => 'week',
      });

      expect(groups().map((g) => g.key)).toEqual(['W2026-07-27', 'W2026-07-20']);
      expect(groups()[1].items.map((e) => e.id)).toEqual([2, 1]);
      expect(groups()[1].start.getDay()).toBe(1);
    });

    it('groups by month, anchored on the first', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 1, 9)),
        entry(2, new Date(2026, 6, 31, 9)),
        entry(3, new Date(2026, 7, 2, 9)),
      ]);
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        groupBy: () => 'month',
      });

      expect(groups().map((g) => g.key)).toEqual(['2026-08', '2026-07']);
      expect(groups()[1].start.getTime()).toBe(new Date(2026, 6, 1).getTime());
    });
  });

  describe("groupBy: 'none'", () => {
    it('collapses everything into one synthetic group in sorted order', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 22, 9)),
        entry(3, new Date(2026, 6, 21, 9)),
      ]);
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        groupBy: () => 'none',
      });

      expect(groups()).toHaveLength(1);
      expect(groups()[0].key).toBe('all');
      expect(groups()[0].items.map((e) => e.id)).toEqual([2, 3, 1]);
      expect(groups()[0].start.getTime()).toBe(new Date(2026, 6, 22, 9).getTime());
    });

    it('yields no group at all for an empty list', () => {
      const items = signal<Entry[]>([]);
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        groupBy: () => 'none',
      });

      expect(groups()).toEqual([]);
    });
  });

  describe('custom grouping function', () => {
    it('buckets by UTC day when the consumer supplies a UTC grouper', () => {
      const utcDay: TimelineGroupBy<Entry> = (date) => {
        const key = date.toISOString().slice(0, 10);
        return { key, start: new Date(`${key}T00:00:00Z`) };
      };
      // Two instants 30 minutes apart around midnight UTC - the same UTC
      // day only under the custom grouper.
      const items = signal([
        entry(1, new Date(Date.UTC(2026, 6, 20, 23, 30))),
        entry(2, new Date(Date.UTC(2026, 6, 20, 0, 30))),
      ]);
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        groupBy: () => utcDay,
      });

      expect(groups()).toHaveLength(1);
      expect(groups()[0].key).toBe('2026-07-20');
      expect(groups()[0].items.map((e) => e.id)).toEqual([1, 2]);
    });

    it('passes the item alongside the date so payload fields can drive bucketing', () => {
      const byChannel: TimelineGroupBy<Entry> = (date, item) => ({
        key: item.id % 2 === 0 ? 'even' : 'odd',
        start: date,
      });
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 21, 9)),
        entry(3, new Date(2026, 6, 22, 9)),
      ]);
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        groupBy: () => byChannel,
      });

      expect(groups().map((g) => g.key)).toEqual(['odd', 'even']);
      expect(groups()[0].items.map((e) => e.id)).toEqual([3, 1]);
    });

    it('switches grouper reactively when the mode signal changes', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 21, 9)),
      ]);
      const groupBy = signal<TimelineGroupBy<Entry>>('day');
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        groupBy,
      });

      expect(groups()).toHaveLength(2);

      groupBy.set('month');

      expect(groups()).toHaveLength(1);
      expect(groups()[0].key).toBe('2026-07');
    });
  });

  describe('reference stability', () => {
    it('returns the identical array reference when nothing changed', () => {
      const items = signal([entry(1, new Date(2026, 6, 20, 9))]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      const first = groups();

      expect(groups()).toBe(first);
    });

    it('keeps the array reference when an unrelated signal forces recomputation', () => {
      const items = signal([entry(1, new Date(2026, 6, 20, 9))]);
      const direction = signal<'asc' | 'desc'>('desc');
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        direction,
      });

      const first = groups();
      // A single group cannot reorder, so the structural `equal` must
      // short-circuit and hand back the very same array.
      direction.set('asc');

      expect(groups()).toBe(first);
    });

    it('appending an item leaves untouched groups at their previous reference', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 21, 9)),
      ]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      const [beforeNewest, beforeOldest] = groups();

      items.update((current) => [...current, entry(3, new Date(2026, 6, 21, 17))]);
      const after = groups();

      expect(after).toHaveLength(2);
      expect(after[0]).not.toBe(beforeNewest);
      expect(after[1]).toBe(beforeOldest);
      expect(after[0].items.map((e) => e.id)).toEqual([3, 2]);
    });

    it('reuses group references across a refetch when idAccessor is supplied', () => {
      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 21, 9)),
      ]);
      const { groups } = createTimelineGrouping({
        items,
        dateAccessor: (e) => e.at,
        idAccessor: (e) => e.id,
      });

      const before = groups();
      // Same payload, all-new object identities - what an HTTP refetch
      // hands back.
      items.set([entry(1, new Date(2026, 6, 20, 9)), entry(2, new Date(2026, 6, 21, 9))]);

      expect(groups()).toBe(before);
    });

    it('re-creates every group reference on a refetch without idAccessor', () => {
      const items = signal([entry(1, new Date(2026, 6, 20, 9))]);
      const { groups } = createTimelineGrouping({ items, dateAccessor: (e) => e.at });

      const before = groups()[0];
      items.set([entry(1, new Date(2026, 6, 20, 9))]);

      expect(groups()[0]).not.toBe(before);
    });
  });

  describe('CNGX_TIMELINE_GROUPING_FACTORY', () => {
    it('resolves to createTimelineGrouping by default', () => {
      TestBed.configureTestingModule({});
      const factory = TestBed.inject(CNGX_TIMELINE_GROUPING_FACTORY);

      expect(factory).toBe(createTimelineGrouping);
    });

    it('honours a consumer override that wraps the default presenter', () => {
      const seen: string[][] = [];
      const wrappingFactory: CngxTimelineGroupingFactory = <T>(
        options: TimelineGroupingOptions<T>,
      ): TimelineGrouping<T> => {
        const inner = createTimelineGrouping<T>(options);
        return {
          // Drop single-item bands and record what the default produced -
          // proof the consumer's logic sits in the real data path.
          groups: computed(() => {
            const produced = inner.groups();
            seen.push(produced.map((g) => g.key));
            return produced.filter((g) => g.items.length > 1);
          }),
        };
      };

      TestBed.configureTestingModule({
        providers: [{ provide: CNGX_TIMELINE_GROUPING_FACTORY, useValue: wrappingFactory }],
      });
      const factory = TestBed.inject(CNGX_TIMELINE_GROUPING_FACTORY);

      expect(factory).toBe(wrappingFactory);

      const items = signal([
        entry(1, new Date(2026, 6, 20, 9)),
        entry(2, new Date(2026, 6, 21, 9)),
        entry(3, new Date(2026, 6, 21, 17)),
      ]);
      const { groups } = factory({ items, dateAccessor: (e: Entry) => e.at });

      expect(groups().map((g) => g.key)).toEqual(['2026-07-21']);
      expect(seen).toEqual([['2026-07-21', '2026-07-20']]);
    });
  });
});
