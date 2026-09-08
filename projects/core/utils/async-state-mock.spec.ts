import { describe, expect, it } from 'vitest';
import '@angular/compiler';
import { createAsyncStateMock } from '@cngx/testing';
import type { AsyncStatus } from './async-state';

// Characterization of the shared @cngx/testing async-state mock, co-located
// with the CngxAsyncState kernel it must stay faithful to (projects/testing
// has no test runner). The mock delegates to buildAsyncStateView, so these
// specs pin the derivation contract a component spec relies on.
describe('createAsyncStateMock', () => {
  it('starts idle with the documented defaults', () => {
    const state = createAsyncStateMock();

    expect(state.status()).toBe('idle');
    expect(state.isFirstLoad()).toBe(true);
    expect(state.isEmpty()).toBe(false);
    expect(state.data()).toBeUndefined();
    expect(state.error()).toBeUndefined();
    expect(state.progress()).toBeUndefined();
    expect(state.lastUpdated()).toBeUndefined();
    expect(state.isLoading()).toBe(false);
    expect(state.isSettled()).toBe(false);
  });

  it.each<[AsyncStatus, boolean, boolean, boolean, boolean]>([
    // status, isLoading/isBusy, isPending, isRefreshing, isSettled
    ['idle', false, false, false, false],
    ['loading', true, false, false, false],
    ['pending', true, true, false, false],
    ['refreshing', true, false, true, false],
    ['success', false, false, false, true],
    ['error', false, false, false, true],
  ])('derives the status flags for %s like the kernel', (status, busy, pending, refreshing, settled) => {
    const state = createAsyncStateMock();

    state.set({ status });

    expect(state.isLoading()).toBe(busy);
    expect(state.isBusy()).toBe(busy);
    expect(state.isPending()).toBe(pending);
    expect(state.isRefreshing()).toBe(refreshing);
    expect(state.isSettled()).toBe(settled);
  });

  it('recomputes the flags on every status change (the audit repro)', () => {
    const state = createAsyncStateMock();

    state.set({ status: 'pending' });
    expect(state.isBusy()).toBe(true);
    expect(state.isPending()).toBe(true);

    state.set({ status: 'refreshing' });
    expect(state.isPending()).toBe(false);
    expect(state.isRefreshing()).toBe(true);

    state.set({ status: 'success' });
    expect(state.isBusy()).toBe(false);
    expect(state.isRefreshing()).toBe(false);
    expect(state.isSettled()).toBe(true);
  });

  it('derives hasData as the negation of the driven empty signal', () => {
    const state = createAsyncStateMock();

    expect(state.hasData()).toBe(true);

    state.set({ empty: true });
    expect(state.isEmpty()).toBe(true);
    expect(state.hasData()).toBe(false);

    state.set({ empty: false });
    expect(state.hasData()).toBe(true);
  });

  it('drives the error slot for error-branch rendering', () => {
    const state = createAsyncStateMock();
    const failure = new Error('load failed');

    state.set({ status: 'error', error: failure });

    expect(state.status()).toBe('error');
    expect(state.error()).toBe(failure);
    expect(state.isSettled()).toBe(true);
  });

  it('drives progress and lastUpdated', () => {
    const state = createAsyncStateMock();
    const stamp = new Date('2026-09-08T12:00:00Z');

    state.set({ progress: 42, lastUpdated: stamp });

    expect(state.progress()).toBe(42);
    expect(state.lastUpdated()).toBe(stamp);
  });

  it('clears nullable slots when the patch passes undefined explicitly', () => {
    const state = createAsyncStateMock();
    state.set({ data: [1], error: new Error('x'), progress: 80, lastUpdated: new Date() });

    state.set({ data: undefined, error: undefined, progress: undefined, lastUpdated: undefined });

    expect(state.data()).toBeUndefined();
    expect(state.error()).toBeUndefined();
    expect(state.progress()).toBeUndefined();
    expect(state.lastUpdated()).toBeUndefined();
  });

  it('keeps omitted fields on a partial patch', () => {
    const state = createAsyncStateMock();
    const stamp = new Date('2026-09-08T12:00:00Z');
    state.set({ status: 'success', firstLoad: false, data: [1, 2], error: 'boom', progress: 100, lastUpdated: stamp });

    state.set({ status: 'refreshing' });

    expect(state.data()).toEqual([1, 2]);
    expect(state.error()).toBe('boom');
    expect(state.progress()).toBe(100);
    expect(state.lastUpdated()).toBe(stamp);
    expect(state.isFirstLoad()).toBe(false);
  });
});
