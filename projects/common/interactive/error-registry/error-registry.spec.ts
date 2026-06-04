import { computed, effect, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { CngxErrorAggregatorContract } from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { CngxErrorRegistry } from './error-registry';

function makeScope(name?: string): CngxErrorScopeContract & {
  revealCount: () => number;
  resetCount: () => number;
} {
  const showErrors = signal(false);
  let revealed = 0;
  let reset = 0;
  return {
    showErrors: showErrors.asReadonly(),
    scopeName: signal(name),
    reveal() {
      revealed++;
      showErrors.set(true);
    },
    reset() {
      reset++;
      showErrors.set(false);
    },
    revealCount: () => revealed,
    resetCount: () => reset,
  };
}

function makeAggregator(active: Signal<boolean>): CngxErrorAggregatorContract {
  const hasError = computed(() => active());
  const errorCount = computed(() => (active() ? 1 : 0));
  const activeErrors = computed(() => (active() ? ['k'] : []));
  const errorLabels = computed(() => (active() ? ['L'] : []));
  const shouldShow = hasError;
  const announcement = computed(() => (active() ? 'L' : ''));
  return {
    hasError,
    errorCount,
    activeErrors,
    errorLabels,
    shouldShow,
    announcement,
    addSource() {
      /* not used in registry tests */
    },
    removeSource() {
      /* not used in registry tests */
    },
  };
}

describe('CngxErrorRegistry', () => {
  function createRegistry(): CngxErrorRegistry {
    TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
    return TestBed.inject(CngxErrorRegistry);
  }

  describe('scope registration', () => {
    it('registers, looks up, and unregisters a named scope', () => {
      const registry = createRegistry();
      const scope = makeScope('checkout');

      expect(registry.getScope('checkout')).toBeUndefined();

      registry.registerScope('checkout', scope);
      expect(registry.getScope('checkout')).toBe(scope);

      registry.unregisterScope('checkout');
      expect(registry.getScope('checkout')).toBeUndefined();
    });

    it('registerScope is idempotent for the same scope reference', () => {
      const registry = createRegistry();
      const scope = makeScope('a');
      registry.registerScope('a', scope);
      registry.registerScope('a', scope);
      expect(registry.getScope('a')).toBe(scope);
    });

    // The internal scopesState signal carries `equal: mapKeySetEqual` (length +
    // key set), so re-registering under an existing name with a fresh
    // reference is absorbed silently — same key set, no emission. This is the
    // cascade-suppression contract; the cascade-witness test below documents
    // the same behaviour for the aggregator surface.

    it('unregisterScope is idempotent on missing name', () => {
      const registry = createRegistry();
      expect(() => registry.unregisterScope('missing')).not.toThrow();
    });
  });

  describe('aggregator registration', () => {
    it('registers, looks up, and unregisters a named aggregator', () => {
      const registry = createRegistry();
      const agg = makeAggregator(signal(false));

      expect(registry.getAggregator('field-a')).toBeUndefined();

      registry.registerAggregator('field-a', agg);
      expect(registry.getAggregator('field-a')).toBe(agg);

      registry.unregisterAggregator('field-a');
      expect(registry.getAggregator('field-a')).toBeUndefined();
    });

  });

  describe('reveal / reset helpers', () => {
    it('reveal(name) calls reveal on the registered scope; no-op when missing', () => {
      const registry = createRegistry();
      const scope = makeScope('a');
      registry.registerScope('a', scope);

      registry.reveal('a');
      expect(scope.revealCount()).toBe(1);

      registry.reveal('missing');
      expect(scope.revealCount()).toBe(1);
    });

    it('reset(name) calls reset on the registered scope; no-op when missing', () => {
      const registry = createRegistry();
      const scope = makeScope('a');
      registry.registerScope('a', scope);
      registry.reveal('a');

      registry.reset('a');
      expect(scope.resetCount()).toBe(1);

      registry.reset('missing');
      expect(scope.resetCount()).toBe(1);
    });

    it('revealAll fires reveal on every registered scope', () => {
      const registry = createRegistry();
      const a = makeScope('a');
      const b = makeScope('b');
      registry.registerScope('a', a);
      registry.registerScope('b', b);

      registry.revealAll();
      expect(a.revealCount()).toBe(1);
      expect(b.revealCount()).toBe(1);
    });

    it('resetAll fires reset on every registered scope', () => {
      const registry = createRegistry();
      const a = makeScope('a');
      const b = makeScope('b');
      registry.registerScope('a', a);
      registry.registerScope('b', b);

      registry.revealAll();
      registry.resetAll();
      expect(a.resetCount()).toBe(1);
      expect(b.resetCount()).toBe(1);
    });
  });

  describe('derived signals', () => {
    it('hasAnyError reflects the union of registered aggregators', () => {
      const registry = createRegistry();
      const a = signal(false);
      const b = signal(false);
      registry.registerAggregator('a', makeAggregator(a.asReadonly()));
      registry.registerAggregator('b', makeAggregator(b.asReadonly()));
      TestBed.flushEffects();

      expect(registry.hasAnyError()).toBe(false);

      a.set(true);
      TestBed.flushEffects();
      expect(registry.hasAnyError()).toBe(true);

      b.set(true);
      a.set(false);
      TestBed.flushEffects();
      expect(registry.hasAnyError()).toBe(true);

      b.set(false);
      TestBed.flushEffects();
      expect(registry.hasAnyError()).toBe(false);
    });

    it('totalErrorCount sums errorCount across registered aggregators', () => {
      const registry = createRegistry();
      const a = signal(false);
      const b = signal(false);
      registry.registerAggregator('a', makeAggregator(a.asReadonly()));
      registry.registerAggregator('b', makeAggregator(b.asReadonly()));
      TestBed.flushEffects();

      expect(registry.totalErrorCount()).toBe(0);

      a.set(true);
      TestBed.flushEffects();
      expect(registry.totalErrorCount()).toBe(1);

      b.set(true);
      TestBed.flushEffects();
      expect(registry.totalErrorCount()).toBe(2);
    });

    it('errorAggregators lists registered aggregators in insertion order', () => {
      const registry = createRegistry();
      const a = makeAggregator(signal(false));
      const b = makeAggregator(signal(false));
      registry.registerAggregator('a', a);
      registry.registerAggregator('b', b);
      TestBed.flushEffects();

      expect(registry.errorAggregators()).toEqual([a, b]);
    });
  });

  // Cascade-witness regression. The registry's two Map signals carry a
  // length-then-key-set `equal` fn (mapKeySetEqual). Re-registering an
  // aggregator under an existing name preserves the key set; the Map
  // `equal` short-circuits the emission so downstream computeds (and any
  // effect reading hasAnyError / totalErrorCount / errorAggregators) do
  // NOT re-fire. Mirrors Phase 6a's commit-5 witness mechanic at
  // error-aggregator.directive.spec.ts:122-186 one layer up.
  it('cascade-witness: redundant adds do NOT re-fire downstream effects', () => {
    const registry = createRegistry();
    const a = signal(false);
    const b = signal(false);
    const c = signal(false);
    const aggA = makeAggregator(a.asReadonly());
    const aggB = makeAggregator(b.asReadonly());
    const aggC = makeAggregator(c.asReadonly());

    registry.registerAggregator('a', aggA);
    registry.registerAggregator('b', aggB);

    const witness = vi.fn(() => registry.totalErrorCount());
    TestBed.runInInjectionContext(() => {
      effect(() => {
        witness();
      });
    });
    TestBed.flushEffects();
    const baseline = witness.mock.calls.length;
    expect(baseline).toBeGreaterThanOrEqual(1);

    a.set(true);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    a.set(true);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    registry.registerAggregator('a', aggA);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    registry.registerAggregator('a', makeAggregator(a.asReadonly()));
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    registry.registerAggregator('c', aggC);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    c.set(true);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 2);

    registry.unregisterAggregator('c');
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 3);

    registry.unregisterAggregator('nonexistent');
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 3);
  });

  it('cascade-witness on hasAnyError mirrors totalErrorCount', () => {
    const registry = createRegistry();
    const a = signal(false);
    const aggA = makeAggregator(a.asReadonly());
    registry.registerAggregator('a', aggA);

    const witness = vi.fn(() => registry.hasAnyError());
    TestBed.runInInjectionContext(() => {
      effect(() => {
        witness();
      });
    });
    TestBed.flushEffects();
    const baseline = witness.mock.calls.length;

    registry.registerAggregator('a', aggA);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline);

    registry.registerAggregator('a', makeAggregator(a.asReadonly()));
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline);
  });

  it('cascade-witness on errorAggregators short-circuits when key set unchanged', () => {
    const registry = createRegistry();
    const aggA = makeAggregator(signal(false));
    registry.registerAggregator('a', aggA);

    const witness = vi.fn(() => registry.errorAggregators().length);
    TestBed.runInInjectionContext(() => {
      effect(() => {
        witness();
      });
    });
    TestBed.flushEffects();
    const baseline = witness.mock.calls.length;

    registry.registerAggregator('a', aggA);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline);

    registry.registerAggregator('a', makeAggregator(signal(false)));
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline);
  });
});
