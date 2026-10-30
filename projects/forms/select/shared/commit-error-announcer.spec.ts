import { effect, signal } from '@angular/core';
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

  it('soft policy speaks the soft failure message politely after a rollback, never the cleared phrase', () => {
    const softAnnounce = makeMockSoftAnnounce();
    const callback = createCommitErrorAnnouncer({
      deps: {
        announcer,
        commitErrorMessage: () => 'should-not-appear',
        softFailureMessage: () => 'Colour: Save failed, previous value restored',
        softAnnounce,
      },
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' }),
    });
    callback(new Error('boom'), true);
    expect(live).toHaveBeenCalledExactlyOnceWith(
      'Colour: Save failed, previous value restored',
      'polite',
    );
    expect(softAnnounce).not.toHaveBeenCalled();
  });

  it.each([
    ['nothing was rolled back', false],
    ['the caller cannot tell', undefined],
  ])('soft policy speaks the regular failure politely when %s', (_case, rolledBack) => {
    const callback = createCommitErrorAnnouncer({
      deps: {
        announcer,
        commitErrorMessage: () => 'Colour: Save failed',
        softFailureMessage: () => 'Colour: Save failed, previous value restored',
        softAnnounce: makeMockSoftAnnounce(),
      },
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' }),
    });
    callback(new Error('boom'), rolledBack);
    expect(live).toHaveBeenCalledExactlyOnceWith('Colour: Save failed', 'polite');
  });

  it('soft policy without a soft failure message speaks the regular failure politely', () => {
    const softAnnounce = makeMockSoftAnnounce();
    const callback = createCommitErrorAnnouncer({
      deps: { announcer, commitErrorMessage: () => 'Colour: Save failed', softAnnounce },
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' }),
    });
    callback(new Error('boom'), true);
    expect(softAnnounce).not.toHaveBeenCalled();
    expect(live).toHaveBeenCalledExactlyOnceWith('Colour: Save failed', 'polite');
  });

  it('soft policy does not re-announce on a language flip when called from an effect', () => {
    const copy = signal('Colour: Save failed, previous value restored');
    const failure = signal<unknown>(null);
    const callback = createCommitErrorAnnouncer({
      deps: {
        announcer,
        commitErrorMessage: () => 'unused',
        softFailureMessage: () => copy(),
        softAnnounce: makeMockSoftAnnounce(),
      },
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' }),
    });
    TestBed.runInInjectionContext(() =>
      effect(() => {
        const err = failure();
        if (err) {
          callback(err, true);
        }
      }),
    );
    failure.set(new Error('boom'));
    TestBed.flushEffects();
    expect(live).toHaveBeenCalledTimes(1);

    copy.set('Farbe: Speichern fehlgeschlagen, vorheriger Wert wiederhergestellt');
    TestBed.flushEffects();
    expect(live).toHaveBeenCalledTimes(1);
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
    expect(live).toHaveBeenCalledTimes(2);
    expect(live).toHaveBeenLastCalledWith('err-msg', 'polite');
    expect(softAnnounce).toHaveBeenCalledTimes(0);
  });

  it('does not re-announce on a language flip when called from an effect', () => {
    const copy = signal('Save failed');
    const failure = signal<unknown>(null);
    const callback = createCommitErrorAnnouncer({
      deps: {
        announcer,
        commitErrorMessage: () => copy(),
        softAnnounce: makeMockSoftAnnounce(),
      },
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'verbose', severity: 'polite' }),
    });
    TestBed.runInInjectionContext(() =>
      effect(() => {
        const err = failure();
        if (err) {
          callback(err);
        }
      }),
    );
    failure.set('boom');
    TestBed.tick();
    expect(live).toHaveBeenCalledExactlyOnceWith('Save failed', 'polite');

    copy.set('Speichern fehlgeschlagen');
    TestBed.tick();
    expect(live).toHaveBeenCalledTimes(1);

    failure.set('again');
    TestBed.tick();
    expect(live).toHaveBeenLastCalledWith('Speichern fehlgeschlagen', 'polite');
  });
});
