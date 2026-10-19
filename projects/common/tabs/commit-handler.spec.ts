import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCommitController } from '@cngx/common/data';

import { createTabsCommitHandler, type CngxTabsCommitResolution } from './commit-handler';

describe('createTabsCommitHandler', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('resolves a synchronous true return as accepted', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => true, onResolve);
    expect(onResolve).toHaveBeenCalledWith('accepted');
  });

  it('resolves a synchronous false return as refused without storing an error', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => false, onResolve);
    expect(onResolve).toHaveBeenCalledWith('refused');
    expect(ctrl.state.status()).toBe('idle');
    expect(ctrl.state.error()).toBeUndefined();
  });

  it('resolves a Promise<false> and an Observable<false> as refused', async () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const calls: CngxTabsCommitResolution[] = [];
    handler.beginTransition(0, 1, () => of(false), (outcome) => calls.push(outcome));
    handler.beginTransition(0, 1, () => Promise.resolve(false), (outcome) => calls.push(outcome));
    await Promise.resolve();
    await Promise.resolve();
    expect(calls).toEqual(['refused', 'refused']);
    expect(ctrl.state.error()).toBeUndefined();
  });

  it('keeps the last committed data when a later commit is refused', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    handler.beginTransition(0, 1, () => true, () => undefined);
    handler.beginTransition(1, 2, () => false, () => undefined);
    expect(ctrl.state.status()).toBe('idle');
    expect(ctrl.state.data()).toBe(1);
    expect(ctrl.state.isFirstLoad()).toBe(false);
  });

  it('resolves a Promise<true> as accepted', async () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => Promise.resolve(true), onResolve);
    await Promise.resolve();
    await Promise.resolve();
    expect(onResolve).toHaveBeenCalledWith('accepted');
  });

  it('resolves a rejected Promise as failed', async () => {
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
    expect(onResolve).toHaveBeenCalledWith('failed');
    expect(ctrl.state.status()).toBe('error');
  });

  it('resolves an Observable that emits true as accepted', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(0, 1, () => of(true), onResolve);
    expect(onResolve).toHaveBeenCalledWith('accepted');
  });

  it('resolves an Observable error as failed', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const onResolve = vi.fn();
    handler.beginTransition(
      0,
      1,
      () => throwError(() => new Error('refused')),
      onResolve,
    );
    expect(onResolve).toHaveBeenCalledWith('failed');
    expect(ctrl.state.status()).toBe('error');
  });

  it('treats an action that throws synchronously as failed', () => {
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
    expect(onResolve).toHaveBeenCalledWith('failed');
    expect(ctrl.state.error()).toBeInstanceOf(Error);
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
    expect(onResolveB).toHaveBeenCalledWith('accepted');
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
    const calls: CngxTabsCommitResolution[] = [];
    // Emits synchronously on subscribe (before the subscription handle
    // binds) and never completes - the shape that used to re-resolve.
    const src = new BehaviorSubject<boolean>(true);
    handler.beginTransition(0, 1, () => src, (outcome) => calls.push(outcome));
    expect(calls).toEqual(['accepted']);
    expect(ctrl.isCommitting()).toBe(false);
    src.next(false);
    expect(calls).toEqual(['accepted']);
  });

  it("resolves an EMPTY-style source to onResolve('failed') instead of hanging", () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const calls: CngxTabsCommitResolution[] = [];
    const empty = new Subject<boolean>();
    handler.beginTransition(0, 1, () => empty, (outcome) => calls.push(outcome));
    expect(ctrl.isCommitting()).toBe(true);
    empty.complete();
    expect(calls).toEqual(['failed']);
    expect(ctrl.isCommitting()).toBe(false);
  });

  it('stores a CNGX1059 runtime error for an EMPTY-style source', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const empty = new Subject<boolean>();
    handler.beginTransition(0, 1, () => empty, () => undefined);
    empty.complete();
    expect(ctrl.state.error()).toEqual(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX1059',
        message: expect.stringMatching(
          /^CNGX1059: \[cngxTabGroup\] commitAction completed without emitting true or false\./,
        ),
      }),
    );
  });

  it('does not double-resolve when the source emits and then completes', () => {
    const ctrl = createCommitController<number>();
    const handler = createTabsCommitHandler({ controller: ctrl });
    const calls: CngxTabsCommitResolution[] = [];
    const src = new Subject<boolean>();
    handler.beginTransition(0, 1, () => src, (outcome) => calls.push(outcome));
    src.next(true);
    src.complete();
    expect(calls).toEqual(['accepted']);
  });
});
