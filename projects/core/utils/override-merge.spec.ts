import { computed, Directive, inject, InjectionToken, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { coerceSignal } from './coerce.util';
import { createOverrideMerge } from './override-merge';

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
