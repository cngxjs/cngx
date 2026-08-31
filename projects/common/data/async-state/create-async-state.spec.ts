import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAsyncState, type MutableAsyncState } from './create-async-state';
import { CngxAsyncRegistry } from '../async-registry/async-registry';
import { provideAsyncRegistry } from '../async-registry/provide-async-registry';

describe('createAsyncState', () => {
  let state: MutableAsyncState<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    state = TestBed.runInInjectionContext(() => createAsyncState<string>());
  });

  it('starts in idle status', () => {
    expect(state.status()).toBe('idle');
    expect(state.data()).toBeUndefined();
    expect(state.error()).toBeUndefined();
    expect(state.isFirstLoad()).toBe(true);
  });

  it('execute(fn) sets pending then success on resolve', async () => {
    const promise = state.execute(() => Promise.resolve('done'));
    expect(state.status()).toBe('pending');
    expect(state.isPending()).toBe(true);

    await vi.runAllTimersAsync();
    await promise;

    expect(state.status()).toBe('success');
    expect(state.data()).toBe('done');
    expect(state.isFirstLoad()).toBe(false);
    expect(state.isSettled()).toBe(true);
  });

  it('execute(fn) sets error on reject', async () => {
    const promise = state.execute(() => Promise.reject(new Error('fail')));

    await vi.runAllTimersAsync();
    await promise;

    expect(state.status()).toBe('error');
    expect(state.error()).toBeInstanceOf(Error);
    expect((state.error() as Error).message).toBe('fail');
  });

  it('reset() clears state', async () => {
    const promise = state.execute(() => Promise.resolve('data'));
    await vi.runAllTimersAsync();
    await promise;

    state.reset();
    expect(state.status()).toBe('idle');
    expect(state.data()).toBeUndefined();
    expect(state.error()).toBeUndefined();
    expect(state.isFirstLoad()).toBe(true);
  });

  it('reportProgress updates progress signal', () => {
    state.reportProgress(42);
    expect(state.progress()).toBe(42);
    state.reportProgress(100);
    expect(state.progress()).toBe(100);
  });

  it('superseded execution is discarded', async () => {
    let resolveFirst!: (v: string) => void;
    const firstPromise = state.execute(() => new Promise<string>((r) => (resolveFirst = r)));

    const secondPromise = state.execute(() => Promise.resolve('second'));

    await vi.runAllTimersAsync();
    await secondPromise;

    resolveFirst('first');
    await vi.runAllTimersAsync();
    await firstPromise;

    expect(state.data()).toBe('second');
    expect(state.status()).toBe('success');
  });

  it('execute clears progress before starting', async () => {
    state.reportProgress(50);
    const promise = state.execute(() => Promise.resolve('ok'));
    expect(state.progress()).toBeUndefined();

    await vi.runAllTimersAsync();
    await promise;
  });
});

describe('createAsyncState registry enrollment', () => {
  it('register: true enrolls the mutation in the ambient CngxAsyncRegistry', () => {
    TestBed.configureTestingModule({ providers: [provideAsyncRegistry()] });
    const registry = TestBed.inject(CngxAsyncRegistry);
    const state = TestBed.runInInjectionContext(() =>
      createAsyncState<string>({ register: true, label: 'save' }),
    );

    expect(registry.isAnythingLoading()).toBe(false);
    void state.execute(() => new Promise<string>(() => {}));
    expect(registry.isAnythingLoading()).toBe(true);
  });

  it('without register the mutation stays invisible to the registry', () => {
    TestBed.configureTestingModule({ providers: [provideAsyncRegistry()] });
    const registry = TestBed.inject(CngxAsyncRegistry);
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());

    void state.execute(() => new Promise<string>(() => {}));
    expect(registry.isAnythingLoading()).toBe(false);
  });
});
