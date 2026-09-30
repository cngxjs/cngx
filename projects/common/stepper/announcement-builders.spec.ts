import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createStepperAnnouncementBuilders } from './announcement-builders';
import type { CngxStepperI18n } from './i18n/stepper-i18n';
import type { CngxStepNode, CngxStepperHost } from './stepper-host.token';

type CommitStatus = 'idle' | 'pending' | 'success' | 'error';

function i18nFor(lang: 'en' | 'de'): CngxStepperI18n {
  return {
    selectedStep: (label: string, position: number, count: number) =>
      lang === 'de'
        ? `Schritt ${position} von ${count}: ${label}`
        : `Step ${position} of ${count}: ${label}`,
    commitInFlight: lang === 'de' ? 'Speichere' : 'Committing',
    commitRolledBackTo: (label: string) =>
      lang === 'de' ? `Zurueck zu "${label}".` : `Reverted to "${label}".`,
    commitFailedRetry: lang === 'de' ? 'Fehlgeschlagen' : 'Failed',
  } as unknown as CngxStepperI18n;
}

// Step labels derived from the language, like the Material bridge's
// `Step <id>` fallback: they are copy, so the live phrase must not follow them.
function setup() {
  const lang = signal<'en' | 'de'>('en');
  const i18n = computed(() => i18nFor(lang()));
  const steps = ['a', 'b'].map(
    (id, flatIndex) =>
      ({
        id,
        kind: 'step',
        flatIndex,
        label: computed(() => (lang() === 'de' ? `Schritt ${id}` : `Step ${id}`)),
      }) as unknown as CngxStepNode,
  );
  const stepsOnly = signal<readonly CngxStepNode[]>(steps);
  const current = signal<CommitStatus>('idle');
  const previous = signal<CommitStatus>('idle');
  const activeStepIndex = signal(0);
  const lastFailedIndex = signal<number | undefined>(undefined);
  const originIndexDuringCommit = signal<number | undefined>(undefined);
  const presenter = {
    stepsOnly,
    activeStepIndex,
    lastFailedIndex,
    originIndexDuringCommit,
    commitMode: signal('pessimistic'),
    commitTransition: { current: current.asReadonly(), previous: previous.asReadonly() },
  } as unknown as CngxStepperHost;
  const builders = createStepperAnnouncementBuilders({ presenter, stepsOnly, i18n });
  return { lang, builders, current, previous, activeStepIndex, lastFailedIndex, originIndexDuringCommit };
}

describe('createStepperAnnouncementBuilders language switch', () => {
  it('does not re-announce on a language flip when the landed step label derives from copy', () => {
    const { lang, builders, current, previous, activeStepIndex } = setup();
    current.set('pending');
    expect(builders.liveAnnouncement()).toBe('Committing');
    activeStepIndex.set(1);
    previous.set('pending');
    current.set('success');
    expect(builders.liveAnnouncement()).toBe('Step 2 of 2: Step b');

    lang.set('de');
    expect(builders.liveAnnouncement()).toBe('Step 2 of 2: Step b');
  });

  it('does not re-announce on a language flip when the origin label derives from copy', () => {
    const { lang, builders, current, lastFailedIndex, originIndexDuringCommit } = setup();
    lastFailedIndex.set(1);
    originIndexDuringCommit.set(0);
    current.set('error');
    expect(builders.liveAnnouncement()).toBe('Reverted to "Step a".');

    lang.set('de');
    expect(builders.liveAnnouncement()).toBe('Reverted to "Step a".');

    current.set('pending');
    expect(builders.liveAnnouncement()).toBe('Speichere');
    current.set('error');
    expect(builders.liveAnnouncement()).toBe('Zurueck zu "Schritt a".');
  });
});
