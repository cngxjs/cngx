import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { createCommitController } from '@cngx/common/data';

import { createStepperCommitHandler, type CngxStepperCommitResolution } from './commit-handler';

describe('createStepperCommitHandler', () => {
  it("resolves a synchronous true to onResolve('accepted')", () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    handler.beginTransition(0, 1, () => true, (outcome) => calls.push(outcome));
    expect(calls).toEqual(['accepted']);
  });

  it("resolves a synchronous false to onResolve('refused') without storing an error", () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    handler.beginTransition(0, 1, () => false, (outcome) => calls.push(outcome));
    expect(calls).toEqual(['refused']);
    expect(controller.state.status()).toBe('idle');
    expect(controller.state.error()).toBeUndefined();
  });

  it("resolves a Promise<false> and an Observable<false> to 'refused'", async () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    handler.beginTransition(0, 1, () => of(false), (outcome) => calls.push(outcome));
    handler.beginTransition(0, 1, () => Promise.resolve(false), (outcome) => calls.push(outcome));
    await Promise.resolve();
    expect(calls).toEqual(['refused', 'refused']);
    expect(controller.state.error()).toBeUndefined();
  });

  it("keeps the last committed data when a later commit is refused", () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    handler.beginTransition(0, 1, () => true, () => undefined);
    handler.beginTransition(1, 2, () => false, () => undefined);
    expect(controller.state.status()).toBe('idle');
    expect(controller.state.data()).toBe(1);
    expect(controller.state.isFirstLoad()).toBe(false);
  });

  it('resolves an Observable<true>', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    handler.beginTransition(0, 1, () => of(true), (outcome) => calls.push(outcome));
    expect(calls).toEqual(['accepted']);
  });

  it("resolves an erroring source to onResolve('failed')", () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    handler.beginTransition(
      0,
      1,
      () => throwError(() => new Error('refused')),
      (outcome) => calls.push(outcome),
    );
    expect(calls).toEqual(['failed']);
    expect(controller.state.status()).toBe('error');
  });

  it("resolves a synchronously throwing action to onResolve('failed')", () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    handler.beginTransition(
      0,
      1,
      () => {
        throw new Error('boom');
      },
      (outcome) => calls.push(outcome),
    );
    expect(calls).toEqual(['failed']);
    expect(controller.state.error()).toBeInstanceOf(Error);
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
  it("resolves an EMPTY-style source to onResolve('failed') instead of hanging", () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    const empty = new Subject<boolean>();
    handler.beginTransition(0, 1, () => empty, (outcome) => calls.push(outcome));
    expect(controller.isCommitting()).toBe(true);
    empty.complete();
    expect(calls).toEqual(['failed']);
    expect(controller.isCommitting()).toBe(false);
  });

  it('stores a CNGX1059 runtime error for an EMPTY-style source', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller: controller });
    const empty = new Subject<boolean>();
    handler.beginTransition(0, 1, () => empty, () => undefined);
    empty.complete();
    expect(controller.state.error()).toEqual(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX1059',
        message: expect.stringMatching(
          /^CNGX1059: \[cngxStepper\] commitAction completed without emitting true or false\./,
        ),
      }),
    );
  });

  it('does not double-resolve when the source emits and then completes', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    const src = new Subject<boolean>();
    handler.beginTransition(0, 1, () => src, (outcome) => calls.push(outcome));
    src.next(true);
    src.complete();
    expect(calls).toEqual(['accepted']);
  });

  it('resolves once for a sync-emitting non-completing source - later emissions are ignored', () => {
    const controller = createCommitController<number>();
    const handler = createStepperCommitHandler({ controller });
    const calls: CngxStepperCommitResolution[] = [];
    // Emits synchronously on subscribe (before the subscription handle
    // binds) and never completes - the shape that used to re-resolve.
    const src = new BehaviorSubject<boolean>(true);
    handler.beginTransition(0, 1, () => src, (outcome) => calls.push(outcome));
    expect(calls).toEqual(['accepted']);
    expect(controller.isCommitting()).toBe(false);
    src.next(false);
    expect(calls).toEqual(['accepted']);
  });
});
