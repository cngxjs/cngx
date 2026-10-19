import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { createRefusedPhrase } from './refused-phrase';
import type { CngxTransitionOutcome } from './transition-outcome';

function setup(withExtra = false) {
  const outcome = signal<CngxTransitionOutcome | undefined>(undefined);
  const status = signal<string>('idle');
  const activeIndex = signal<number | undefined>(0);
  const copy = signal('Refused');
  const extra = signal('close-a');
  const phrase = TestBed.runInInjectionContext(() =>
    createRefusedPhrase({
      outcome: () => outcome(),
      status: () => status(),
      activeIndex: () => activeIndex(),
      copy: () => copy(),
      extraSpend: withExtra ? () => extra() : undefined,
    }),
  );
  return { outcome, status, activeIndex, copy, extra, phrase };
}

describe('createRefusedPhrase', () => {
  it('mounts empty', () => {
    const { phrase } = setup();
    expect(phrase()).toBe('');
  });

  it('arms on each new refused sequence', () => {
    const { outcome, phrase } = setup();
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
  });

  it('re-arms on a new sequence for the same target', () => {
    const { outcome, status, copy, phrase } = setup();
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
    status.set('pending');
    expect(phrase()).toBe('');
    status.set('idle');
    copy.set('Refused again');
    outcome.set({ kind: 'refused', index: 1, sequence: 2 });
    expect(phrase()).toBe('Refused again');
  });

  it('keeps the phrase when only the index of the outcome moves (same sequence)', () => {
    const { outcome, phrase } = setup();
    phrase();
    outcome.set({ kind: 'refused', index: 2, sequence: 1 });
    expect(phrase()).toBe('Refused');
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
  });

  it('never arms on a failed outcome', () => {
    const { outcome, phrase } = setup();
    phrase();
    outcome.set({ kind: 'failed', index: 1, sequence: 1 });
    expect(phrase()).toBe('');
  });

  it('spends on a status change', () => {
    const { outcome, status, phrase } = setup();
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
    status.set('pending');
    expect(phrase()).toBe('');
  });

  it('spends on an active-index move', () => {
    const { outcome, activeIndex, phrase } = setup();
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
    activeIndex.set(2);
    expect(phrase()).toBe('');
  });

  it('spends on a cleared outcome', () => {
    const { outcome, phrase } = setup();
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
    outcome.set(undefined);
    expect(phrase()).toBe('');
  });

  it('spends on a changed extraSpend value when given', () => {
    const { outcome, extra, phrase } = setup(true);
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
    extra.set('close-b');
    expect(phrase()).toBe('');
  });

  it('ignores the extra signal when extraSpend is not given', () => {
    const { outcome, extra, phrase } = setup(false);
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    extra.set('close-b');
    expect(phrase()).toBe('Refused');
  });

  it('lets arm win over spend in one flush', () => {
    const { outcome, status, activeIndex, extra, phrase } = setup(true);
    phrase();
    status.set('pending');
    activeIndex.set(1);
    extra.set('close-b');
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    status.set('idle');
    activeIndex.set(0);
    expect(phrase()).toBe('Refused');
  });

  it('reads the copy untracked: a copy change does not re-emit', () => {
    const { outcome, copy, phrase } = setup();
    phrase();
    outcome.set({ kind: 'refused', index: 1, sequence: 1 });
    expect(phrase()).toBe('Refused');
    copy.set('Abgelehnt');
    expect(phrase()).toBe('Refused');
  });
});
