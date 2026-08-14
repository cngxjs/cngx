import { describe, it, expect } from 'vitest';
import '@angular/compiler';
import { signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus, CngxAsyncState } from './async-state';
import { buildAsyncStateView } from './build-async-state-view';
import { createAggregateAsyncState } from './aggregate-async-state';

interface LeafInit {
  status?: AsyncStatus;
  data?: unknown;
  isFirstLoad?: boolean;
  lastUpdated?: Date;
}

interface Leaf {
  state: CngxAsyncState<unknown>;
  status: WritableSignal<AsyncStatus>;
  data: WritableSignal<unknown>;
  error: WritableSignal<unknown>;
  isFirstLoad: WritableSignal<boolean>;
  lastUpdated: WritableSignal<Date | undefined>;
}

function leaf(init: LeafInit = {}): Leaf {
  const status = signal<AsyncStatus>(init.status ?? 'idle');
  const data = signal<unknown>(init.data);
  const error = signal<unknown>(undefined);
  const isFirstLoad = signal<boolean>(init.isFirstLoad ?? false);
  const lastUpdated = signal<Date | undefined>(init.lastUpdated);
  const state = buildAsyncStateView({ status, data, error, isFirstLoad, lastUpdated });
  return { state, status, data, error, isFirstLoad, lastUpdated };
}

function aggregateOf(...leaves: Leaf[]) {
  const sources = signal<readonly CngxAsyncState<unknown>[]>(leaves.map((l) => l.state));
  return { agg: createAggregateAsyncState(sources), sources };
}

describe('createAggregateAsyncState', () => {
  describe('combined status rule', () => {
    it('error wins over every other status', () => {
      const { agg } = aggregateOf(
        leaf({ status: 'error' }),
        leaf({ status: 'loading' }),
        leaf({ status: 'success' }),
      );
      expect(agg.status()).toBe('error');
    });

    it('loading/pending beats refreshing', () => {
      const { agg: a } = aggregateOf(leaf({ status: 'refreshing' }), leaf({ status: 'loading' }));
      expect(a.status()).toBe('loading');

      const { agg: b } = aggregateOf(leaf({ status: 'refreshing' }), leaf({ status: 'pending' }));
      expect(b.status()).toBe('loading');
    });

    it('refreshing wins when no error and nothing is loading', () => {
      const { agg } = aggregateOf(leaf({ status: 'refreshing' }), leaf({ status: 'success' }));
      expect(agg.status()).toBe('refreshing');
    });

    it('is success only when every source is success', () => {
      const { agg } = aggregateOf(leaf({ status: 'success' }), leaf({ status: 'success' }));
      expect(agg.status()).toBe('success');
    });

    it('is idle for an empty source list', () => {
      const { agg } = aggregateOf();
      expect(agg.status()).toBe('idle');
    });

    it('mixed success + idle collapses to idle, not success', () => {
      const { agg } = aggregateOf(leaf({ status: 'success' }), leaf({ status: 'idle' }));
      expect(agg.status()).toBe('idle');
    });
  });

  describe('data', () => {
    it('collects per-source data in input order', () => {
      const { agg } = aggregateOf(
        leaf({ status: 'success', data: 1 }),
        leaf({ status: 'success', data: 2 }),
        leaf({ status: 'success', data: 3 }),
      );
      expect(agg.data()).toEqual([1, 2, 3]);
    });

    it('is reference-stable across equal contents (explicit equal)', () => {
      const leaves = [leaf({ status: 'success', data: 1 }), leaf({ status: 'success', data: 2 })];
      const { agg, sources } = aggregateOf(...leaves);

      const first = agg.data();
      // New array reference, identical members: the equal fn must suppress the re-emit.
      sources.set(leaves.map((l) => l.state));
      expect(agg.data()).toBe(first);
    });
  });

  describe('error', () => {
    it('is the first errored source in input order', () => {
      const first = leaf({ status: 'error' });
      const second = leaf({ status: 'error' });
      first.error.set('boom-1');
      second.error.set('boom-2');
      const { agg } = aggregateOf(leaf({ status: 'success' }), first, second);
      expect(agg.error()).toBe('boom-1');
    });
  });

  describe('isEmpty', () => {
    it('is true only when every source is empty', () => {
      const { agg } = aggregateOf(
        leaf({ status: 'success', data: [] }),
        leaf({ status: 'idle' }),
      );
      expect(agg.isEmpty()).toBe(true);
    });

    it('is false when at least one source has data', () => {
      const { agg } = aggregateOf(
        leaf({ status: 'success', data: [] }),
        leaf({ status: 'success', data: [1] }),
      );
      expect(agg.isEmpty()).toBe(false);
    });

    it('is false for an empty source list', () => {
      const { agg } = aggregateOf();
      expect(agg.isEmpty()).toBe(false);
    });
  });

  describe('isFirstLoad', () => {
    it('stays true until every source has loaded once', () => {
      const a = leaf({ isFirstLoad: true });
      const b = leaf({ isFirstLoad: false });
      const { agg } = aggregateOf(a, b);
      expect(agg.isFirstLoad()).toBe(true);

      a.isFirstLoad.set(false);
      expect(agg.isFirstLoad()).toBe(false);
    });
  });

  describe('lastUpdated', () => {
    it('is the max timestamp across sources', () => {
      const older = new Date(1_000);
      const newer = new Date(9_000);
      const { agg } = aggregateOf(
        leaf({ lastUpdated: older }),
        leaf({ lastUpdated: newer }),
      );
      expect(agg.lastUpdated()).toBe(newer);
    });

    it('is undefined when no source has loaded', () => {
      const { agg } = aggregateOf(leaf(), leaf());
      expect(agg.lastUpdated()).toBeUndefined();
    });
  });
});
