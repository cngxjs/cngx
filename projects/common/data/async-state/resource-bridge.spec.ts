import { signal, type Resource, type ResourceStatus } from '@angular/core';
import { httpResource, provideHttpClient, type HttpResourceRef } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { fromResource } from './from-resource';
import { fromHttpResource } from './from-http-resource';

interface FakeResource<T> {
  readonly ref: Resource<T>;
  setStatus(status: ResourceStatus): void;
  setValue(value: T | undefined): void;
  setError(err: unknown): void;
}

function fakeResource<T>(): FakeResource<T> {
  const status = signal<ResourceStatus>('idle');
  const value = signal<T | undefined>(undefined);
  const error = signal<unknown>(undefined);
  const ref = {
    status: status.asReadonly(),
    value: value.asReadonly() as Resource<T>['value'],
    error: error.asReadonly(),
    hasValue: () => value() !== undefined,
    isLoading: () => status() === 'loading' || status() === 'reloading',
  } as unknown as Resource<T>;
  return {
    ref,
    setStatus: (s) => status.set(s),
    setValue: (v) => value.set(v),
    setError: (e) => error.set(e),
  };
}

describe('fromResource', () => {
  it('maps the resource lifecycle onto the family status vocabulary', () => {
    const fake = fakeResource<string[]>();
    const state = TestBed.runInInjectionContext(() => fromResource(fake.ref));

    expect(state.status()).toBe('idle');
    fake.setStatus('loading');
    expect(state.status()).toBe('loading');
    fake.setValue(['a']);
    fake.setStatus('resolved');
    expect(state.status()).toBe('success');
    expect(state.data()).toEqual(['a']);
    fake.setStatus('reloading');
    expect(state.status()).toBe('refreshing');
  });

  it('isLoading includes refreshing, matching buildAsyncStateView semantics', () => {
    const fake = fakeResource<string[]>();
    const state = TestBed.runInInjectionContext(() => fromResource(fake.ref));

    fake.setStatus('reloading');
    // The pre-consolidation bridges reported isLoading=false here while every
    // factory in the family reports true - the drift this spec pins down.
    expect(state.isLoading()).toBe(true);
    expect(state.isRefreshing()).toBe(true);
    expect(state.isBusy()).toBe(true);
  });

  it('isFirstLoad covers idle and the first load, then latches off', () => {
    const fake = fakeResource<string[]>();
    const state = TestBed.runInInjectionContext(() => fromResource(fake.ref));

    expect(state.isFirstLoad()).toBe(true);
    fake.setStatus('loading');
    expect(state.isFirstLoad()).toBe(true);
    fake.setValue(['a']);
    fake.setStatus('resolved');
    TestBed.flushEffects();
    expect(state.isFirstLoad()).toBe(false);
    fake.setStatus('reloading');
    expect(state.isFirstLoad()).toBe(false);
  });

  it('projects errors and settles', () => {
    const fake = fakeResource<string[]>();
    const state = TestBed.runInInjectionContext(() => fromResource(fake.ref));

    fake.setError(new Error('boom'));
    fake.setStatus('error');
    expect(state.status()).toBe('error');
    expect(state.error()).toBeInstanceOf(Error);
    expect(state.isSettled()).toBe(true);
  });
});

describe('fromHttpResource', () => {
  function fakeHttpResource<T>() {
    const fake = fakeResource<T>();
    const progress = signal<{ loaded: number; total?: number } | undefined>(undefined);
    const ref = Object.assign(Object.create(Object.getPrototypeOf(fake.ref)), fake.ref, {
      progress: progress.asReadonly(),
    }) as Parameters<typeof fromHttpResource<T>>[0];
    return { fake, progress, ref };
  }

  it('accepts a real httpResource() ref at the type level', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const state = TestBed.runInInjectionContext(() => {
      const res: HttpResourceRef<string[] | undefined> = httpResource<string[]>(() => ({
        url: '/api/items',
        reportProgress: true,
      }));
      // Typed parameter assignment: compiles only when HttpResourceRef fits the bridge input.
      const input: Parameters<typeof fromHttpResource<string[] | undefined>>[0] = res;
      return fromHttpResource(input);
    });
    expect(state.progress()).toBeUndefined();
    TestBed.inject(HttpTestingController).match('/api/items');
  });

  it('maps loaded/total to a rounded 0-100 progress when the total is known', () => {
    const { progress, ref } = fakeHttpResource<string[]>();
    const state = TestBed.runInInjectionContext(() => fromHttpResource(ref));

    expect(state.progress()).toBeUndefined();
    progress.set({ loaded: 375, total: 1000 });
    expect(state.progress()).toBe(38);
    progress.set({ loaded: 1000, total: 1000 });
    expect(state.progress()).toBe(100);
    progress.set({ loaded: 1500, total: 1000 });
    expect(state.progress()).toBe(100);
  });

  it('reports undefined progress when the total is unknown or zero', () => {
    const { progress, ref } = fakeHttpResource<string[]>();
    const state = TestBed.runInInjectionContext(() => fromHttpResource(ref));

    progress.set({ loaded: 512 });
    expect(state.progress()).toBeUndefined();
    progress.set({ loaded: 0, total: 0 });
    expect(state.progress()).toBeUndefined();
  });

  it('shares the bridge core with fromResource', () => {
    const { fake, ref } = fakeHttpResource<string[]>();
    const state = TestBed.runInInjectionContext(() => fromHttpResource(ref));

    // isFirstLoad carries the idle clause the old copy had dropped.
    expect(state.isFirstLoad()).toBe(true);
    fake.setStatus('reloading');
    expect(state.isLoading()).toBe(true);
  });
});
