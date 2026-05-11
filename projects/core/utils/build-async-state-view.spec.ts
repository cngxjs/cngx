import { describe, it, expect } from 'vitest';
import '@angular/compiler';
import { computed, signal } from '@angular/core';
import type { AsyncStatus } from './async-state';
import { buildAsyncStateView } from './build-async-state-view';

function createSources<T>(initial?: { status?: AsyncStatus; data?: T }) {
  const status = signal<AsyncStatus>(initial?.status ?? 'idle');
  const data = signal<T | undefined>(initial?.data);
  const error = signal<unknown>(undefined);
  const progress = signal<number | undefined>(undefined);
  const lastUpdated = signal<Date | undefined>(undefined);
  return { status, data, error, progress, lastUpdated };
}

describe('buildAsyncStateView', () => {
  it('returns object with all 13 CngxAsyncState fields', () => {
    const sources = createSources();
    const view = buildAsyncStateView(sources);

    expect(view.status).toBeDefined();
    expect(view.data).toBeDefined();
    expect(view.error).toBeDefined();
    expect(view.progress).toBeDefined();
    expect(view.isLoading).toBeDefined();
    expect(view.isPending).toBeDefined();
    expect(view.isRefreshing).toBeDefined();
    expect(view.isBusy).toBeDefined();
    expect(view.isFirstLoad).toBeDefined();
    expect(view.isEmpty).toBeDefined();
    expect(view.hasData).toBeDefined();
    expect(view.isSettled).toBeDefined();
    expect(view.lastUpdated).toBeDefined();
  });

  describe('isLoading', () => {
    it.each(['loading', 'pending', 'refreshing'] as AsyncStatus[])(
      'is true for status "%s"',
      (s) => {
        const sources = createSources();
        const view = buildAsyncStateView(sources);
        sources.status.set(s);
        expect(view.isLoading()).toBe(true);
      },
    );

    it.each(['idle', 'success', 'error'] as AsyncStatus[])('is false for status "%s"', (s) => {
      const sources = createSources();
      const view = buildAsyncStateView(sources);
      sources.status.set(s);
      expect(view.isLoading()).toBe(false);
    });
  });

  it('isBusy is the same reference as isLoading', () => {
    const view = buildAsyncStateView(createSources());
    expect(view.isBusy).toBe(view.isLoading);
  });

  it('isPending is true only for "pending"', () => {
    const sources = createSources();
    const view = buildAsyncStateView(sources);

    sources.status.set('pending');
    expect(view.isPending()).toBe(true);

    sources.status.set('loading');
    expect(view.isPending()).toBe(false);
  });

  it('isRefreshing is true only for "refreshing"', () => {
    const sources = createSources();
    const view = buildAsyncStateView(sources);

    sources.status.set('refreshing');
    expect(view.isRefreshing()).toBe(true);

    sources.status.set('loading');
    expect(view.isRefreshing()).toBe(false);
  });

  describe('isSettled', () => {
    it('is true for "success" and "error"', () => {
      const sources = createSources();
      const view = buildAsyncStateView(sources);

      sources.status.set('success');
      expect(view.isSettled()).toBe(true);

      sources.status.set('error');
      expect(view.isSettled()).toBe(true);
    });

    it('is false for non-terminal statuses', () => {
      const sources = createSources();
      const view = buildAsyncStateView(sources);

      sources.status.set('idle');
      expect(view.isSettled()).toBe(false);

      sources.status.set('pending');
      expect(view.isSettled()).toBe(false);
    });
  });

  describe('isEmpty / hasData', () => {
    it('isEmpty is true for undefined', () => {
      const view = buildAsyncStateView(createSources<string[]>());
      expect(view.isEmpty()).toBe(true);
      expect(view.hasData()).toBe(false);
    });

    it('isEmpty is true for null', () => {
      const sources = createSources<string[] | null>();
      sources.data.set(null);
      const view = buildAsyncStateView(sources);
      expect(view.isEmpty()).toBe(true);
    });

    it('isEmpty is true for empty array', () => {
      const sources = createSources<string[]>();
      sources.data.set([]);
      const view = buildAsyncStateView(sources);
      expect(view.isEmpty()).toBe(true);
    });

    it('isEmpty is false for non-empty array', () => {
      const sources = createSources<number[]>();
      sources.data.set([1]);
      const view = buildAsyncStateView(sources);
      expect(view.isEmpty()).toBe(false);
      expect(view.hasData()).toBe(true);
    });

    it('isEmpty is false for an object', () => {
      const sources = createSources<Record<string, unknown>>();
      sources.data.set({});
      const view = buildAsyncStateView(sources);
      expect(view.isEmpty()).toBe(false);
    });
  });

  describe('isFirstLoad', () => {
    it('defaults to false when omitted', () => {
      const view = buildAsyncStateView(createSources());
      expect(view.isFirstLoad()).toBe(false);
    });

    it('uses provided signal when given', () => {
      const hadSuccess = signal(false);
      const sources = {
        ...createSources(),
        isFirstLoad: computed(() => !hadSuccess()),
      };
      const view = buildAsyncStateView(sources);

      expect(view.isFirstLoad()).toBe(true);

      hadSuccess.set(true);
      expect(view.isFirstLoad()).toBe(false);
    });
  });

  describe('optional sources', () => {
    it('progress defaults to undefined when omitted', () => {
      const { status, data, error } = createSources();
      const view = buildAsyncStateView({ status, data, error });
      expect(view.progress()).toBeUndefined();
    });

    it('lastUpdated defaults to undefined when omitted', () => {
      const { status, data, error } = createSources();
      const view = buildAsyncStateView({ status, data, error });
      expect(view.lastUpdated()).toBeUndefined();
    });

    it('passes through progress signal', () => {
      const sources = createSources();
      const view = buildAsyncStateView(sources);
      sources.progress.set(42);
      expect(view.progress()).toBe(42);
    });

    it('passes through lastUpdated signal', () => {
      const sources = createSources();
      const view = buildAsyncStateView(sources);
      const now = new Date();
      sources.lastUpdated.set(now);
      expect(view.lastUpdated()).toBe(now);
    });
  });
});
