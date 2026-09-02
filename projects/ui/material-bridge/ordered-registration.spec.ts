import { describe, expect, test, vi } from 'vitest';

import { createOrderedRegistrationSeam } from './ordered-registration';

interface Entry {
  readonly item: string;
}

/**
 * Records the presenter-visible registration order the way the real
 * presenters do: register appends, unregister removes by identity.
 */
function makeHarness() {
  const order: Entry[] = [];
  const created: string[] = [];
  const disposed: Entry[] = [];
  const seam = createOrderedRegistrationSeam<string, Entry>({
    create: (item) => {
      created.push(item);
      return { item };
    },
    register: (entry) => {
      order.push(entry);
    },
    unregister: (entry) => {
      const idx = order.indexOf(entry);
      if (idx >= 0) {
        order.splice(idx, 1);
      }
    },
    dispose: (entry) => {
      disposed.push(entry);
    },
  });
  const registeredItems = () => order.map((e) => e.item);
  return { seam, order, created, disposed, registeredItems };
}

describe('createOrderedRegistrationSeam', () => {
  test('initial sync registers every item in query order', () => {
    const h = makeHarness();
    h.seam.sync(['a', 'b', 'c']);
    expect(h.registeredItems()).toEqual(['a', 'b', 'c']);
    expect(h.created).toEqual(['a', 'b', 'c']);
  });

  test('append-only emission causes zero churn on the existing prefix', () => {
    const h = makeHarness();
    h.seam.sync(['a', 'b']);
    const before = [...h.order];
    h.seam.sync(['a', 'b', 'c']);
    expect(h.registeredItems()).toEqual(['a', 'b', 'c']);
    // Prefix entries were neither re-created nor re-registered.
    expect(h.order[0]).toBe(before[0]);
    expect(h.order[1]).toBe(before[1]);
    expect(h.created).toEqual(['a', 'b', 'c']);
  });

  test('mid-list insert lands at its query index, not at the tail', () => {
    const h = makeHarness();
    h.seam.sync(['a', 'c']);
    const entryC = h.seam.get('c');
    h.seam.sync(['a', 'b', 'c']);
    expect(h.registeredItems()).toEqual(['a', 'b', 'c']);
    // The surviving suffix keeps its entry instance - only its
    // registration slot moved.
    expect(h.seam.get('c')).toBe(entryC);
    expect(h.created).toEqual(['a', 'c', 'b']);
    expect(h.disposed).toEqual([]);
  });

  test('removal unregisters and disposes exactly the removed entry', () => {
    const h = makeHarness();
    h.seam.sync(['a', 'b', 'c']);
    const entryB = h.seam.get('b');
    h.seam.sync(['a', 'c']);
    expect(h.registeredItems()).toEqual(['a', 'c']);
    expect(h.disposed).toEqual([entryB]);
    expect(h.seam.get('b')).toBeUndefined();
  });

  test('reorder emission mirrors the new query order without re-creating entries', () => {
    const h = makeHarness();
    h.seam.sync(['a', 'b', 'c']);
    const entries = ['a', 'b', 'c'].map((i) => h.seam.get(i));
    h.seam.sync(['c', 'a', 'b']);
    expect(h.registeredItems()).toEqual(['c', 'a', 'b']);
    expect(['c', 'a', 'b'].map((i) => h.seam.get(i))).toEqual([entries[2], entries[0], entries[1]]);
    expect(h.created).toEqual(['a', 'b', 'c']);
    expect(h.disposed).toEqual([]);
  });

  test('simultaneous remove + insert at the same index stays order-true', () => {
    const h = makeHarness();
    h.seam.sync(['a', 'b', 'c']);
    h.seam.sync(['a', 'x', 'c']);
    expect(h.registeredItems()).toEqual(['a', 'x', 'c']);
    expect(h.seam.get('b')).toBeUndefined();
    expect(h.disposed.map((e) => e.item)).toEqual(['b']);
  });

  test('clear unregisters and disposes every entry once', () => {
    const h = makeHarness();
    h.seam.sync(['a', 'b']);
    h.seam.clear();
    expect(h.registeredItems()).toEqual([]);
    expect(h.disposed.map((e) => e.item)).toEqual(['a', 'b']);
    expect(h.seam.get('a')).toBeUndefined();
  });

  test('dispose fires after the final unregister for a removed entry', () => {
    const calls: string[] = [];
    const seam = createOrderedRegistrationSeam<string, Entry>({
      create: (item) => ({ item }),
      register: vi.fn(),
      unregister: (entry) => calls.push(`unregister:${entry.item}`),
      dispose: (entry) => calls.push(`dispose:${entry.item}`),
    });
    seam.sync(['a']);
    seam.sync([]);
    expect(calls).toEqual(['unregister:a', 'dispose:a']);
  });
});
