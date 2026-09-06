import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { createAnnouncementPhrase } from './announcement-phrase';

interface Snapshot {
  readonly selected: boolean;
  readonly busy: boolean;
}

function makePhrase(source: () => Snapshot, seed?: (src: Snapshot) => string) {
  return TestBed.runInInjectionContext(() =>
    createAnnouncementPhrase({
      source,
      arm: (curr, prev) =>
        curr.selected !== prev.selected ? (curr.selected ? 'Selected' : 'Deselected') : null,
      spend: (curr, prev) => curr.busy && !prev.busy,
      seed,
    }),
  );
}

describe('createAnnouncementPhrase', () => {
  it('mounts empty - initial state is visible, never announced', () => {
    const state = signal<Snapshot>({ selected: true, busy: false });
    const phrase = makePhrase(() => state());
    expect(phrase()).toBe('');
  });

  it('mounts with the seed phrase when provided', () => {
    const state = signal<Snapshot>({ selected: false, busy: false });
    const phrase = makePhrase(() => state(), (src) => (src.busy ? 'Busy' : 'Ready'));
    expect(phrase()).toBe('Ready');
  });

  it('arms on a real transition and keeps the phrase on unrelated changes', () => {
    const state = signal<Snapshot>({ selected: false, busy: false });
    const phrase = makePhrase(() => state());
    expect(phrase()).toBe('');

    state.set({ selected: true, busy: false });
    expect(phrase()).toBe('Selected');

    state.set({ selected: true, busy: false });
    expect(phrase()).toBe('Selected');
  });

  it('spends an armed phrase on the expiry transition', () => {
    const state = signal<Snapshot>({ selected: false, busy: false });
    const phrase = makePhrase(() => state());
    expect(phrase()).toBe('');

    state.set({ selected: true, busy: false });
    expect(phrase()).toBe('Selected');

    state.set({ selected: true, busy: true });
    expect(phrase()).toBe('');
  });

  it('keeps a phrase armed during the busy window across the clear', () => {
    const state = signal<Snapshot>({ selected: false, busy: false });
    const phrase = makePhrase(() => state());
    expect(phrase()).toBe('');

    state.set({ selected: false, busy: true });
    expect(phrase()).toBe('');

    state.set({ selected: true, busy: true });
    expect(phrase()).toBe('Selected');

    state.set({ selected: true, busy: false });
    expect(phrase()).toBe('Selected');
  });

  it('treats an empty-string arm as a phrase, not a fall-through', () => {
    const state = signal({ phrase: 'closed tab', status: 'idle' });
    const p = TestBed.runInInjectionContext(() =>
      createAnnouncementPhrase({
        source: () => state(),
        arm: (curr, prev) => (curr.phrase !== prev.phrase ? curr.phrase : null),
        spend: (curr, prev) => curr.status !== prev.status,
        seed: (src) => src.phrase,
      }),
    );
    expect(p()).toBe('closed tab');

    state.set({ phrase: '', status: 'idle' });
    expect(p()).toBe('');

    state.set({ phrase: 'closed again', status: 'idle' });
    expect(p()).toBe('closed again');

    state.set({ phrase: 'closed again', status: 'pending' });
    expect(p()).toBe('');
  });
});
