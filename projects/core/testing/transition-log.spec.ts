import { afterEach, describe, expect, it } from 'vitest';
import {
  Component,
  EnvironmentInjector,
  Injector,
  createEnvironmentInjector,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  createAsyncStateMock,
  injectTransitionLog,
  type CngxTransitionLogOptions,
} from './public-api';

function record<T>(source: () => T, options?: CngxTransitionLogOptions<T>) {
  return TestBed.runInInjectionContext(() => injectTransitionLog(source, options));
}

afterEach(() => TestBed.resetTestingModule());

describe('injectTransitionLog', () => {
  it('records each value settled on between flushes', () => {
    const status = signal('idle');
    const log = record(status);
    TestBed.tick();

    status.set('loading');
    TestBed.tick();
    status.set('success');
    TestBed.tick();

    expect(log.values()).toEqual(['idle', 'loading', 'success']);
  });

  it('coalesces changes made without a flush to the last value', () => {
    const status = signal('idle');
    const log = record(status);
    TestBed.tick();

    status.set('loading');
    status.set('success');
    TestBed.tick();

    expect(log.values()).toEqual(['idle', 'success']);
  });

  it('skips a value equal to the last entry by equal', () => {
    const page = signal({ index: 0 });
    const log = record(page, { equal: (a, b) => a.index === b.index });
    TestBed.tick();

    page.set({ index: 0 });
    TestBed.tick();
    page.set({ index: 1 });
    TestBed.tick();

    expect(log.values().map((p) => p.index)).toEqual([0, 1]);
  });

  it('keeps recording after clear', () => {
    const status = signal('idle');
    const log = record(status);
    TestBed.tick();

    log.clear();
    expect(log.values()).toEqual([]);

    status.set('loading');
    TestBed.tick();
    expect(log.values()).toEqual(['loading']);
  });

  it('keeps the snapshot when clear has nothing to drop', () => {
    const status = signal('idle');
    const log = record(status);
    TestBed.tick();
    log.clear();

    const empty = log.values();
    log.clear();
    expect(Object.is(log.values(), empty)).toBe(true);
  });

  it('freezes the log on stop', () => {
    const status = signal('idle');
    const log = record(status);
    TestBed.tick();

    log.stop();
    status.set('loading');
    TestBed.tick();

    expect(log.values()).toEqual(['idle']);
  });

  it('works outside an injection context with an injector', () => {
    const status = signal('idle');
    const log = injectTransitionLog(status, { injector: TestBed.inject(Injector) });
    TestBed.tick();

    status.set('error');
    TestBed.tick();

    expect(log.values()).toEqual(['idle', 'error']);
  });

  it('returns the same frozen array until a new entry lands', () => {
    const status = signal('idle');
    const log = record(status);
    TestBed.tick();

    const first = log.values();
    expect(Object.is(log.values(), first)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);

    status.set('loading');
    TestBed.tick();
    expect(log.values()).not.toBe(first);
    expect(first).toEqual(['idle']);
  });

  it('records the statuses a mocked async state goes through', () => {
    const state = createAsyncStateMock<string[]>();
    const log = record(state.status);
    TestBed.tick();

    state.set({ status: 'loading' });
    TestBed.tick();
    state.set({ status: 'success', data: ['a'] });
    TestBed.tick();
    state.set({ status: 'refreshing' });
    TestBed.tick();

    expect(log.values()).toEqual(['idle', 'loading', 'success', 'refreshing']);
  });

  it('records the starting value on the first flush, not at the call', () => {
    const status = signal('idle');
    const log = record(status);
    expect(log.values()).toEqual([]);

    status.set('loading');
    TestBed.tick();
    expect(log.values()).toEqual(['loading']);
  });

  it('stops recording when its injector is destroyed', () => {
    const status = signal('idle');
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const log = injectTransitionLog(status, { injector });
    TestBed.tick();

    injector.destroy();
    status.set('loading');
    TestBed.tick();

    expect(log.values()).toEqual(['idle']);
  });

  it('records in a component and stops when the component is destroyed', () => {
    const status = signal('idle');

    @Component({ selector: 'cngx-transition-log-host', template: '' })
    class Host {
      readonly log = injectTransitionLog(status);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    status.set('loading');
    fixture.detectChanges();
    const { log } = fixture.componentInstance;

    fixture.destroy();
    status.set('success');
    TestBed.tick();

    expect(log.values()).toEqual(['idle', 'loading']);
  });
});
