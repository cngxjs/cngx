import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxTransitionOutcome } from '@cngx/common/data';
import type { CngxTabGroupHost, CngxTabHandle, CngxTabsI18n } from '@cngx/common/tabs';

import { createRejectionState } from './rejection-state';

type CommitStatus = 'idle' | 'pending' | 'success' | 'error';

function i18nFor(lang: 'en' | 'de'): CngxTabsI18n {
  return {
    commitInFlight: lang === 'de' ? 'Wechsle' : 'Switching',
    commitFailedRetry: lang === 'de' ? 'Abgelehnt' : 'Refused',
    commitRolledBackTo: (label: string) =>
      lang === 'de' ? `Zurueck zu "${label}".` : `Reverted to "${label}".`,
    commitRefused: (label: string) =>
      lang === 'de' ? `Nicht erlaubt, bleibt bei "${label}".` : `Not allowed, stayed on "${label}".`,
    commitRefusedGeneric: lang === 'de' ? 'Nicht erlaubt' : 'Not allowed',
  } as unknown as CngxTabsI18n;
}

function setup(originLabel: { en: string; de: string } = { en: 'Profile', de: 'Profil' }) {
  const lang = signal<'en' | 'de'>('en');
  const tab = (id: string, en: string, de: string): CngxTabHandle =>
    ({ id, label: computed(() => (lang() === 'de' ? de : en)) }) as unknown as CngxTabHandle;
  const current = signal<CommitStatus>('idle');
  const lastFailedIndex = signal<number | undefined>(undefined);
  const lastOutcome = signal<CngxTransitionOutcome | undefined>(undefined);
  const originIndexDuringCommit = signal<number | undefined>(undefined);
  const activeIndex = signal(0);
  const presenter = {
    tabs: signal([tab('a', originLabel.en, originLabel.de), tab('b', 'Account', 'Konto')]),
    activeIndex,
    lastFailedIndex,
    lastOutcome,
    originIndexDuringCommit,
    commitTransition: { current: current.asReadonly(), previous: signal('idle').asReadonly() },
  } as unknown as CngxTabGroupHost;
  const state = createRejectionState(
    presenter,
    computed(() => i18nFor(lang())),
  );
  // The announcer reads the phrase from mount on; mirror it so the
  // refused phrase has a prior snapshot to arm against.
  state.liveAnnouncement();
  let sequence = 0;
  const refuse = (index: number, origin: number): void => {
    originIndexDuringCommit.set(origin);
    lastOutcome.set({ kind: 'refused', index, sequence: ++sequence });
    lastFailedIndex.set(index);
  };
  return {
    lang,
    state,
    current,
    lastFailedIndex,
    lastOutcome,
    originIndexDuringCommit,
    activeIndex,
    refuse,
  };
}

describe('createRejectionState language switch', () => {
  it('does not re-announce on a language flip', () => {
    const { lang, state, current, lastFailedIndex, originIndexDuringCommit } = setup();
    lastFailedIndex.set(1);
    originIndexDuringCommit.set(0);
    current.set('error');
    expect(state.liveAnnouncement()).toBe('Reverted to "Profile".');

    lang.set('de');
    expect(state.liveAnnouncement()).toBe('Reverted to "Profile".');
    // The persistent descriptor is not a live region and follows at once.
    expect(state.descriptorText()).toBe('Zurueck zu "Profil".');

    current.set('pending');
    expect(state.liveAnnouncement()).toBe('Wechsle');
    current.set('error');
    expect(state.liveAnnouncement()).toBe('Zurueck zu "Profil".');
  });

  it('keeps the origin indices tracked while the rejection is shown', () => {
    const { state, current, lastFailedIndex, originIndexDuringCommit } = setup();
    current.set('error');
    expect(state.liveAnnouncement()).toBe('Refused');

    lastFailedIndex.set(1);
    originIndexDuringCommit.set(0);
    expect(state.liveAnnouncement()).toBe('Reverted to "Profile".');
  });
});

describe('createRejectionState refused commit', () => {
  it('speaks the refused phrase once and keeps the failure copy out', () => {
    const { state, refuse } = setup();
    refuse(1, 0);
    expect(state.liveAnnouncement()).toBe('Not allowed, stayed on "Profile".');
    expect(state.descriptorText()).toBe('Not allowed, stayed on "Profile".');
    expect(state.reason()).toBe('refused');
  });

  it('reads commitRefusedGeneric for an unlabelled origin', () => {
    const { state, refuse } = setup({ en: '', de: '' });
    refuse(1, 0);
    expect(state.liveAnnouncement()).toBe('Not allowed');
    expect(state.descriptorText()).toBe('Not allowed');
  });

  it('spends the refused phrase on the next commit and on an active-index move', () => {
    const { state, refuse, current, activeIndex } = setup();
    refuse(1, 0);
    expect(state.liveAnnouncement()).not.toBe('');
    current.set('pending');
    expect(state.liveAnnouncement()).toBe('Switching');
    current.set('idle');
    expect(state.liveAnnouncement()).toBe('');

    refuse(1, 0);
    expect(state.liveAnnouncement()).not.toBe('');
    activeIndex.set(1);
    expect(state.liveAnnouncement()).toBe('');
  });

  it('a failed outcome keeps the rolled-back copy and reason failed', () => {
    const { state, current, lastFailedIndex, lastOutcome, originIndexDuringCommit } = setup();
    originIndexDuringCommit.set(0);
    lastOutcome.set({ kind: 'failed', index: 1, sequence: 1 });
    lastFailedIndex.set(1);
    current.set('error');
    expect(state.liveAnnouncement()).toBe('Reverted to "Profile".');
    expect(state.descriptorText()).toBe('Reverted to "Profile".');
    expect(state.reason()).toBe('failed');
  });

  it('reason is undefined while no rejection is pinned', () => {
    const { state, refuse, lastFailedIndex } = setup();
    expect(state.reason()).toBeUndefined();
    refuse(1, 0);
    lastFailedIndex.set(undefined);
    expect(state.reason()).toBeUndefined();
    expect(state.descriptorText()).toBe('');
  });
});
