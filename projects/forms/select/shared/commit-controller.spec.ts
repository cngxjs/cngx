import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';

import {
  CNGX_COMMIT_CONTROLLER_FACTORY,
  createCommitController as createGenericCommitController,
} from '@cngx/common/data';

import {
  CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  createCommitController,
} from './commit-controller.token';
import type { CngxSelectCommitAction } from './commit-action.types';

type T = string;

interface Recorder {
  readonly successes: (T | undefined)[];
  readonly errors: { err: unknown; previous: T | undefined }[];
}

function record(): Recorder {
  return { successes: [], errors: [] };
}

describe('createCommitController (select-side adapter)', () => {
  it('routes a synchronous action to onSuccess and settles state to success', () => {
    const ctrl = createCommitController<T>();
    const rec = record();
    const action: CngxSelectCommitAction<T> = (next) => next;
    ctrl.begin(action, 'a', undefined, {
      onSuccess: (c) => rec.successes.push(c),
      onError: (err, prev) => rec.errors.push({ err, previous: prev }),
    });
    expect(rec.successes).toEqual(['a']);
    expect(ctrl.state.status()).toBe('success');
    expect(ctrl.isCommitting()).toBe(false);
  });

  it('routes a synchronous throw to onError with the previous value as rollback', () => {
    const ctrl = createCommitController<T>();
    const rec = record();
    const boom = new Error('boom');
    const action: CngxSelectCommitAction<T> = () => {
      throw boom;
    };
    ctrl.begin(action, 'b', 'a', {
      onSuccess: (c) => rec.successes.push(c),
      onError: (err, prev) => rec.errors.push({ err, previous: prev }),
    });
    expect(rec.errors).toEqual([{ err: boom, previous: 'a' }]);
    expect(ctrl.state.status()).toBe('error');
  });

  it('tracks the intended value the user clicked', () => {
    const ctrl = createCommitController<T>();
    ctrl.begin((next) => next, 'clicked', undefined, {
      onSuccess: () => undefined,
      onError: () => undefined,
    });
    expect(ctrl.intendedValue()).toBe('clicked');
  });

  it('flips isCommitting while an Observable action is in flight and clears on emit', () => {
    const ctrl = createCommitController<T>();
    const rec = record();
    const source = new Subject<T>();
    ctrl.begin(() => source.asObservable(), 'a', undefined, {
      onSuccess: (c) => rec.successes.push(c),
      onError: () => undefined,
    });
    expect(ctrl.isCommitting()).toBe(true);

    source.next('a');
    expect(rec.successes).toEqual(['a']);
    expect(ctrl.isCommitting()).toBe(false);

    // First emission only - a hot source must not double-write.
    source.next('a-again');
    expect(rec.successes).toEqual(['a']);
  });

  it('supersedes an in-flight commit: a stale emission after a fresh begin is ignored', () => {
    const ctrl = createCommitController<T>();
    const rec = record();
    const stale = new Subject<T>();
    ctrl.begin(() => stale.asObservable(), 'first', undefined, {
      onSuccess: (c) => rec.successes.push(`first:${c}`),
      onError: () => undefined,
    });
    ctrl.begin((next) => next, 'second', undefined, {
      onSuccess: (c) => rec.successes.push(`second:${c}`),
      onError: () => undefined,
    });
    // Late emission from the superseded runner must not fire its callback.
    stale.next('first');
    expect(rec.successes).toEqual(['second:second']);
  });

  it('cancel() marks the active commit superseded', () => {
    const ctrl = createCommitController<T>();
    const rec = record();
    const source = new Subject<T>();
    ctrl.begin(() => source.asObservable(), 'a', undefined, {
      onSuccess: (c) => rec.successes.push(c),
      onError: () => undefined,
    });
    ctrl.cancel();
    source.next('a');
    expect(rec.successes).toEqual([]);
  });
});

describe('CNGX_SELECT_COMMIT_CONTROLLER_FACTORY', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves to a factory that builds a working select-side controller', () => {
    const factory = TestBed.inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY);
    const ctrl = factory<T>();
    const rec = record();
    ctrl.begin((next) => next, 'a', undefined, {
      onSuccess: (c) => rec.successes.push(c),
      onError: () => undefined,
    });
    expect(rec.successes).toEqual(['a']);
  });

  it('cascades an override on CNGX_COMMIT_CONTROLLER_FACTORY into every select variant', () => {
    const genericFactory = vi.fn(() => createGenericCommitController());
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_COMMIT_CONTROLLER_FACTORY, useValue: genericFactory }],
    });
    const factory = TestBed.inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY);
    factory<T>();
    // The select adapter wraps whatever the generic token resolves to.
    expect(genericFactory).toHaveBeenCalledTimes(1);
  });
});
