import { signal, type WritableSignal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { CreateQueryResult } from '@tanstack/angular-query-experimental';
import { fromQuery, type CngxQueryLike } from './from-query';

type QueryStatus = 'pending' | 'error' | 'success';
type FetchStatus = 'fetching' | 'paused' | 'idle';

interface QueryStub<T> extends CngxQueryLike<T> {
  readonly status: WritableSignal<QueryStatus>;
  readonly fetchStatus: WritableSignal<FetchStatus>;
  readonly data: WritableSignal<T | undefined>;
  readonly error: WritableSignal<unknown>;
}

function makeQuery<T>(): QueryStub<T> {
  return {
    status: signal<QueryStatus>('pending'),
    fetchStatus: signal<FetchStatus>('idle'),
    data: signal<T | undefined>(undefined),
    error: signal<unknown>(null),
  };
}

interface TimedQueryStub<T> extends QueryStub<T> {
  readonly dataUpdatedAt: WritableSignal<number>;
}

function makeTimedQuery<T>(): TimedQueryStub<T> {
  return { ...makeQuery<T>(), dataUpdatedAt: signal(0) };
}

describe('fromQuery', () => {
  it('maps pending + fetching to loading on first load', () => {
    const query = makeQuery<string[]>();
    query.status.set('pending');
    query.fetchStatus.set('fetching');

    const state = fromQuery(query);

    expect(state.status()).toBe('loading');
    expect(state.isLoading()).toBe(true);
    expect(state.isBusy()).toBe(true);
    expect(state.isFirstLoad()).toBe(true);
    expect(state.isEmpty()).toBe(true);
    expect(state.data()).toBeUndefined();
  });

  it('maps pending + idle to idle for a disabled query', () => {
    const query = makeQuery<string[]>();
    query.status.set('pending');
    query.fetchStatus.set('idle');

    const state = fromQuery(query);

    expect(state.status()).toBe('idle');
    expect(state.isLoading()).toBe(false);
    expect(state.isFirstLoad()).toBe(true);
  });

  it('maps success + idle to success with data', () => {
    const query = makeQuery<string[]>();
    query.status.set('success');
    query.fetchStatus.set('idle');
    query.data.set(['a', 'b']);

    const state = fromQuery(query);

    expect(state.status()).toBe('success');
    expect(state.isLoading()).toBe(false);
    expect(state.isFirstLoad()).toBe(false);
    expect(state.isEmpty()).toBe(false);
    expect(state.hasData()).toBe(true);
    expect(state.isSettled()).toBe(true);
    expect(state.data()).toEqual(['a', 'b']);
  });

  it('flips to refreshing on background refetch while data is visible', () => {
    const query = makeQuery<string[]>();
    query.status.set('success');
    query.fetchStatus.set('idle');
    query.data.set(['a']);

    const state = fromQuery(query);
    expect(state.status()).toBe('success');

    // Background refetch: TanStack keeps status 'success' with data present
    // and flips fetchStatus to 'fetching'.
    query.fetchStatus.set('fetching');

    expect(state.status()).toBe('refreshing');
    expect(state.isRefreshing()).toBe(true);
    expect(state.isLoading()).toBe(true);
    expect(state.data()).toEqual(['a']);
  });

  it('maps error status to error and exposes the error', () => {
    const query = makeQuery<string[]>();
    const failure = new Error('boom');
    query.status.set('error');
    query.fetchStatus.set('idle');
    query.error.set(failure);

    const state = fromQuery(query);

    expect(state.status()).toBe('error');
    expect(state.error()).toBe(failure);
    expect(state.isSettled()).toBe(true);
    expect(state.isLoading()).toBe(false);
  });

  it('reacts to a live status transition loading -> success', () => {
    const query = makeQuery<string[]>();
    query.status.set('pending');
    query.fetchStatus.set('fetching');

    const state = fromQuery(query);
    expect(state.status()).toBe('loading');

    query.status.set('success');
    query.fetchStatus.set('idle');
    query.data.set(['done']);

    expect(state.status()).toBe('success');
    expect(state.data()).toEqual(['done']);
    expect(state.isFirstLoad()).toBe(false);
  });

  it('maps error + fetching to loading when no data was retained (retry busy)', () => {
    const query = makeQuery<string[]>();
    query.status.set('error');
    query.error.set(new Error('boom'));
    query.fetchStatus.set('fetching');

    const state = fromQuery(query);

    expect(state.status()).toBe('loading');
    expect(state.isLoading()).toBe(true);
  });

  it('maps error + fetching to refreshing when data was retained', () => {
    const query = makeQuery<string[]>();
    query.status.set('error');
    query.error.set(new Error('boom'));
    query.data.set(['stale']);
    query.fetchStatus.set('fetching');

    const state = fromQuery(query);

    expect(state.status()).toBe('refreshing');
    expect(state.data()).toEqual(['stale']);
  });

  it('keeps isFirstLoad true after a failed first load and through its retry', () => {
    const query = makeQuery<string[]>();
    query.status.set('pending');
    query.fetchStatus.set('fetching');

    const state = fromQuery(query);
    expect(state.isFirstLoad()).toBe(true);

    // First load fails - no data ever arrived, the skeleton phase is not over.
    query.status.set('error');
    query.fetchStatus.set('idle');
    query.error.set(new Error('boom'));
    expect(state.isFirstLoad()).toBe(true);

    // Retry in flight - still the first load.
    query.fetchStatus.set('fetching');
    expect(state.isFirstLoad()).toBe(true);

    // Success ends the first load.
    query.status.set('success');
    query.fetchStatus.set('idle');
    query.data.set(['a']);
    expect(state.isFirstLoad()).toBe(false);
  });

  it('maps success + paused to success (not busy)', () => {
    const query = makeQuery<string[]>();
    query.status.set('success');
    query.fetchStatus.set('paused');
    query.data.set(['a']);

    const state = fromQuery(query);

    expect(state.status()).toBe('success');
    expect(state.isLoading()).toBe(false);
  });

  it('maps a bound dataUpdatedAt to lastUpdated and to the first-load latch', () => {
    const query = makeTimedQuery<string[]>();
    query.status.set('success');
    query.fetchStatus.set('fetching');
    query.data.set(['placeholder']);

    const state = fromQuery(query);

    // Placeholder round: success + fetching but dataUpdatedAt still 0 -
    // no real load completed, so lastUpdated is absent and it IS first load.
    expect(state.status()).toBe('refreshing');
    expect(state.lastUpdated()).toBeUndefined();
    expect(state.isFirstLoad()).toBe(true);

    const ts = 1_762_000_000_000;
    query.dataUpdatedAt.set(ts);
    query.fetchStatus.set('idle');
    expect(state.lastUpdated()?.getTime()).toBe(ts);
    expect(state.isFirstLoad()).toBe(false);
  });

  it('leaves lastUpdated undefined when dataUpdatedAt is not bound', () => {
    const query = makeQuery<string[]>();
    query.status.set('success');
    query.data.set(['a']);

    const state = fromQuery(query);
    expect(state.lastUpdated()).toBeUndefined();
  });

  it('accepts a real TanStack CreateQueryResult structurally', () => {
    // Compile-time contract: a real TanStack query result satisfies
    // fromQuery's input shape. If TanStack's result type ever drifts away
    // from the signal-bag we read, this assignment stops compiling.
    const asInput = (q: CreateQueryResult<number>): CngxQueryLike<number> => q;
    expect(asInput).toBeTypeOf('function');
  });
});
