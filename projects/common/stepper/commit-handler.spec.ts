import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { createCommitController } from '@cngx/common/data';

import { createStepperCommitHandler } from './commit-handler';

describe('createStepperCommitHandler', () => {
  it('resolves a synchronous true to onResolve(true)', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: boolean[] = [];
    handler.beginTransition(0, 1, () => true, (accept) => calls.push(accept));
    expect(calls).toEqual([true]);
  });

  it('resolves a synchronous false to onResolve(false)', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: boolean[] = [];
    handler.beginTransition(0, 1, () => false, (accept) => calls.push(accept));
    expect(calls).toEqual([false]);
  });

  it('resolves an Observable<true>', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: boolean[] = [];
    handler.beginTransition(0, 1, () => of(true), (accept) => calls.push(accept));
    expect(calls).toEqual([true]);
  });

  it('resolves a thrown error to onResolve(false)', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: boolean[] = [];
    handler.beginTransition(
      0,
      1,
      () => throwError(() => new Error('refused')),
      (accept) => calls.push(accept),
    );
    expect(calls).toEqual([false]);
  });

  it('supersede: a second beginTransition cancels the first', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: number[] = [];
    const firstSubject = new Subject<boolean>();
    handler.beginTransition(0, 1, () => firstSubject, () => calls.push(1));
    // Second begin while first is in flight.
    handler.beginTransition(0, 2, () => of(true), () => calls.push(2));
    // First subject's late emit must be ignored.
    firstSubject.next(true);
    firstSubject.complete();
    expect(calls).toEqual([2]);
  });

  it('isCommitting reflects the underlying controller', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.runInInjectionContext(() => {
      const controller = createCommitController<number>();
      const handler = createStepperCommitHandler({ controller });
      expect(handler.isCommitting()).toBe(false);
      const subj = new Subject<boolean>();
      handler.beginTransition(0, 1, () => subj, () => {});
      expect(handler.isCommitting()).toBe(true);
      subj.next(true);
      subj.complete();
      expect(handler.isCommitting()).toBe(false);
    });
  });
});

describe('createStepperCommitHandler - complete-without-emit', () => {
  it('resolves an EMPTY-style source to onResolve(false) instead of hanging', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: boolean[] = [];
    const empty = new Subject<boolean>();
    handler.beginTransition(0, 1, () => empty, (accept) => calls.push(accept));
    expect(controller.isCommitting()).toBe(true);
    empty.complete();
    expect(calls).toEqual([false]);
    expect(controller.isCommitting()).toBe(false);
  });

  it('does not double-resolve when the source emits and then completes', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: boolean[] = [];
    const src = new Subject<boolean>();
    handler.beginTransition(0, 1, () => src, (accept) => calls.push(accept));
    src.next(true);
    src.complete();
    expect(calls).toEqual([true]);
  });

  it('resolves once for a sync-emitting non-completing source - later emissions are ignored', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: boolean[] = [];
    // Emits synchronously on subscribe (before the subscription handle
    // binds) and never completes - the shape that used to re-resolve.
    const src = new BehaviorSubject<boolean>(true);
    handler.beginTransition(0, 1, () => src, (accept) => calls.push(accept));
    expect(calls).toEqual([true]);
    expect(controller.isCommitting()).toBe(false);
    src.next(false);
    expect(calls).toEqual([true]);
  });
});
