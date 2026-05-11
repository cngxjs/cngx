import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
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
