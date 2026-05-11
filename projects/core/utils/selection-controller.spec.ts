import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  createSelectionController,
  type CngxSelectionControllerFactory,
  type SelectionController,
} from './selection-controller';

interface Item {
  readonly id: number;
  readonly label: string;
}

describe('createSelectionController', () => {
  describe('initial state', () => {
    it('starts empty: selectedCount 0, isEmpty true, hasSelection false', () => {
      const values = signal<Item[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      expect(c.selectedCount()).toBe(0);
      expect(c.isEmpty()).toBe(true);
      expect(c.hasSelection()).toBe(false);
      expect(c.selected()).toEqual([]);
    });
  });

  describe('select / deselect', () => {
    it('select adds a value', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.select(1);

      expect(values()).toEqual([1]);
      expect(c.selectedCount()).toBe(1);
      expect(c.hasSelection()).toBe(true);
    });

    it('select is idempotent — does not duplicate', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.select(1);
      c.select(1);

      expect(values()).toEqual([1]);
      expect(c.selectedCount()).toBe(1);
    });

    it('deselect removes a value', () => {
      const values = signal<number[]>([1, 2, 3]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.deselect(2);

      expect(values()).toEqual([1, 3]);
    });

    it('deselect on absent value is a no-op (same array reference)', () => {
      const initial = [1, 2];
      const values = signal<number[]>(initial);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.deselect(99);

      expect(values()).toBe(initial);
    });
  });

  describe('toggle', () => {
    it('toggle adds when absent, removes when present', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.toggle(7);
      expect(values()).toEqual([7]);

      c.toggle(7);
      expect(values()).toEqual([]);
    });
  });

  describe('toggleAll', () => {
    it('all-selected input deselects all of them', () => {
      const values = signal<number[]>([1, 2, 3]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.toggleAll([1, 2, 3]);

      expect(values()).toEqual([]);
    });

    it('some-selected input selects the missing ones', () => {
      const values = signal<number[]>([1]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.toggleAll([1, 2, 3]);

      expect(values()).toEqual([1, 2, 3]);
    });

    it('empty input is a no-op', () => {
      const initial = [1, 2];
      const values = signal<number[]>(initial);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.toggleAll([]);

      expect(values()).toBe(initial);
    });
  });

  describe('clear / set', () => {
    it('clear empties the selection', () => {
      const values = signal<number[]>([1, 2, 3]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.clear();

      expect(values()).toEqual([]);
    });

    it('clear on already-empty is a no-op', () => {
      const initial: number[] = [];
      const values = signal<number[]>(initial);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.clear();

      expect(values()).toBe(initial);
    });

    it('set replaces the entire values array (copy, not reference)', () => {
      const values = signal<number[]>([1]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));
      const next = [2, 3, 4];

      c.set(next);

      expect(values()).toEqual([2, 3, 4]);
      expect(values()).not.toBe(next);
    });
  });

  describe('custom keyFn', () => {
    it('matches membership by key, not reference', () => {
      const alice1: Item = { id: 1, label: 'Alice' };
      const alice2: Item = { id: 1, label: 'Alice (refetched)' };
      const values = signal<Item[]>([alice1]);
      const c = TestBed.runInInjectionContext(() =>
        createSelectionController(values, { keyFn: (v) => v.id }),
      );

      expect(c.isSelected(alice2)()).toBe(true);
    });
  });

  describe('per-value signal identity', () => {
    it('isSelected(v) returns the same Signal instance for the same key', () => {
      const values = signal<Item[]>([]);
      const c = TestBed.runInInjectionContext(() =>
        createSelectionController(values, { keyFn: (v) => v.id }),
      );
      const item: Item = { id: 1, label: 'A' };

      const a = c.isSelected(item);
      const b = c.isSelected({ id: 1, label: 'other' });

      expect(a).toBe(b);
    });
  });

  describe('reactivity', () => {
    it('isSelected(v) flips false → true when select is called', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));
      const sig = c.isSelected(42);

      expect(sig()).toBe(false);

      c.select(42);

      expect(sig()).toBe(true);
    });

    it('selectedCount updates on set / clear / toggle', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.set([1, 2, 3]);
      expect(c.selectedCount()).toBe(3);

      c.toggle(4);
      expect(c.selectedCount()).toBe(4);

      c.clear();
      expect(c.selectedCount()).toBe(0);
    });
  });

  describe('tree — isIndeterminate with childrenFn', () => {
    interface Node {
      readonly id: number;
      readonly children?: readonly Node[];
    }
    const leaf = (id: number): Node => ({ id });
    const parent = (id: number, ...cs: Node[]): Node => ({ id, children: cs });

    it('returns false on a leaf when that leaf is selected', () => {
      const lfA = leaf(2);
      const values = signal<Node[]>([lfA]);
      const c = TestBed.runInInjectionContext(() =>
        createSelectionController(values, {
          keyFn: (n) => n.id,
          childrenFn: (n) => n.children ?? [],
        }),
      );

      expect(c.isIndeterminate(lfA)()).toBe(false);
    });

    it('true when SOME but not ALL descendants are selected', () => {
      const a = leaf(2);
      const b = leaf(3);
      const root = parent(1, a, b);
      const values = signal<Node[]>([a]);
      const c = TestBed.runInInjectionContext(() =>
        createSelectionController(values, {
          keyFn: (n) => n.id,
          childrenFn: (n) => n.children ?? [],
        }),
      );

      expect(c.isIndeterminate(root)()).toBe(true);
    });

    it('false when ALL descendants are selected', () => {
      const a = leaf(2);
      const b = leaf(3);
      const root = parent(1, a, b);
      const values = signal<Node[]>([a, b]);
      const c = TestBed.runInInjectionContext(() =>
        createSelectionController(values, {
          keyFn: (n) => n.id,
          childrenFn: (n) => n.children ?? [],
        }),
      );

      expect(c.isIndeterminate(root)()).toBe(false);
    });

    it('cycle guard: a self-referencing childrenFn does not loop', () => {
      const self: { id: number; children: unknown[] } = { id: 1, children: [] };
      self.children.push(self);
      const values = signal<{ id: number; children: unknown[] }[]>([]);
      const c = TestBed.runInInjectionContext(() =>
        createSelectionController(values, {
          keyFn: (n) => n.id,
          childrenFn: (n) => n.children as { id: number; children: unknown[] }[],
        }),
      );

      expect(() => c.isIndeterminate(self)()).not.toThrow();
      expect(c.isIndeterminate(self)()).toBe(false);
    });
  });

  describe('flat — isIndeterminate without childrenFn', () => {
    it('returns the SAME shared Signal<false> constant for every value', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      const a = c.isIndeterminate(1);
      const b = c.isIndeterminate(2);

      expect(a).toBe(b);
      expect(a()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('clears caches and makes isSelected(v)() return false after destroy', () => {
      const values = signal<number[]>([1, 2]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));
      const sig = c.isSelected(1);
      expect(sig()).toBe(true);

      c.destroy();

      expect(c.isSelected(1)()).toBe(false);
      expect(c.isSelected(2)()).toBe(false);
    });

    it('returns the SAME shared post-destroy Signal<false> across all calls and controllers', () => {
      const aValues = signal<number[]>([]);
      const bValues = signal<string[]>([]);
      const a = TestBed.runInInjectionContext(() => createSelectionController(aValues));
      const b = TestBed.runInInjectionContext(() => createSelectionController(bValues));

      a.destroy();
      b.destroy();

      const s1 = a.isSelected(1);
      const s2 = a.isSelected(2);
      const s3 = b.isSelected('x');
      const s4 = a.isIndeterminate(1);

      expect(s1).toBe(s2);
      expect(s1).toBe(s3);
      expect(s1).toBe(s4);
      expect(s1()).toBe(false);
    });

    it('is idempotent — calling destroy twice does not throw', () => {
      const values = signal<number[]>([1]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      c.destroy();
      expect(() => c.destroy()).not.toThrow();
      expect(c.isSelected(1)()).toBe(false);
    });
  });

  describe('cacheLimit', () => {
    it('FIFO-evicts the oldest cached signal when cache size exceeds the limit', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() =>
        createSelectionController(values, { cacheLimit: 3 }),
      );

      const s1First = c.isSelected(1);
      c.isSelected(2);
      c.isSelected(3);
      const s1SameWindow = c.isSelected(1);
      expect(s1SameWindow).toBe(s1First);

      // 4th distinct key → evicts the oldest entry (key=1).
      c.isSelected(4);
      const s1Evicted = c.isSelected(1);

      // Values are equivalent but signal identity must have changed.
      expect(s1Evicted).not.toBe(s1First);
      expect(s1Evicted()).toBe(false);
    });

    it('without cacheLimit, signal-identity holds across 1000+ distinct queries', () => {
      const values = signal<number[]>([]);
      const c = TestBed.runInInjectionContext(() => createSelectionController(values));

      const first = c.isSelected(0);
      for (let i = 1; i < 1100; i++) {
        c.isSelected(i);
      }

      expect(c.isSelected(0)).toBe(first);
    });
  });

  describe('CNGX_SELECTION_CONTROLLER_FACTORY', () => {
    it('default injection resolves to createSelectionController', () => {
      TestBed.configureTestingModule({});
      const factory = TestBed.runInInjectionContext(() =>
        TestBed.inject(CNGX_SELECTION_CONTROLLER_FACTORY),
      );
      expect(factory).toBe(createSelectionController);

      const values = signal<number[]>([]);
      const c = factory(values);
      c.select(1);
      expect(values()).toEqual([1]);
      expect(c.isSelected(1)()).toBe(true);
    });

    it('can be overridden via DI — consumer-supplied factory wraps the default', () => {
      const calls: Array<readonly [unknown[], unknown]> = [];
      const wrappingFactory: CngxSelectionControllerFactory = <T>(
        values: ReturnType<typeof signal<T[]>>,
        options?: Parameters<typeof createSelectionController<T>>[1],
      ): SelectionController<T> => {
        const inner = createSelectionController<T>(values, options);
        // Wrap `select` to record calls — proof the consumer's logic runs.
        return {
          ...inner,
          select(value: T): void {
            calls.push([values(), value]);
            inner.select(value);
          },
        };
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: CNGX_SELECTION_CONTROLLER_FACTORY, useValue: wrappingFactory },
        ],
      });
      const factory = TestBed.runInInjectionContext(() =>
        TestBed.inject(CNGX_SELECTION_CONTROLLER_FACTORY),
      );

      expect(factory).toBe(wrappingFactory);

      const values = signal<string[]>([]);
      const c = factory(values);
      c.select('alpha');

      expect(calls).toEqual([[[], 'alpha']]);
      expect(values()).toEqual(['alpha']);
    });
  });
});
