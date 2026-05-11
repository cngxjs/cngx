import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { CngxErrorAggregatorSourceEntry } from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { createErrorAggregatorContract } from './aggregator-contract';
import { errorSourceMapEqual } from './equal-fns';

function makeSources() {
  return signal<ReadonlyMap<string, CngxErrorAggregatorSourceEntry>>(
    new Map(),
    { equal: errorSourceMapEqual },
  );
}

function makeScope(initial = false): {
  contract: CngxErrorScopeContract;
  reveal: () => void;
  reset: () => void;
} {
  const showErrors = signal(initial);
  return {
    contract: {
      showErrors: showErrors.asReadonly(),
      reveal: () => showErrors.set(true),
      reset: () => showErrors.set(false),
    },
    reveal: () => showErrors.set(true),
    reset: () => showErrors.set(false),
  };
}

describe('createErrorAggregatorContract', () => {
  describe('derived signals', () => {
    it('exposes empty surface when sources are empty', () => {
      const sourcesState = makeSources();
      const scope = signal<CngxErrorScopeContract | null>(null);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });

      expect(contract.hasError()).toBe(false);
      expect(contract.errorCount()).toBe(0);
      expect(contract.activeErrors()).toEqual([]);
      expect(contract.errorLabels()).toEqual([]);
      expect(contract.shouldShow()).toBe(false);
      expect(contract.announcement()).toBe('');
    });

    it('reflects active sources reactively', () => {
      const a = signal(false);
      const b = signal(false);
      const sourcesState = makeSources();
      const scope = signal<CngxErrorScopeContract | null>(null);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });

      contract.addSource({ key: 'a', condition: a.asReadonly(), label: 'A' });
      contract.addSource({ key: 'b', condition: b.asReadonly(), label: 'B' });
      TestBed.flushEffects();

      expect(contract.hasError()).toBe(false);
      expect(contract.errorCount()).toBe(0);

      a.set(true);
      TestBed.flushEffects();
      expect(contract.hasError()).toBe(true);
      expect(contract.errorCount()).toBe(1);
      expect(contract.activeErrors()).toEqual(['a']);
      expect(contract.errorLabels()).toEqual(['A']);
      expect(contract.announcement()).toBe('A');

      b.set(true);
      TestBed.flushEffects();
      expect(contract.errorCount()).toBe(2);
      expect(contract.errorLabels()).toEqual(['A', 'B']);
      expect(contract.announcement()).toBe('A, B');
    });

    it('omits labels for entries without a label', () => {
      const a = signal(true);
      const b = signal(true);
      const sourcesState = makeSources();
      const scope = signal<CngxErrorScopeContract | null>(null);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });

      contract.addSource({ key: 'a', condition: a.asReadonly(), label: 'A' });
      contract.addSource({ key: 'b', condition: b.asReadonly(), label: null });
      TestBed.flushEffects();

      expect(contract.errorLabels()).toEqual(['A']);
      expect(contract.announcement()).toBe('A');
    });
  });

  describe('scope gating', () => {
    it('shouldShow collapses to hasError when scope is null', () => {
      const a = signal(true);
      const sourcesState = makeSources();
      const scope = signal<CngxErrorScopeContract | null>(null);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });
      contract.addSource({ key: 'a', condition: a.asReadonly(), label: 'A' });
      TestBed.flushEffects();

      expect(contract.shouldShow()).toBe(true);
    });

    it('shouldShow gates on the supplied scope contract', () => {
      const a = signal(true);
      const sourcesState = makeSources();
      const { contract: scopeContract, reveal, reset } = makeScope(false);
      const scope = signal<CngxErrorScopeContract | null>(scopeContract);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });
      contract.addSource({ key: 'a', condition: a.asReadonly(), label: 'A' });
      TestBed.flushEffects();

      expect(contract.hasError()).toBe(true);
      expect(contract.shouldShow()).toBe(false);
      expect(contract.announcement()).toBe('');

      reveal();
      TestBed.flushEffects();
      expect(contract.shouldShow()).toBe(true);
      expect(contract.announcement()).toBe('A');

      reset();
      TestBed.flushEffects();
      expect(contract.shouldShow()).toBe(false);
    });

    it('reacts to scope reference swap via the scope signal', () => {
      const a = signal(true);
      const sourcesState = makeSources();
      const sA = makeScope(false);
      const sB = makeScope(true);
      const scope = signal<CngxErrorScopeContract | null>(sA.contract);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });
      contract.addSource({ key: 'a', condition: a.asReadonly(), label: 'A' });
      TestBed.flushEffects();
      expect(contract.shouldShow()).toBe(false);

      scope.set(sB.contract);
      TestBed.flushEffects();
      expect(contract.shouldShow()).toBe(true);
    });
  });

  describe('mutators', () => {
    it('addSource adds and removeSource removes', () => {
      const sourcesState = makeSources();
      const scope = signal<CngxErrorScopeContract | null>(null);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });

      const cond = signal(true);
      contract.addSource({ key: 'k', condition: cond.asReadonly(), label: 'K' });
      TestBed.flushEffects();
      expect(contract.activeErrors()).toEqual(['k']);

      contract.removeSource('k');
      TestBed.flushEffects();
      expect(contract.activeErrors()).toEqual([]);
    });

    it('removeSource is idempotent on missing key', () => {
      const sourcesState = makeSources();
      const scope = signal<CngxErrorScopeContract | null>(null);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
      });
      expect(() => contract.removeSource('missing')).not.toThrow();
    });
  });

  // Cascade-witness regression — mirrors the directive-level pattern at
  // error-aggregator.directive.spec.ts:122-186 to lock in that the
  // shared computed graph routes its emissions through the same
  // errorSourceMapEqual + shallowReadonlyArrayEqual contract.
  it('cascade-witness: redundant addSource calls do NOT re-fire downstream effects', () => {
    const a = signal(false);
    const sourcesState = makeSources();
    const scope = signal<CngxErrorScopeContract | null>(null);
    const contract = createErrorAggregatorContract({
      sourcesState,
      scope: scope.asReadonly(),
    });

    const refA = a.asReadonly();
    contract.addSource({ key: 'a', condition: refA, label: 'A' });

    const witness = vi.fn(() => contract.activeErrors());
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

    contract.addSource({ key: 'a', condition: refA, label: 'A' });
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    contract.addSource({ key: 'b', condition: signal(false).asReadonly(), label: 'B' });
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);
  });
});
