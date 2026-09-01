import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCommitController } from '@cngx/common/data';

import { createTabsCommitHandler } from './commit-handler';

describe('createTabsCommitHandler', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('resolves a synchronous true return as accept', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => true, onResolve);
    expect(onResolve).toHaveBeenCalledWith(true);
  });

  it('resolves a synchronous false return as reject', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => false, onResolve);
    expect(onResolve).toHaveBeenCalledWith(false);
  });

  it('resolves a Promise<true> as accept', async () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => Promise.resolve(true), onResolve);
    await Promise.resolve();
    await Promise.resolve();
    expect(onResolve).toHaveBeenCalledWith(true);
  });

  it('resolves a rejected Promise as reject', async () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(
      0,
      1,
      () => Promise.reject(new Error('refused')),
      onResolve,
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(onResolve).toHaveBeenCalledWith(false);
  });

  it('resolves an Observable that emits true as accept', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => of(true), onResolve);
    expect(onResolve).toHaveBeenCalledWith(true);
  });

  it('resolves an Observable error as reject', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(
      0,
      1,
      () => throwError(() => new Error('refused')),
      onResolve,
    );
    expect(onResolve).toHaveBeenCalledWith(false);
  });

  it('treats an action that throws synchronously as reject', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(
      0,
      1,
      () => {
        throw new Error('boom');
      },
      onResolve,
    );
    expect(onResolve).toHaveBeenCalledWith(false);
  });

  it('supersede: in-flight subject ignored when a second transition starts', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const subj = new Subject<boolean>();
    const onResolveA = vi.fn();
    const onResolveB = vi.fn();
    handler.beginTransition(0, 1, () => subj, onResolveA);
    handler.beginTransition(0, 2, () => true, onResolveB);
    // Late emit on the first action's subject must be silently
    // ignored.
    subj.next(true);
    subj.complete();
    expect(onResolveA).not.toHaveBeenCalled();
    expect(onResolveB).toHaveBeenCalledWith(true);
  });

  it('cancel() drops the pending action without firing the callback', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const subj = new Subject<boolean>();
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => subj, onResolve);
    handler.cancel();
    subj.next(true);
    expect(onResolve).not.toHaveBeenCalled();
  });
});

describe('createTabsCommitHandler - take-1 done-latch', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('resolves once for a sync-emitting non-completing source - later emissions are ignored', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const calls: boolean[] = [];
    // Emits synchronously on subscribe (before the subscription handle
    // binds) and never completes - the shape that used to re-resolve.
    const src = new BehaviorSubject<boolean>(true);
    handler.beginTransition(0, 1, () => src, (accept) => calls.push(accept));
    expect(calls).toEqual([true]);
    expect(ctrl.isCommitting()).toBe(false);
    src.next(false);
    expect(calls).toEqual([true]);
  });

  it('resolves an EMPTY-style source to onResolve(false) instead of hanging', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const calls: boolean[] = [];
    const empty = new Subject<boolean>();
    handler.beginTransition(0, 1, () => empty, (accept) => calls.push(accept));
    expect(ctrl.isCommitting()).toBe(true);
    empty.complete();
    expect(calls).toEqual([false]);
    expect(ctrl.isCommitting()).toBe(false);
  });

  it('does not double-resolve when the source emits and then completes', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const calls: boolean[] = [];
    const src = new Subject<boolean>();
    handler.beginTransition(0, 1, () => src, (accept) => calls.push(accept));
    src.next(true);
    src.complete();
    expect(calls).toEqual([true]);
  });
});
