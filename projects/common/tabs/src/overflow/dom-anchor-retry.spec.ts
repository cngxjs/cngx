import { describe, expect, it, vi } from 'vitest';

import { createDomAnchorRetry } from './dom-anchor-retry';

describe('createDomAnchorRetry', () => {
  it('stops on the first successful attempt without scheduling another', () => {
    let attemptCount = 0;
    let scheduleCount = 0;
    const retry = createDomAnchorRetry({
      attempt: () => {
        attemptCount++;
        return true;
      },
      maxAttempts: 5,
      schedule: (cb) => {
        scheduleCount++;
        cb();
        return () => undefined;
      },
    });
    retry.start();
    expect(attemptCount).toBe(1);
    expect(scheduleCount).toBe(0);
  });

  it('retries up to maxAttempts then fires onGiveUp once', () => {
    let attemptCount = 0;
    const onGiveUp = vi.fn();
    const retry = createDomAnchorRetry({
      attempt: () => {
        attemptCount++;
        return null;
      },
      maxAttempts: 3,
      // Synchronous scheduler — drives the loop to completion in one
      // tick so the spec can assert observable counts without timer
      // bookkeeping.
      schedule: (cb) => {
        cb();
        return () => undefined;
      },
      onGiveUp,
    });
    retry.start();
    expect(attemptCount).toBe(3);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it('treats false and null identically as "retry"', () => {
    let attemptCount = 0;
    const retry = createDomAnchorRetry({
      attempt: () => {
        attemptCount++;
        return attemptCount % 2 === 0 ? false : null;
      },
      maxAttempts: 4,
      schedule: (cb) => {
        cb();
        return () => undefined;
      },
    });
    retry.start();
    expect(attemptCount).toBe(4);
  });

  it('cancel() halts further retries and invokes the scheduler cancel fn', () => {
    let attemptCount = 0;
    const cancelFn = vi.fn();
    const retry = createDomAnchorRetry({
      attempt: () => {
        attemptCount++;
        return null;
      },
      maxAttempts: 5,
      schedule: () => cancelFn,
    });
    retry.start();
    expect(attemptCount).toBe(1);
    retry.cancel();
    expect(cancelFn).toHaveBeenCalledTimes(1);
  });

  it('start() called twice resets the attempt counter', () => {
    let attemptCount = 0;
    const onGiveUp = vi.fn();
    const retry = createDomAnchorRetry({
      attempt: () => {
        attemptCount++;
        return null;
      },
      maxAttempts: 2,
      schedule: (cb) => {
        cb();
        return () => undefined;
      },
      onGiveUp,
    });
    retry.start();
    expect(attemptCount).toBe(2);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
    retry.start();
    expect(attemptCount).toBe(4);
    expect(onGiveUp).toHaveBeenCalledTimes(2);
  });

  it('an attempt-callback that throws is swallowed and terminates the loop', () => {
    // Host-environment teardown race scenario: rAF fires after the
    // consumer's destroy hook tore down a required global (e.g.
    // IntersectionObserver in jsdom between specs). Without the
    // try/catch in tick(), the throw becomes an unhandled exception
    // in the rAF/setTimeout callback. This axis pins the contract:
    // throws are terminal, never re-scheduled, no give-up fired.
    const attempt = vi.fn(() => {
      throw new ReferenceError('IntersectionObserver is not defined');
    });
    const onGiveUp = vi.fn();
    const cancelFn = vi.fn();
    const retry = createDomAnchorRetry({
      attempt,
      maxAttempts: 10,
      schedule: (cb) => {
        cb();
        return cancelFn;
      },
      onGiveUp,
    });
    expect(() => retry.start()).not.toThrow();
    // Throw is terminal — exactly one attempt, no further schedule,
    // no give-up signal (give-up means "ran out of retries", which
    // is a different signal from "host environment broke").
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(onGiveUp).not.toHaveBeenCalled();
    // Subsequent cancel() is idempotent.
    expect(() => retry.cancel()).not.toThrow();
  });

  it('attempts that flip from null to true mid-loop halt cleanly', () => {
    let attemptCount = 0;
    const succeedAt = 3;
    const onGiveUp = vi.fn();
    const retry = createDomAnchorRetry({
      attempt: () => {
        attemptCount++;
        return attemptCount >= succeedAt ? true : null;
      },
      maxAttempts: 10,
      schedule: (cb) => {
        cb();
        return () => undefined;
      },
      onGiveUp,
    });
    retry.start();
    expect(attemptCount).toBe(succeedAt);
    expect(onGiveUp).not.toHaveBeenCalled();
  });
});
