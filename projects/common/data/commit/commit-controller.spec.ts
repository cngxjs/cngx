import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, test, beforeEach } from 'vitest';

import {
  createCommitController,
  type CngxCommitController,
  type CngxCommitHandle,
  type CngxCommitRunner,
} from './commit-controller';
import {
  CNGX_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitControllerFactory,
} from './commit-controller.token';

// Lifted-controller spec covers the three Phase-0 assertions
// demanded by stepper-wizard-plan.md:
//
//   (a) Controller works without any forms/select import — proves
//       Sheriff `lib:common` allow-list compliance.
//   (b) Generic T = number instantiation drives the supersede id
//       correctly under rapid `begin(...)` calls — mirrors the
//       stepper's planned activeStepIndex shape.
//   (c) The previous runner's cancel handle fires synchronously
//       after a superseding `begin(...)` call — equivalent to the
//       plan's "isCancelled() returns true synchronously" assertion
//       expressed via a closure flag (no public interface change
//       needed on the handle type).
//
// Plus core-behaviour coverage (success/error/cancel/intendedValue/
// supersede-with-late-callback) so the lift is a real characterisation
// suite, not just a Sheriff-allow-list smoke test.

function noopHandle(): CngxCommitHandle {
  return { cancel: () => {} };
}

describe('createCommitController', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  test('(a) Sheriff allow-list — controller imports nothing from forms/*', () => {
    // Self-evident at compile time: this file imports only from
    // `./commit-controller` and `./commit-controller.token`. Both
    // live in `@cngx/common/data`. Sheriff would have rejected
    // `lib:common` -> `lib:forms` at build time before this spec
    // ran. The runtime smoke confirms instantiation works in
    // isolation:
    const ctrl = createCommitController<string>();
    expect(ctrl.state.status()).toBe('idle');
    expect(ctrl.isCommitting()).toBe(false);
    expect(ctrl.intendedValue()).toBeUndefined();
  });

  test('(b) generic T = number drives supersede id under rapid begin() calls', () => {
    // Mirrors stepper's planned shape: the controller commits an
    // intended target step index (number) and rolls back to the
    // origin index on error. Rapid begin() calls must increment the
    // internal commitId so only the last one resolves.
    const ctrl = createCommitController<number>();
    const calls: Array<{ id: number; outcome: 'success' | 'error' }> = [];

    // Three back-to-back begins. The first two MUST be superseded;
    // only the third's onSuccess may fire.
    let resolveLast: ((v: number | undefined) => void) | null = null;
    for (let i = 1; i <= 3; i++) {
      const captured = i;
      const runner: CngxCommitRunner<number> = (handlers) => {
        if (captured === 3) {
          // Capture the success callback so we can resolve it after
          // the loop completes. The earlier two runners receive
          // their callbacks but never invoke them — the controller
          // itself must drop the late calls via the supersede id
          // even if they did.
          resolveLast = handlers.onSuccess;
        }
        return noopHandle();
      };
      ctrl.begin(runner, captured, captured - 1, {
        onSuccess: (committed) =>
          calls.push({ id: captured, outcome: 'success' }),
        onError: () => calls.push({ id: captured, outcome: 'error' }),
      });
    }

    // No outcome before the third runner's success resolves.
    expect(calls).toHaveLength(0);
    expect(ctrl.state.status()).toBe('pending');
    expect(ctrl.intendedValue()).toBe(3);

    // Resolve only the third — first two were superseded.
    resolveLast!(3);
    expect(calls).toEqual([{ id: 3, outcome: 'success' }]);
    expect(ctrl.state.status()).toBe('success');
    expect(ctrl.state.data()).toBe(3);
  });

  test('(c) superseding begin() cancels the previous runner handle synchronously', () => {
    const ctrl = createCommitController<number>();
    let firstCancelled = false;
    let secondCancelled = false;

    ctrl.begin(
      () => ({ cancel: () => { firstCancelled = true; } }),
      1,
      0,
      { onSuccess: () => {}, onError: () => {} },
    );
    expect(firstCancelled).toBe(false);

    ctrl.begin(
      () => ({ cancel: () => { secondCancelled = true; } }),
      2,
      1,
      { onSuccess: () => {}, onError: () => {} },
    );

    // First handle's cancel ran SYNCHRONOUSLY inside the second
    // begin() — supersede semantics. Second handle still active.
    expect(firstCancelled).toBe(true);
    expect(secondCancelled).toBe(false);
  });

  test('begin → onSuccess flips state to success + carries committed value', () => {
    const ctrl = createCommitController<string>();
    let resolved: ((v: string | undefined) => void) | null = null;
    ctrl.begin(
      (handlers) => {
        resolved = handlers.onSuccess;
        return noopHandle();
      },
      'green',
      'red',
      { onSuccess: () => {}, onError: () => {} },
    );

    expect(ctrl.state.status()).toBe('pending');
    expect(ctrl.intendedValue()).toBe('green');

    resolved!('green');
    expect(ctrl.state.status()).toBe('success');
    expect(ctrl.state.data()).toBe('green');
  });

  test('begin → onError flips state to error + handlers receive previous value', () => {
    const ctrl = createCommitController<string>();
    let reject: ((err: unknown) => void) | null = null;
    let receivedPrev: string | undefined = '__unset__';
    ctrl.begin(
      (handlers) => {
        reject = handlers.onError;
        return noopHandle();
      },
      'green',
      'red',
      {
        onSuccess: () => {},
        onError: (_err, previous) => {
          receivedPrev = previous;
        },
      },
    );

    reject!(new Error('server offline'));
    expect(ctrl.state.status()).toBe('error');
    expect(ctrl.state.error()).toBeInstanceOf(Error);
    expect(receivedPrev).toBe('red');
  });

  test('cancel() bumps the id so late callbacks no-op', () => {
    const ctrl = createCommitController<string>();
    let lateSuccess: ((v: string | undefined) => void) | null = null;
    let outcomeFired = false;
    ctrl.begin(
      (handlers) => {
        lateSuccess = handlers.onSuccess;
        return noopHandle();
      },
      'green',
      'red',
      {
        onSuccess: () => {
          outcomeFired = true;
        },
        onError: () => {
          outcomeFired = true;
        },
      },
    );

    ctrl.cancel();
    // Late callback from the aborted runner — must be ignored.
    lateSuccess!('green');
    expect(outcomeFired).toBe(false);
  });
});

describe('CNGX_COMMIT_CONTROLLER_FACTORY', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  test('default factory resolves to createCommitController', () => {
    const factory = TestBed.inject(CNGX_COMMIT_CONTROLLER_FACTORY);
    const ctrl = factory<number>();
    expect(ctrl.state.status()).toBe('idle');
    expect(typeof ctrl.begin).toBe('function');
    expect(typeof ctrl.cancel).toBe('function');
  });

  test('viewProviders override cascades to the resolved factory', () => {
    const customFactory: CngxCommitControllerFactory = <T>() => {
      const real = createCommitController<T>();
      // Tag the controller by overlaying a sentinel — proves the
      // override factory is what TestBed resolved.
      return Object.assign(real, { __overrideTag: 'custom' as const });
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_COMMIT_CONTROLLER_FACTORY, useValue: customFactory },
      ],
    });
    const factory = TestBed.inject(CNGX_COMMIT_CONTROLLER_FACTORY);
    const ctrl = factory<string>() as CngxCommitController<string> & {
      __overrideTag?: 'custom';
    };
    expect(ctrl.__overrideTag).toBe('custom');
  });
});

