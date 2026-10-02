import { computed, Directive, inject, InjectionToken, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { coerceSignal } from './coerce.util';
import {
  createDefaultsFill,
  createNestedOverrideMerge,
  createOverrideMerge,
} from './override-merge';

interface Labels {
  readonly a: string;
  readonly b: string;
}

const DEFAULTS: Labels = { a: 'Open', b: 'Close' };

describe('createOverrideMerge', () => {
  it('propagates a live flip through coerceSignal into a dependent computed', () => {
    const source = signal<Partial<Labels>>({ b: 'Close' });
    const merged = createOverrideMerge(DEFAULTS, coerceSignal(source));
    const label = computed(() => merged().b);

    expect(label()).toBe('Close');
    source.set({ b: 'Schliessen' });
    expect(label()).toBe('Schliessen');
  });

  it('keeps unspecified keys from the defaults', () => {
    const merged = createOverrideMerge(DEFAULTS, { b: 'Schliessen' });
    expect(merged()).toEqual({ a: 'Open', b: 'Schliessen' });
  });

  it('keeps the merged reference when the override is re-set to a key-wise equal object', () => {
    const source = signal<Partial<Labels>>({ b: 'Schliessen' });
    const merged = createOverrideMerge(DEFAULTS, source);
    let runs = 0;
    const downstream = computed(() => {
      runs++;
      return merged().b;
    });

    const first = merged();
    downstream();
    source.set({ b: 'Schliessen' });

    expect(merged()).toBe(first);
    downstream();
    expect(runs).toBe(1);
  });

  it('returns the same signal for the same (defaults, overrides) pair', () => {
    const overrides = { a: 'Oeffnen' };
    expect(createOverrideMerge(DEFAULTS, overrides)).toBe(createOverrideMerge(DEFAULTS, overrides));
    expect(createOverrideMerge(DEFAULTS, undefined)).toBe(createOverrideMerge(DEFAULTS, undefined));
    expect(createOverrideMerge(DEFAULTS, { a: 'Oeffnen' })).not.toBe(
      createOverrideMerge(DEFAULTS, overrides),
    );
  });

  it('shares one signal across instances under one injector', () => {
    const TEST_CONFIG = new InjectionToken<{ labels?: Partial<Labels> }>('TestConfig', {
      providedIn: 'root',
      factory: () => ({ labels: { b: 'Schliessen' } }),
    });

    @Directive({ selector: '[testLabels]' })
    class TestLabels {
      readonly labels: Signal<Labels> = createOverrideMerge(DEFAULTS, inject(TEST_CONFIG).labels);
    }

    const first = TestBed.runInInjectionContext(() => new TestLabels());
    const second = TestBed.runInInjectionContext(() => new TestLabels());

    expect(first.labels).toBe(second.labels);
    expect(first.labels().b).toBe('Schliessen');
  });
});

interface StatusBundle {
  readonly title: string;
  readonly statusLabels: { readonly done: string; readonly errored: string };
}

const STATUS_DEFAULTS: StatusBundle = {
  title: 'Steps',
  statusLabels: { done: 'Done', errored: 'Errored' },
};

describe('createNestedOverrideMerge', () => {
  it('keeps the other nested defaults under a partial nested override', () => {
    const merged = createNestedOverrideMerge(
      STATUS_DEFAULTS,
      { statusLabels: { done: 'Fertig' } },
      'statusLabels',
    );
    expect(merged()).toEqual({
      title: 'Steps',
      statusLabels: { done: 'Fertig', errored: 'Errored' },
    });
  });

  it('merges the top level like a plain spread', () => {
    const merged = createNestedOverrideMerge(
      STATUS_DEFAULTS,
      { title: 'Schritte' },
      'statusLabels',
    );
    expect(merged()).toEqual({ title: 'Schritte', statusLabels: STATUS_DEFAULTS.statusLabels });
  });

  it('follows a live flip of the nested record into a dependent computed', () => {
    const source = signal<{ statusLabels?: Partial<StatusBundle['statusLabels']> }>({});
    const merged = createNestedOverrideMerge(STATUS_DEFAULTS, source, 'statusLabels');
    const done = computed(() => merged().statusLabels.done);

    expect(done()).toBe('Done');
    source.set({ statusLabels: { done: 'Fertig' } });
    expect(done()).toBe('Fertig');
    expect(merged().statusLabels.errored).toBe('Errored');
  });

  it('returns the same signal for the same (defaults, overrides, key)', () => {
    const overrides = { statusLabels: { done: 'Fertig' } };
    expect(createNestedOverrideMerge(STATUS_DEFAULTS, overrides, 'statusLabels')).toBe(
      createNestedOverrideMerge(STATUS_DEFAULTS, overrides, 'statusLabels'),
    );
    expect(createNestedOverrideMerge(STATUS_DEFAULTS, undefined, 'statusLabels')).toBe(
      createNestedOverrideMerge(STATUS_DEFAULTS, undefined, 'statusLabels'),
    );
    expect(createNestedOverrideMerge(STATUS_DEFAULTS, { ...overrides }, 'statusLabels')).not.toBe(
      createNestedOverrideMerge(STATUS_DEFAULTS, overrides, 'statusLabels'),
    );
  });

  it('keeps the merged reference when an override is re-set to an equal nested record', () => {
    const source = signal<{ statusLabels?: Partial<StatusBundle['statusLabels']> }>({
      statusLabels: { done: 'Fertig' },
    });
    const merged = createNestedOverrideMerge(STATUS_DEFAULTS, source, 'statusLabels');
    let runs = 0;
    const downstream = computed(() => {
      runs++;
      return merged().statusLabels.done;
    });

    const first = merged();
    downstream();
    source.set({ statusLabels: { done: 'Fertig' } });

    expect(merged()).toBe(first);
    downstream();
    expect(runs).toBe(1);
  });

  it('accepts only one key, and only one whose value is a record', () => {
    // @ts-expect-error - `title` holds a string, not a record
    createNestedOverrideMerge(STATUS_DEFAULTS, undefined, 'title');
    const either = 'statusLabels' as 'statusLabels' | 'title';
    // @ts-expect-error - a union key would merge only one of its members
    createNestedOverrideMerge(STATUS_DEFAULTS, undefined, either);
    expect(true).toBe(true);
  });

  it('hands out a new reference when a nested value changes', () => {
    const source = signal<{ statusLabels?: Partial<StatusBundle['statusLabels']> }>({});
    const merged = createNestedOverrideMerge(STATUS_DEFAULTS, source, 'statusLabels');
    const first = merged();
    source.set({ statusLabels: { errored: 'Fehler' } });
    expect(merged()).not.toBe(first);
  });
});

describe('createDefaultsFill', () => {
  interface Labels {
    readonly bar?: string;
    readonly menu?: string;
    readonly hint?: string;
  }
  const DEFAULTS = { bar: 'Breadcrumb', menu: 'Menu' };

  it('falls back to the default for a key the override sets to undefined', () => {
    const merged = createOverrideMerge<Labels>(DEFAULTS, { bar: undefined, menu: 'Liste' });
    const filled = createDefaultsFill<Labels>(merged, DEFAULTS);
    expect(merged().bar).toBeUndefined();
    expect(filled()).toEqual({ bar: 'Breadcrumb', menu: 'Liste' });
  });

  it('leaves keys without a default as merged', () => {
    const merged = createOverrideMerge<Labels>(DEFAULTS, { hint: 'Tipp' });
    expect(createDefaultsFill<Labels>(merged, DEFAULTS)().hint).toBe('Tipp');
  });

  it('returns the same signal for the same merged signal', () => {
    const merged = createOverrideMerge<Labels>(DEFAULTS, {});
    expect(createDefaultsFill<Labels>(merged, DEFAULTS)).toBe(
      createDefaultsFill<Labels>(merged, DEFAULTS),
    );
  });

  it('follows a live flip and keeps the reference on an equal recompute', () => {
    const source = signal<Partial<Labels>>({});
    const filled = createDefaultsFill<Labels>(createOverrideMerge<Labels>(DEFAULTS, source), DEFAULTS);
    source.set({ bar: 'Brotkrumen' });
    const german = filled();
    expect(german.bar).toBe('Brotkrumen');

    // Clearing the key falls back, and an equal result keeps the reference.
    source.set({ bar: undefined });
    const fallback = filled();
    expect(fallback.bar).toBe('Breadcrumb');
    source.set({});
    expect(filled()).toBe(fallback);
  });
});
