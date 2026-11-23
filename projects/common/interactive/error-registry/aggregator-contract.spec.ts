import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CngxErrorAggregatorSourceEntry } from '../error-aggregator/error-aggregator.token';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { createErrorAggregatorContract } from './aggregator-contract';
import { errorSourceMapEqual } from './equal-fns';

const EN_US = signal('en-US').asReadonly();
const COUNT_EN = (count: number): string => `${count} errors`;

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
        locale: EN_US,
        countAnnouncement: COUNT_EN,
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
        locale: EN_US,
        countAnnouncement: COUNT_EN,
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

    it('joins labels with the locale list format, reading the locale untracked', () => {
      const a = signal(true);
      const b = signal(false);
      const locale = signal('de-DE');
      const sourcesState = makeSources();
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: signal<CngxErrorScopeContract | null>(null).asReadonly(),
        locale: locale.asReadonly(),
        countAnnouncement: COUNT_EN,
      });
      contract.addSource({ key: 'a', condition: a.asReadonly(), label: 'A' });
      contract.addSource({ key: 'b', condition: b.asReadonly(), label: 'B' });
      contract.addSource({ key: 'c', condition: signal(true).asReadonly(), label: 'C' });
      contract.addSource({ key: 'd', condition: signal(true).asReadonly(), label: 'D' });
      TestBed.flushEffects();
      expect(contract.announcement()).toBe('A, C und D');

      locale.set('en-US');
      expect(contract.announcement()).toBe('A, C und D');

      b.set(true);
      expect(contract.announcement()).toBe('A, B, C, D');
    });

    it('omits labels for entries without a label', () => {
      const a = signal(true);
      const b = signal(true);
      const sourcesState = makeSources();
      const scope = signal<CngxErrorScopeContract | null>(null);
      const contract = createErrorAggregatorContract({
        sourcesState,
        scope: scope.asReadonly(),
        locale: EN_US,
        countAnnouncement: COUNT_EN,
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
        locale: EN_US,
        countAnnouncement: COUNT_EN,
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
        locale: EN_US,
        countAnnouncement: COUNT_EN,
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
        locale: EN_US,
        countAnnouncement: COUNT_EN,
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
        locale: EN_US,
        countAnnouncement: COUNT_EN,
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
        locale: EN_US,
        countAnnouncement: COUNT_EN,
      });
      expect(() => contract.removeSource('missing')).not.toThrow();
    });
  });

  // Cascade-witness regression - mirrors the directive-level pattern at
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
      locale: EN_US,
      countAnnouncement: COUNT_EN,
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

describe('createErrorAggregatorContract dev diagnostics', () => {
  it('warns with CNGX1020 when a second source reuses a registered key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const contract = createErrorAggregatorContract({
      sourcesState: makeSources(),
      scope: signal<CngxErrorScopeContract | null>(null).asReadonly(),
      locale: EN_US,
      countAnnouncement: COUNT_EN,
    });

    contract.addSource({ key: 'email', condition: signal(false).asReadonly(), label: 'A' });
    contract.addSource({ key: 'email', condition: signal(true).asReadonly(), label: 'B' });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1020: addSource\(\): an error source with key "email"/),
    );
  });
});

describe('createErrorAggregatorContract duplicate keys', () => {
  afterEach(() => vi.restoreAllMocks());

  function setupDuplicates() {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const contract = createErrorAggregatorContract({
      sourcesState: makeSources(),
      scope: signal<CngxErrorScopeContract | null>(null).asReadonly(),
      locale: EN_US,
      countAnnouncement: COUNT_EN,
    });
    const first: CngxErrorAggregatorSourceEntry = {
      key: 'email',
      condition: signal(true).asReadonly(),
      label: 'First',
    };
    const second: CngxErrorAggregatorSourceEntry = {
      key: 'email',
      condition: signal(false).asReadonly(),
      label: 'Second',
    };
    contract.addSource(first);
    contract.addSource(second);
    return { contract, first, second };
  }

  it('re-surfaces the shadowed source when the later one is removed', () => {
    const { contract, second } = setupDuplicates();
    expect(contract.hasError()).toBe(false);

    contract.removeSource('email', second);
    expect(contract.hasError()).toBe(true);
    expect(contract.errorLabels()).toEqual(['First']);
  });

  it('keeps the later source when the shadowed one is removed', () => {
    const { contract, first, second } = setupDuplicates();
    contract.removeSource('email', first);
    expect(contract.hasError()).toBe(false);

    contract.removeSource('email', second);
    expect(contract.activeErrors()).toEqual([]);
    expect(contract.errorCount()).toBe(0);
  });

  it('matches the owner by condition identity, not by entry object', () => {
    const { contract, second } = setupDuplicates();
    contract.removeSource('email', { ...second, label: 'Renamed' });
    expect(contract.errorLabels()).toEqual(['First']);
  });

  it('drops the key and every shadowed entry when removed without an entry', () => {
    const { contract } = setupDuplicates();
    contract.removeSource('email');
    expect(contract.hasError()).toBe(false);
    expect(contract.errorCount()).toBe(0);
  });

  it('keeps exactly one entry per key across a label change of a duplicate', () => {
    const { contract, first } = setupDuplicates();
    contract.removeSource('email', first);
    contract.addSource({ ...first, label: 'First renamed' });
    expect(contract.activeErrors()).toEqual(['email']);
    expect(contract.errorLabels()).toEqual(['First renamed']);
  });
});

describe('createErrorAggregatorContract count announcement', () => {
  it('announces the count when no active source has a label', () => {
    const a = signal(false);
    const b = signal(false);
    const sourcesState = makeSources();
    const contract = createErrorAggregatorContract({
      sourcesState,
      scope: signal<CngxErrorScopeContract | null>(null).asReadonly(),
      locale: EN_US,
      countAnnouncement: (count) => `${count} open`,
    });
    contract.addSource({ key: 'a', condition: a.asReadonly(), label: null });
    contract.addSource({ key: 'b', condition: b.asReadonly(), label: null });
    expect(contract.announcement()).toBe('');

    a.set(true);
    expect(contract.announcement()).toBe('1 open');
    b.set(true);
    expect(contract.announcement()).toBe('2 open');
  });
});
