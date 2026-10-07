import { computed, Directive, inject, InjectionToken, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { coerceSignal } from './coerce.util';
import {
  createDefaultsFill,
  createFilledOverrideMerge,
  createNestedOverrideMerge,
  createOverrideMerge,
  type CngxNestedOverrides,
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
    const filled = createDefaultsFill<Labels>(
      createOverrideMerge<Labels>(DEFAULTS, source),
      DEFAULTS,
    );
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

  it('treats null like undefined and keeps every other falsy value', () => {
    interface Flags {
      readonly label?: string | null;
      readonly count?: number;
      readonly on?: boolean;
    }
    const base: Flags = { label: 'Label', count: 3, on: true };
    const merged = createOverrideMerge<Flags>(base, { label: null, count: 0, on: false });
    expect(createDefaultsFill<Flags>(merged, base)()).toEqual({
      label: 'Label',
      count: 0,
      on: false,
    });
    const empty = createOverrideMerge<Flags>(base, { label: '' });
    expect(createDefaultsFill<Flags>(empty, base)().label).toBe('');
  });

  it('fills from Signal defaults and follows a defaults switch', () => {
    const defaults = signal<Labels>(DEFAULTS);
    const merged = createOverrideMerge<Labels>(defaults, { bar: undefined });
    const filled = createDefaultsFill<Labels>(merged, defaults);
    expect(filled().bar).toBe('Breadcrumb');
    defaults.set({ bar: 'Brotkrumen', menu: 'Menue' });
    expect(filled()).toEqual({ bar: 'Brotkrumen', menu: 'Menue' });
  });

  it('keeps the reference on an equal recompute with Signal defaults', () => {
    const defaults = signal<Labels>(DEFAULTS);
    const filled = createDefaultsFill<Labels>(
      createOverrideMerge<Labels>(defaults, { menu: 'Liste' }),
      defaults,
    );
    const first = filled();
    defaults.set({ ...DEFAULTS });
    expect(filled()).toBe(first);
  });

  it('memoizes per defaults as well as per merged signal', () => {
    const merged = createOverrideMerge<Labels>(DEFAULTS, { bar: undefined });
    const other = { bar: 'Pfad', menu: 'Menue' };
    expect(createDefaultsFill<Labels>(merged, other)().bar).toBe('Pfad');
    expect(createDefaultsFill<Labels>(merged, DEFAULTS)().bar).toBe('Breadcrumb');
  });

  describe('with a nested record key', () => {
    interface Bundle {
      readonly title: string;
      readonly status: { readonly ok: string; readonly failed: string };
    }
    const BUNDLE: Bundle = { title: 'Status', status: { ok: 'OK', failed: 'Failed' } };

    it('fills unset keys at the top level and inside the nested record', () => {
      const merged = createNestedOverrideMerge<Bundle, 'status'>(
        BUNDLE,
        { title: undefined, status: { ok: undefined, failed: 'Fehler' } },
        'status',
      );
      const filled = createDefaultsFill<Bundle, 'status'>(merged, BUNDLE, 'status');
      expect(filled()).toEqual({ title: 'Status', status: { ok: 'OK', failed: 'Fehler' } });
    });

    it('fills from Signal defaults and keeps the reference on an equal recompute', () => {
      const defaults = signal<Bundle>(BUNDLE);
      const source = signal<CngxNestedOverrides<Bundle, 'status'>>({ status: { ok: undefined } });
      const filled = createDefaultsFill<Bundle, 'status'>(
        createNestedOverrideMerge<Bundle, 'status'>(defaults, source, 'status'),
        defaults,
        'status',
      );
      const first = filled();
      expect(first.status.ok).toBe('OK');
      source.set({ status: { ok: undefined } });
      expect(filled()).toBe(first);
      defaults.set({ title: 'Zustand', status: { ok: 'Gut', failed: 'Fehler' } });
      expect(filled()).toEqual({ title: 'Zustand', status: { ok: 'Gut', failed: 'Fehler' } });
    });

    it('returns a separate signal from the flat fill of the same merge', () => {
      const merged = createNestedOverrideMerge<Bundle, 'status'>(BUNDLE, {}, 'status');
      expect(createDefaultsFill<Bundle, 'status'>(merged, BUNDLE, 'status')).toBe(
        createDefaultsFill<Bundle, 'status'>(merged, BUNDLE, 'status'),
      );
      expect(createDefaultsFill<Bundle>(merged, BUNDLE)).not.toBe(
        createDefaultsFill<Bundle, 'status'>(merged, BUNDLE, 'status'),
      );
    });
  });
});

describe('createFilledOverrideMerge', () => {
  interface Copy {
    readonly bar: string;
    readonly menu: string;
  }
  const COPY: Copy = { bar: 'Breadcrumb', menu: 'Menu' };

  it('merges the override and fills an unset key from the defaults', () => {
    const filled = createFilledOverrideMerge<Copy>(COPY, { bar: undefined, menu: 'Liste' });
    expect(filled()).toEqual({ bar: 'Breadcrumb', menu: 'Liste' });
  });

  it('follows Signal defaults and keeps the reference on an equal recompute', () => {
    const defaults = signal<Copy>(COPY);
    const filled = createFilledOverrideMerge<Copy>(defaults, { menu: 'Liste' });
    const first = filled();
    defaults.set({ ...COPY });
    expect(filled()).toBe(first);
    defaults.set({ bar: 'Pfad', menu: 'Menue' });
    expect(filled()).toEqual({ bar: 'Pfad', menu: 'Liste' });
  });

  it('returns the same signal for the same defaults and overrides', () => {
    const overrides = { menu: 'Liste' };
    expect(createFilledOverrideMerge<Copy>(COPY, overrides)).toBe(
      createFilledOverrideMerge<Copy>(COPY, overrides),
    );
  });
});
