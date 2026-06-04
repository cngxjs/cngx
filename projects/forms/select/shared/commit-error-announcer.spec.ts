import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import {
  createCommitErrorAnnouncer,
  type CngxCommitErrorAnnouncePolicy,
} from './commit-error-announcer';
import type { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectOptionDef } from './option.model';

function makeMockAnnouncer(): CngxSelectAnnouncer {
  return {
    announce: vi.fn(),
  } as unknown as CngxSelectAnnouncer;
}

function makeMockSoftAnnounce(): (
  opt: CngxSelectOptionDef<unknown> | null,
  action: 'added' | 'removed',
  count: number,
  multi: boolean,
) => void {
  return vi.fn();
}

describe('createCommitErrorAnnouncer', () => {
  it("verbose policy pushes the formatted error into the announcer's live region", () => {
    const announcer = makeMockAnnouncer();
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
    expect(announcer.announce).toHaveBeenCalledExactlyOnceWith(
      'Commit failed: Error: boom',
      'assertive',
    );
    expect(softAnnounce).not.toHaveBeenCalled();
  });

  it('verbose with polite severity forwards the polite flag', () => {
    const announcer = makeMockAnnouncer();
    const softAnnounce = makeMockSoftAnnounce();
    const callback = createCommitErrorAnnouncer({
      deps: { announcer, commitErrorMessage: () => 'x', softAnnounce },
      policy: signal<CngxCommitErrorAnnouncePolicy>({
        kind: 'verbose',
        severity: 'polite',
      }),
    });
    callback(new Error('x'));
    expect(announcer.announce).toHaveBeenCalledWith('x', 'polite');
  });

  it("soft policy delegates to the configured announcer format via softAnnounce('removed')", () => {
    const announcer = makeMockAnnouncer();
    const softAnnounce = makeMockSoftAnnounce();
    const callback = createCommitErrorAnnouncer({
      deps: { announcer, commitErrorMessage: () => 'should-not-appear', softAnnounce },
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' }),
    });
    callback(new Error('boom'));
    expect(softAnnounce).toHaveBeenCalledExactlyOnceWith(null, 'removed', 0, false);
    expect(announcer.announce).not.toHaveBeenCalled();
  });

  it('policy signal change flips strategy between calls without rebuilding the callback', () => {
    const announcer = makeMockAnnouncer();
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
    expect(announcer.announce).toHaveBeenCalledTimes(1);
    expect(softAnnounce).toHaveBeenCalledTimes(0);

    policy.set({ kind: 'soft' });
    callback(new Error('second'));
    expect(announcer.announce).toHaveBeenCalledTimes(1);
    expect(softAnnounce).toHaveBeenCalledTimes(1);
  });
});
