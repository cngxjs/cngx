import { Component, resource, signal, type Resource, type ResourceStatus } from '@angular/core';
import { httpResource, provideHttpClient, type HttpResourceRef } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { CngxAsyncState } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';

import { fromResource } from './from-resource';
import { fromHttpResource } from './from-http-resource';
import { resolveAsyncView } from './resolve-view';

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
    hasValue: () => status() !== 'error' && value() !== undefined,
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

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
  }
}

function viewOf(state: CngxAsyncState<unknown>): string {
  return resolveAsyncView(state.status(), state.isFirstLoad(), state.isEmpty());
}

function realResource(fail: { on: boolean }) {
  const params = signal<number | undefined>(1);
  return TestBed.runInInjectionContext(() => {
    const ref = resource({
      params: () => params(),
      loader: async ({ params: p }) => {
        if (fail.on) {
          throw new Error(`fail-${p}`);
        }
        return [`v${p}`];
      },
    });
    return { params, ref, state: fromResource(ref) };
  });
}

describe('fromResource over a real resource()', () => {
  it('reports a failed first load as a first load with the error view', async () => {
    const { state } = realResource({ on: true });
    await settle();

    expect(state.status()).toBe('error');
    expect(state.isFirstLoad()).toBe(true);
    expect(state.data()).toBeUndefined();
    expect(viewOf(state)).toBe('error');
  });

  it('keeps the last good data when a reload of the same request fails', async () => {
    const fail = { on: false };
    const { ref, state } = realResource(fail);
    await settle();
    expect(viewOf(state)).toBe('content');

    fail.on = true;
    ref.reload();
    expect(state.status()).toBe('refreshing');
    expect(state.isFirstLoad()).toBe(false);
    await settle();

    expect(state.status()).toBe('error');
    expect(state.isFirstLoad()).toBe(false);
    expect(state.data()).toEqual(['v1']);
    expect(viewOf(state)).toBe('content+error');
  });

  it('shows the skeleton when a failed first load is reloaded, then the error', async () => {
    const fail = { on: true };
    const { ref, state } = realResource(fail);
    await settle();
    expect(viewOf(state)).toBe('error');

    ref.reload();
    expect(state.status()).toBe('refreshing');
    expect(viewOf(state)).toBe('skeleton');
    await settle();

    expect(viewOf(state)).toBe('error');
    expect(state.isFirstLoad()).toBe(true);
  });

  it('treats a params change that fails as a new first load without data', async () => {
    const fail = { on: false };
    const { params, state } = realResource(fail);
    await settle();
    expect(state.data()).toEqual(['v1']);

    fail.on = true;
    params.set(2);
    expect(state.status()).toBe('loading');
    expect(state.isFirstLoad()).toBe(true);
    await settle();

    expect(state.status()).toBe('error');
    expect(state.data()).toBeUndefined();
    expect(viewOf(state)).toBe('error');
  });

  it('reports idle after a success as a first load with no view', async () => {
    const { params, state } = realResource({ on: false });
    await settle();
    expect(state.isFirstLoad()).toBe(false);

    params.set(undefined);
    await settle();

    expect(state.status()).toBe('idle');
    expect(state.isFirstLoad()).toBe(true);
    expect(viewOf(state)).toBe('none');
  });

  it('keeps lastUpdated across a params change', async () => {
    const fail = { on: false };
    const { params, state } = realResource(fail);
    await settle();
    const stamp = state.lastUpdated();
    expect(stamp).toBeInstanceOf(Date);

    fail.on = true;
    params.set(2);
    expect(state.status()).toBe('loading');
    await settle();

    expect(state.status()).toBe('error');
    expect(state.lastUpdated()).toBe(stamp);
  });

  it('keeps the data reference across a reloading round trip with an unchanged value', async () => {
    const fail = { on: false };
    const { ref, state } = realResource(fail);
    await settle();
    const first = state.data();

    fail.on = true;
    ref.reload();
    expect(state.data()).toBe(first);
    await settle();

    expect(state.status()).toBe('error');
    expect(state.data()).toBe(first);
  });
});

describe('fromResource read by a template that skips the latch-backed signals', () => {
  abstract class ResourceHost {
    readonly fail = { on: false };
    readonly params = signal(1);
    readonly ref = resource({
      params: () => this.params(),
      loader: async ({ params: p }) => {
        if (this.fail.on) {
          throw new Error(`fail-${p}`);
        }
        return [`v${p}`];
      },
    });
    readonly state = fromResource(this.ref);
  }

  @Component({
    template: `@if (state.status() === 'loading') {
        <span class="skel">SKEL</span>
      } @else {
        <span class="data">{{ state.data()?.join(',') }}</span>
      }`,
  })
  class StatusGatedHost extends ResourceHost {}

  @Component({
    template: `@if (state.isLoading()) {
        <span class="skel">SKEL</span>
      } @else {
        <span class="data">{{ state.data()?.join(',') }}</span>
      }`,
  })
  class LoadingGatedHost extends ResourceHost {}

  @Component({
    template: `@if (shown()) {
      <span class="data">{{ state.status() }} {{ state.data()?.join(',') }}</span>
    }`,
  })
  class HiddenHost extends ResourceHost {
    readonly shown = signal(true);
  }

  async function render(fixture: ComponentFixture<unknown>): Promise<void> {
    for (let i = 0; i < 5; i++) {
      fixture.detectChanges();
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  function text(fixture: ComponentFixture<unknown>): string {
    return (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
  }

  it('drops the old data when a params change fails behind a status gate', async () => {
    const fixture = TestBed.createComponent(StatusGatedHost);
    const host = fixture.componentInstance;
    await render(fixture);
    expect(text(fixture)).toBe('v1');

    host.fail.on = true;
    host.ref.reload();
    fixture.detectChanges();
    expect(host.ref.status()).toBe('reloading');
    expect(text(fixture)).toBe('v1');

    host.params.set(2);
    fixture.detectChanges();
    expect(text(fixture)).toBe('SKEL');
    await render(fixture);

    expect(host.state.status()).toBe('error');
    expect(viewOf(host.state)).toBe('error');
    expect(text(fixture)).toBe('');
  });

  it('keeps the data when a reload fails behind an isLoading gate', async () => {
    const fixture = TestBed.createComponent(LoadingGatedHost);
    const host = fixture.componentInstance;
    await render(fixture);
    expect(text(fixture)).toBe('v1');

    host.fail.on = true;
    host.ref.reload();
    fixture.detectChanges();
    expect(text(fixture)).toBe('SKEL');
    await render(fixture);

    expect(host.state.status()).toBe('error');
    expect(viewOf(host.state)).toBe('content+error');
    expect(text(fixture)).toBe('v1');
  });

  it('drops the old data when a params change fails while no view reads the state', async () => {
    const fixture = TestBed.createComponent(HiddenHost);
    const host = fixture.componentInstance;
    await render(fixture);

    host.fail.on = true;
    host.ref.reload();
    fixture.detectChanges();
    expect(text(fixture)).toBe('refreshing v1');

    host.shown.set(false);
    fixture.detectChanges();
    host.params.set(2);
    await render(fixture);
    host.shown.set(true);
    await render(fixture);

    expect(host.state.status()).toBe('error');
    expect(host.state.data()).toBeUndefined();
    expect(viewOf(host.state)).toBe('error');
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

  it('reports a failed first load as a first load with the error view', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const state = TestBed.runInInjectionContext(() =>
      fromHttpResource(httpResource<string[]>(() => '/api/items')),
    );
    await settle();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/items')
      .flush('boom', { status: 500, statusText: 'err' });
    await settle();

    expect(state.status()).toBe('error');
    expect(state.isFirstLoad()).toBe(true);
    expect(viewOf(state)).toBe('error');
  });
});
