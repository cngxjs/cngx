import { signal, type Resource, type ResourceStatus } from '@angular/core';
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
  it('shares the bridge core and adds the 0-100 progress mapping', () => {
    const fake = fakeResource<string[]>();
    const progress = signal<number | undefined>(undefined);
    const httpRef = Object.assign(Object.create(Object.getPrototypeOf(fake.ref)), fake.ref, {
      progress: progress.asReadonly(),
    });
    const state = TestBed.runInInjectionContext(() => fromHttpResource(httpRef));

    expect(state.progress()).toBeUndefined();
    progress.set(0.375);
    expect(state.progress()).toBe(38);
    progress.set(2);
    expect(state.progress()).toBe(100);

    // isFirstLoad carries the idle clause the old copy had dropped.
    expect(state.isFirstLoad()).toBe(true);
    fake.setStatus('reloading');
    expect(state.isLoading()).toBe(true);
  });
});
