import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, EMPTY, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_DEV_DESCRIPTORS } from '@cngx/core/utils';
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

describe('createAsyncState action shapes and lifetime', () => {
  function inOwnInjector(): { state: MutableAsyncState<string>; destroy: () => void } {
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const state = injector.runInContext(() => createAsyncState<string>());
    return { state, destroy: () => injector.destroy() };
  }

  it('settles an Observable action with its value and an erroring one with its error', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    await state.execute(() => of('obs'));
    expect(state.status()).toBe('success');
    expect(state.data()).toBe('obs');

    await state.execute(() => throwError(() => new Error('te')));
    expect(state.status()).toBe('error');
    expect((state.error() as Error).message).toBe('te');
  });

  it('an Observable action that completes empty settles success with undefined data', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    await state.execute(() => EMPTY);
    expect(state.status()).toBe('success');
    expect(state.data()).toBeUndefined();
    expect(state.error()).toBeUndefined();
  });

  it('settles a BehaviorSubject action once and unsubscribes it', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    const bs = new BehaviorSubject('first');
    await state.execute(() => bs);
    bs.next('second');
    expect(state.data()).toBe('first');
    expect(bs.observed).toBe(false);
  });

  it('an action that throws synchronously settles error', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    await state.execute(() => {
      throw new Error('sync');
    });
    expect(state.status()).toBe('error');
    expect((state.error() as Error).message).toBe('sync');
  });

  it('two rejections in a row keep the error state with the latest error', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    await state.execute(() => Promise.reject(new Error('one')));
    await state.execute(() => Promise.reject(new Error('two')));
    expect(state.status()).toBe('error');
    expect((state.error() as Error).message).toBe('two');
  });

  it('a Promise that resolves after reset() writes nothing', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    let resolve!: (v: string) => void;
    const run = state.execute(() => new Promise<string>((r) => (resolve = r)));
    state.reset();
    resolve('late');
    await run;
    expect(state.status()).toBe('idle');
    expect(state.data()).toBeUndefined();
  });

  it('a Promise that resolves after destroy writes nothing', async () => {
    const { state, destroy } = inOwnInjector();
    let resolve!: (v: string) => void;
    const run = state.execute(() => new Promise<string>((r) => (resolve = r)));
    destroy();
    resolve('late');
    await run;
    expect(state.status()).toBe('pending');
    expect(state.data()).toBeUndefined();
  });
});

describe('createAsyncState cancellation', () => {
  async function isResolved(promise: Promise<void>): Promise<boolean> {
    let resolved = false;
    void promise.then(() => (resolved = true));
    await new Promise((r) => setTimeout(r, 0));
    return resolved;
  }

  it('a second execute() unsubscribes the first Observable action', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    const first = new Subject<string>();
    const second = new Subject<string>();
    void state.execute(() => first);
    void state.execute(() => second);
    expect(first.observed).toBe(false);
    expect(second.observed).toBe(true);
    second.next('two');
    expect(state.data()).toBe('two');
  });

  it('destroy unsubscribes the in-flight Observable and resolves its execute() promise', async () => {
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const state = injector.runInContext(() => createAsyncState<string>());
    const source = new Subject<string>();
    const run = state.execute(() => source);
    injector.destroy();
    expect(source.observed).toBe(false);
    expect(await isResolved(run)).toBe(true);
  });

  it('reset() mid-flight unsubscribes the Observable action', () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    const source = new Subject<string>();
    void state.execute(() => source);
    state.reset();
    expect(source.observed).toBe(false);
    expect(state.status()).toBe('idle');
  });

  it('the promise of a superseded execute() resolves although its source never emits', async () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    const silent = new Subject<string>();
    const superseded = state.execute(() => silent);
    void state.execute(() => new Promise<string>(() => undefined));
    expect(await isResolved(superseded)).toBe(true);
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

describe('createAsyncState dev descriptor', () => {
  it('tags the mutation state with its factory name and options', () => {
    const options = { label: 'Save' };
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>(options));

    expect(CNGX_DEV_DESCRIPTORS.read(state)).toMatchObject({
      kind: 'cngx-dev:factory',
      factory: 'createAsyncState',
      inputs: { options },
    });
  });

  it('links to the inner manual state, which carries its own descriptor', () => {
    const state = TestBed.runInInjectionContext(() => createAsyncState<string>());
    const descriptor = CNGX_DEV_DESCRIPTORS.read(state);
    const inner = descriptor?.kind === 'cngx-dev:factory' ? descriptor.inputs['state'] : undefined;

    expect(CNGX_DEV_DESCRIPTORS.read(inner)).toMatchObject({ factory: 'createManualState' });
  });
});
