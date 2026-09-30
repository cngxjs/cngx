import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxTabGroupHost, CngxTabHandle, CngxTabsI18n } from '@cngx/common/tabs';

import { createRejectionState } from './rejection-state';

type CommitStatus = 'idle' | 'pending' | 'success' | 'error';

function i18nFor(lang: 'en' | 'de'): CngxTabsI18n {
  return {
    commitInFlight: lang === 'de' ? 'Wechsle' : 'Switching',
    commitFailedRetry: lang === 'de' ? 'Abgelehnt' : 'Refused',
    commitRolledBackTo: (label: string) =>
      lang === 'de' ? `Zurueck zu "${label}".` : `Reverted to "${label}".`,
  } as unknown as CngxTabsI18n;
}

function setup() {
  const lang = signal<'en' | 'de'>('en');
  const tab = (id: string, en: string, de: string): CngxTabHandle =>
    ({ id, label: computed(() => (lang() === 'de' ? de : en)) }) as unknown as CngxTabHandle;
  const current = signal<CommitStatus>('idle');
  const lastFailedIndex = signal<number | undefined>(undefined);
  const originIndexDuringCommit = signal<number | undefined>(undefined);
  const presenter = {
    tabs: signal([tab('a', 'Profile', 'Profil'), tab('b', 'Account', 'Konto')]),
    lastFailedIndex,
    originIndexDuringCommit,
    commitTransition: { current: current.asReadonly(), previous: signal('idle').asReadonly() },
  } as unknown as CngxTabGroupHost;
  const state = createRejectionState(
    presenter,
    computed(() => i18nFor(lang())),
  );
  return { lang, state, current, lastFailedIndex, originIndexDuringCommit };
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
