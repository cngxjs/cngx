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
  return {
    lang,
    builders,
    current,
    previous,
    activeStepIndex,
    lastFailedIndex,
    originIndexDuringCommit,
  };
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

describe('createStepperAnnouncementBuilders headerStatusPhrase', () => {
  function buildersFor(state: string, flatIndex = 0) {
    const i18n = signal({
      selectedStep: (label: string, position: number, count: number) =>
        `Step ${position} of ${count}: ${label}`,
      stepWithDetail: (step: string, detail: string) => `${step} (${detail})`,
      stepRolledBack: (base: string) => base,
      statusLabels: {
        done: 'Done',
        errored: 'Errored',
        inProgress: 'In progress',
        upNext: 'Up next',
      },
    } as unknown as CngxStepperI18n);
    const node = {
      id: 'a',
      kind: 'step',
      flatIndex,
      label: signal('Account'),
      state: signal(state),
    } as unknown as CngxStepNode;
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const presenter = {
      stepsOnly,
      lastFailedIndex: signal(undefined),
      originIndexDuringCommit: signal(undefined),
      commitTransition: { current: signal('idle'), previous: signal('idle') },
    } as unknown as CngxStepperHost;
    const builders = createStepperAnnouncementBuilders({ presenter, stepsOnly, i18n });
    return { builders, node };
  }

  function builderFor(state: string): string {
    const { builders, node } = buildersFor(state);
    return builders.headerStatusPhrase(node);
  }

  it('names the done and errored status through stepWithDetail', () => {
    expect(builderFor('success')).toBe('Step 1 of 1: Account (Done)');
    expect(builderFor('error')).toBe('Step 1 of 1: Account (Errored)');
  });

  it('keeps the plain status phrase for a step without a glyph status', () => {
    expect(builderFor('idle')).toBe('Step 1 of 1: Account');
  });

  it('references the descriptor while only the glyph status is non-empty', () => {
    const { builders, node } = buildersFor('success', -1);
    expect(builders.statusPhrase(node)).toBe('');
    expect(builders.headerStatusPhrase(node)).toBe('Done');
    expect(builders.describedBy(node)).toBe('a-desc');
  });
});
