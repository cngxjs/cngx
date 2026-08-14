import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';

import {
  createCommitErrorAnnouncer,
  type CngxCommitErrorAnnouncePolicy,
} from './commit-error-announcer';
import { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectOptionDef } from './option.model';

function makeMockSoftAnnounce(): (
  opt: CngxSelectOptionDef<unknown> | null,
  action: 'added' | 'removed',
  count: number,
  multi: boolean,
) => void {
  return vi.fn();
}

// Non-generic vi.spyOn call so the spy type is inferred; the explicit
// vi.spyOn<T, K> generic form trips vitest's overload constraint here.
function makeLiveSpy(): ReturnType<typeof vi.fn> {
  return vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce').mockImplementation(() => {});
}

describe('createCommitErrorAnnouncer', () => {
  // A real CngxSelectAnnouncer so the verbose path is asserted end-to-end
  // through the delegation to CngxLiveAnnouncer, not against a stubbed method.
  let announcer: CngxSelectAnnouncer;
  let live: ReturnType<typeof makeLiveSpy>;

  beforeEach(() => {
    announcer = TestBed.inject(CngxSelectAnnouncer);
    live = makeLiveSpy();
  });

  it("verbose policy forwards the formatted error assertively to the live region", () => {
    const softAnnounce = makeMockSoftAnnounce();
    const callback = createCommitErrorAnnouncer({
      deps: {
        announcer,
        commitErrorMessage: (err) => `Commit failed: ${String(err)}`,
        softAnnounce,
      },
      policy: signal<CngxCommitErrorAnnouncePolicy>({
        kind: 'verbose',
        severity: 'assertive',
      }),
    });
    callback(new Error('boom'));
    expect(live).toHaveBeenCalledExactlyOnceWith('Commit failed: Error: boom', 'assertive');
    expect(softAnnounce).not.toHaveBeenCalled();
  });

  it('verbose with polite severity forwards the polite flag', () => {
    const softAnnounce = makeMockSoftAnnounce();
    const callback = createCommitErrorAnnouncer({
      deps: { announcer, commitErrorMessage: () => 'x', softAnnounce },
      policy: signal<CngxCommitErrorAnnouncePolicy>({
        kind: 'verbose',
        severity: 'polite',
      }),
    });
    callback(new Error('x'));
    expect(live).toHaveBeenCalledWith('x', 'polite');
  });

  it("soft policy delegates via softAnnounce and never touches the live region", () => {
    const softAnnounce = makeMockSoftAnnounce();
    const callback = createCommitErrorAnnouncer({
      deps: { announcer, commitErrorMessage: () => 'should-not-appear', softAnnounce },
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' }),
    });
    callback(new Error('boom'));
    expect(softAnnounce).toHaveBeenCalledExactlyOnceWith(null, 'removed', 0, false);
    expect(live).not.toHaveBeenCalled();
  });

  it('policy signal change flips strategy between calls without rebuilding the callback', () => {
    const softAnnounce = makeMockSoftAnnounce();
    const policy = signal<CngxCommitErrorAnnouncePolicy>({
      kind: 'verbose',
      severity: 'assertive',
    });
    const callback = createCommitErrorAnnouncer({
      deps: { announcer, commitErrorMessage: () => 'err-msg', softAnnounce },
      policy,
    });
    callback(new Error('first'));
    expect(live).toHaveBeenCalledTimes(1);
    expect(softAnnounce).toHaveBeenCalledTimes(0);

    policy.set({ kind: 'soft' });
    callback(new Error('second'));
    expect(live).toHaveBeenCalledTimes(1);
    expect(softAnnounce).toHaveBeenCalledTimes(1);
  });
});
