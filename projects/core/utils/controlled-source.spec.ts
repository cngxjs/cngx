import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { createControlledSource } from './controlled-source';
import { resolveControlledProvenance } from './dev-descriptors';

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

describe('createControlledSource provenance', () => {
  it('resolves priority while the priority source yields a value', () => {
    const source = createControlledSource(signal<string | undefined>('controlled'), signal('x'));

    expect(resolveControlledProvenance(source)).toBe('priority');
  });

  it('resolves fallback while the priority source yields undefined (unbound input)', () => {
    const priority = signal<string | undefined>(undefined);
    const source = createControlledSource(priority, signal('x'));

    expect(resolveControlledProvenance(source)).toBe('fallback');

    priority.set('controlled');
    expect(resolveControlledProvenance(source)).toBe('priority');
  });

  it('resolves fallback when no priority source is present', () => {
    const source = createControlledSource(undefined, signal('x'));

    expect(resolveControlledProvenance(source)).toBe('fallback');
  });

  it('resolves fallback for a null priority value, following the ?? rule', () => {
    const priority = signal<string | null | undefined>(null);
    const source = createControlledSource<string | null>(priority, signal('x'));

    expect(resolveControlledProvenance(source)).toBe('fallback');
  });

  it('resolves undefined instead of throwing when the priority source cannot be read', () => {
    const unset = computed<string | undefined>(() => {
      throw new Error('NG0950: input is required but no value is available yet');
    });
    const source = createControlledSource(unset, signal('x'));

    expect(() => resolveControlledProvenance(source)).not.toThrow();
    expect(resolveControlledProvenance(source)).toBeUndefined();
  });

  it('resolves undefined for a signal the factory did not create', () => {
    expect(resolveControlledProvenance(signal('x'))).toBeUndefined();
  });
});
