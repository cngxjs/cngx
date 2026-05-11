import { describe, expect, it, beforeEach } from 'vitest';
import { createManualState, type ManualAsyncState } from './create-manual-state';

describe('createManualState', () => {
  let state: ManualAsyncState<string[]>;

  beforeEach(() => {
    state = createManualState<string[]>();
  });

  it('starts in idle status', () => {
    expect(state.status()).toBe('idle');
    expect(state.data()).toBeUndefined();
    expect(state.error()).toBeUndefined();
    expect(state.progress()).toBeUndefined();
    expect(state.isLoading()).toBe(false);
    expect(state.isPending()).toBe(false);
    expect(state.isRefreshing()).toBe(false);
    expect(state.isBusy()).toBe(false);
    expect(state.isFirstLoad()).toBe(true);
    expect(state.isEmpty()).toBe(true);
    expect(state.hasData()).toBe(false);
    expect(state.isSettled()).toBe(false);
    expect(state.lastUpdated()).toBeUndefined();
  });

  it('set("loading") transitions to loading with isFirstLoad true', () => {
    state.set('loading');
    expect(state.status()).toBe('loading');
    expect(state.isLoading()).toBe(true);
    expect(state.isBusy()).toBe(true);
    expect(state.isFirstLoad()).toBe(true);
  });

  it('set("pending") is busy', () => {
    state.set('pending');
    expect(state.status()).toBe('pending');
    expect(state.isPending()).toBe(true);
    expect(state.isBusy()).toBe(true);
  });

  it('setSuccess(data) transitions to success with data', () => {
    state.setSuccess(['a', 'b']);
    expect(state.status()).toBe('success');
    expect(state.data()).toEqual(['a', 'b']);
    expect(state.error()).toBeUndefined();
    expect(state.progress()).toBeUndefined();
    expect(state.isSettled()).toBe(true);
    expect(state.isFirstLoad()).toBe(false);
    expect(state.isEmpty()).toBe(false);
    expect(state.hasData()).toBe(true);
    expect(state.lastUpdated()).toBeInstanceOf(Date);
  });

  it('setSuccess([]) sets isEmpty true', () => {
    state.setSuccess([]);
    expect(state.status()).toBe('success');
    expect(state.isEmpty()).toBe(true);
    expect(state.hasData()).toBe(false);
  });

  it('setError sets error status', () => {
    state.setError('something went wrong');
    expect(state.status()).toBe('error');
    expect(state.error()).toBe('something went wrong');
    expect(state.isSettled()).toBe(true);
    expect(state.progress()).toBeUndefined();
  });

  it('setError clears progress', () => {
    state.setProgress(75);
    state.setError('fail');
    expect(state.progress()).toBeUndefined();
  });

  it('reset() returns to idle and clears everything', () => {
    state.setSuccess(['data']);
    state.reset();
    expect(state.status()).toBe('idle');
    expect(state.data()).toBeUndefined();
    expect(state.error()).toBeUndefined();
    expect(state.progress()).toBeUndefined();
    expect(state.lastUpdated()).toBeUndefined();
    expect(state.isFirstLoad()).toBe(true);
  });

  it('set("refreshing") after success keeps data visible', () => {
    state.setSuccess(['a']);
    state.set('refreshing');
    expect(state.status()).toBe('refreshing');
    expect(state.isRefreshing()).toBe(true);
    expect(state.isBusy()).toBe(true);
    expect(state.data()).toEqual(['a']);
    expect(state.isFirstLoad()).toBe(false);
  });

  it('setProgress updates progress signal', () => {
    state.setProgress(50);
    expect(state.progress()).toBe(50);
    state.setProgress(100);
    expect(state.progress()).toBe(100);
    state.setProgress(undefined);
    expect(state.progress()).toBeUndefined();
  });

  it('set("success") via set() marks hadSuccess and sets lastUpdated', () => {
    state.set('success');
    expect(state.isFirstLoad()).toBe(false);
    expect(state.lastUpdated()).toBeInstanceOf(Date);
  });

  it('isLoading is true for loading, pending, and refreshing', () => {
    state.set('loading');
    expect(state.isLoading()).toBe(true);

    state.set('pending');
    expect(state.isLoading()).toBe(true);

    state.set('refreshing');
    expect(state.isLoading()).toBe(true);

    state.set('idle');
    expect(state.isLoading()).toBe(false);

    state.set('success');
    expect(state.isLoading()).toBe(false);

    state.set('error');
    expect(state.isLoading()).toBe(false);
  });

  it('isEmpty returns true for null/undefined data', () => {
    expect(state.isEmpty()).toBe(true);
    state.setSuccess(['x']);
    expect(state.isEmpty()).toBe(false);
  });
});
