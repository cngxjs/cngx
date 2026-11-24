import { BehaviorSubject, EMPTY, Observable, Subject, of, range, tap, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { settleAction, type SettleActionHandlers } from './settle-action';

function recorder(): SettleActionHandlers<unknown> & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    onValue: (v) => calls.push(`value:${String(v)}`),
    onEmpty: () => calls.push('empty'),
    onError: (e) => calls.push(`error:${e instanceof Error ? e.message : String(e)}`),
  };
}

describe('settleAction', () => {
  it('settles a plain value synchronously', () => {
    const r = recorder();
    settleAction(() => 'a', r);
    expect(r.calls).toEqual(['value:a']);
  });

  it('settles a fulfilled thenable with its value', async () => {
    const r = recorder();
    settleAction(() => Promise.resolve('p'), r);
    expect(r.calls).toEqual([]);
    await Promise.resolve();
    expect(r.calls).toEqual(['value:p']);
  });

  it('routes a rejected thenable to onError', async () => {
    const r = recorder();
    settleAction(() => Promise.reject(new Error('rej')), r);
    await Promise.resolve();
    expect(r.calls).toEqual(['error:rej']);
  });

  it('settles of() with its value, throwError() with its error and EMPTY on the empty route', () => {
    const a = recorder();
    settleAction(() => of('o'), a);
    expect(a.calls).toEqual(['value:o']);

    const b = recorder();
    settleAction(() => throwError(() => new Error('te')), b);
    expect(b.calls).toEqual(['error:te']);

    const c = recorder();
    settleAction(() => EMPTY, c);
    expect(c.calls).toEqual(['empty']);
  });

  it('takes one value of a BehaviorSubject and unsubscribes it', () => {
    const r = recorder();
    const bs = new BehaviorSubject('first');
    settleAction(() => bs, r);
    bs.next('second');
    expect(r.calls).toEqual(['value:first']);
    expect(bs.observed).toBe(false);
  });

  it('takes the first of two synchronous emissions only', () => {
    const r = recorder();
    const source = new Observable<string>((subscriber) => {
      subscriber.next('one');
      subscriber.next('two');
      subscriber.complete();
    });
    settleAction(() => source, r);
    expect(r.calls).toEqual(['value:one']);
  });

  it('stops a synchronous source at its first emission', () => {
    const r = recorder();
    let pulled = 0;
    settleAction(() => range(1, 100_000).pipe(tap(() => pulled++)), r);
    expect(pulled).toBe(1);
    expect(r.calls).toEqual(['value:1']);
  });

  it('unsubscribes an asynchronous source after its first emission', () => {
    const r = recorder();
    const subject = new Subject<string>();
    settleAction(() => subject, r);
    expect(subject.observed).toBe(true);
    subject.next('x');
    expect(subject.observed).toBe(false);
    expect(r.calls).toEqual(['value:x']);
  });

  it('routes a synchronous throw of run to onError', () => {
    const r = recorder();
    const handle = settleAction(() => {
      throw new Error('sync');
    }, r);
    expect(r.calls).toEqual(['error:sync']);
    expect(() => handle.cancel()).not.toThrow();
  });

  it('cancel() before a Subject emits unsubscribes it and calls no handler', () => {
    const r = recorder();
    const subject = new Subject<string>();
    const handle = settleAction(() => subject, r);
    handle.cancel();
    expect(subject.observed).toBe(false);
    subject.next('late');
    subject.complete();
    expect(r.calls).toEqual([]);
  });

  it('cancel() before a Promise rejects calls no handler and still observes the rejection', async () => {
    const r = recorder();
    let reject!: (e: unknown) => void;
    let rejectionHandler: unknown;
    const thenable: PromiseLike<string> = {
      then: (onFulfilled, onRejected) => {
        rejectionHandler = onRejected;
        return new Promise<string>((_, rej) => (reject = rej)).then(onFulfilled, onRejected);
      },
    };
    const handle = settleAction(() => thenable, r);
    handle.cancel();
    reject(new Error('late'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(typeof rejectionHandler).toBe('function');
    expect(r.calls).toEqual([]);
  });

  it('cancel() twice is a no-op the second time', () => {
    const r = recorder();
    const subject = new Subject<string>();
    const handle = settleAction(() => subject, r);
    handle.cancel();
    expect(() => handle.cancel()).not.toThrow();
    expect(r.calls).toEqual([]);
  });

  it('cancel() after settle changes nothing', () => {
    const r = recorder();
    const handle = settleAction(() => of('done'), r);
    handle.cancel();
    expect(r.calls).toEqual(['value:done']);
  });
});
