import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { createControlledSource } from './controlled-source';

describe('createControlledSource', () => {
  it('lets the priority source win when it yields a value', () => {
    const priority = signal<string | undefined>('controlled');
    const fallback = signal('uncontrolled');

    const source = createControlledSource(priority, fallback);

    expect(source()).toBe('controlled');
  });

  it('falls through to the fallback when priority is absent (no injected source)', () => {
    const fallback = signal('uncontrolled');

    const source = createControlledSource(undefined, fallback);

    expect(source()).toBe('uncontrolled');
  });

  it('falls through to the fallback when priority yields undefined (unbound input)', () => {
    const priority = signal<string | undefined>(undefined);
    const fallback = signal('uncontrolled');

    const source = createControlledSource(priority, fallback);

    expect(source()).toBe('uncontrolled');
  });

  it('reacts as the priority source appears and disappears', () => {
    const priority = signal<string | undefined>(undefined);
    const fallback = signal('uncontrolled');
    const source = createControlledSource(priority, fallback);

    expect(source()).toBe('uncontrolled');

    priority.set('controlled');
    expect(source()).toBe('controlled');

    priority.set(undefined);
    expect(source()).toBe('uncontrolled');
  });

  it('returns the chosen signal own reference - a pass-through, not a fresh literal', () => {
    const value = { crumbs: [1, 2, 3] };
    const priority = signal<typeof value | undefined>(value);
    const fallback = signal({ crumbs: [] as number[] });

    const source = createControlledSource(priority, fallback);

    expect(source()).toBe(value);
  });

  it('is reference-stable across repeated reads of an unchanged source (no equal fn needed)', () => {
    const value = { crumbs: [1, 2, 3] };
    const priority = signal<typeof value | undefined>(value);
    const fallback = signal({ crumbs: [] as number[] });
    const source = createControlledSource(priority, fallback);

    const first = source();
    const second = source();

    expect(Object.is(first, second)).toBe(true);
    expect(first).toBe(value);
  });

  it('does not propagate to a downstream consumer while the source is unchanged', () => {
    const priority = signal<{ n: number } | undefined>({ n: 1 });
    const fallback = signal({ n: 0 });
    const source = createControlledSource(priority, fallback);

    let recomputes = 0;
    const downstream = computed(() => {
      recomputes++;
      return source();
    });

    expect(downstream().n).toBe(1);
    expect(recomputes).toBe(1);

    // repeated reads with no source change must not recompute (pass-through, no cascade)
    downstream();
    downstream();
    expect(recomputes).toBe(1);

    // a genuine change propagates exactly once
    priority.set({ n: 2 });
    expect(downstream().n).toBe(2);
    expect(recomputes).toBe(2);
  });

  it('supports a fallback that itself yields undefined (the overflow TemplateRef shape)', () => {
    type Slot = { readonly id: string };
    const priority = signal<Slot | undefined>(undefined); // a forwarded input, unbound
    const fallback = signal<Slot | undefined>(undefined); // a projected query, unmatched
    const source = createControlledSource<Slot | undefined>(priority, fallback);

    expect(source()).toBeUndefined();

    const projected: Slot = { id: 'projected' };
    fallback.set(projected);
    expect(source()).toBe(projected);

    const forwarded: Slot = { id: 'forwarded' };
    priority.set(forwarded);
    expect(source()).toBe(forwarded);
  });
});
