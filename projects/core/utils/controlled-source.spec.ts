import { signal } from '@angular/core';
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
});
