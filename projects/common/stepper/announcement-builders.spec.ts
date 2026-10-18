import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxTransitionOutcome } from '@cngx/common/data';

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
    commitRefused: (label: string) =>
      lang === 'de'
        ? `Nicht erlaubt, bleibt bei "${label}".`
        : `Not allowed, stayed on "${label}".`,
    commitRefusedGeneric: lang === 'de' ? 'Nicht erlaubt.' : 'Not allowed.',
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
  const lastOutcome = signal<CngxTransitionOutcome | undefined>(undefined);
  const originIndexDuringCommit = signal<number | undefined>(undefined);
  const presenter = {
    stepsOnly,
    activeStepIndex,
    lastFailedIndex,
    lastOutcome,
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
    lastOutcome,
    originIndexDuringCommit,
    steps,
  };
}

describe('createStepperAnnouncementBuilders refused phrase', () => {
  function refuse(
    ctx: ReturnType<typeof setup>,
    sequence: number,
    target = 1,
    origin: number | null = 0,
  ): void {
    // The live region renders (and so reads the phrase) before any
    // commit; a phrase first read after the refusal seeds silent.
    ctx.builders.liveAnnouncement();
    ctx.originIndexDuringCommit.set(origin ?? undefined);
    ctx.lastOutcome.set({ kind: 'refused', index: target, sequence });
    ctx.lastFailedIndex.set(target);
  }

  it('speaks the refused phrase once for a sync refusal and no landing phrase', () => {
    const ctx = setup();
    expect(ctx.builders.liveAnnouncement()).toBe('');
    refuse(ctx, 1);
    expect(ctx.builders.liveAnnouncement()).toBe('Not allowed, stayed on "Step a".');
  });

  it('arms after a pending window that settles to idle with an optimistic rollback', () => {
    const ctx = setup();
    ctx.current.set('pending');
    ctx.activeStepIndex.set(1);
    expect(ctx.builders.liveAnnouncement()).toBe('Committing');
    ctx.previous.set('pending');
    ctx.current.set('idle');
    ctx.activeStepIndex.set(0);
    refuse(ctx, 1);
    expect(ctx.builders.liveAnnouncement()).toBe('Not allowed, stayed on "Step a".');
  });

  it('speaks the generic refused phrase for an origin without a label', () => {
    const ctx = setup();
    refuse(ctx, 1, 1, null);
    expect(ctx.builders.liveAnnouncement()).toBe('Not allowed.');
  });

  it('a following sync accept spends the phrase and stays silent', () => {
    const ctx = setup();
    refuse(ctx, 1);
    expect(ctx.builders.liveAnnouncement()).not.toBe('');
    ctx.activeStepIndex.set(1);
    ctx.current.set('success');
    expect(ctx.builders.liveAnnouncement()).toBe('');
  });

  it('a step move without a commit spends the phrase', () => {
    const ctx = setup();
    refuse(ctx, 1);
    expect(ctx.builders.liveAnnouncement()).not.toBe('');
    ctx.activeStepIndex.set(1);
    expect(ctx.builders.liveAnnouncement()).toBe('');
  });

  it('a cleared outcome (reset) spends the phrase', () => {
    const ctx = setup();
    refuse(ctx, 1);
    expect(ctx.builders.liveAnnouncement()).not.toBe('');
    ctx.lastOutcome.set(undefined);
    expect(ctx.builders.liveAnnouncement()).toBe('');
  });

  it('a cleared marker keeps the phrase', () => {
    const ctx = setup();
    refuse(ctx, 1);
    ctx.lastFailedIndex.set(undefined);
    expect(ctx.builders.liveAnnouncement()).toBe('Not allowed, stayed on "Step a".');
  });

  it('a new commit spends the phrase in favour of the in-flight phrase', () => {
    const ctx = setup();
    refuse(ctx, 1);
    expect(ctx.builders.liveAnnouncement()).toBe('Not allowed, stayed on "Step a".');
    ctx.current.set('pending');
    expect(ctx.builders.liveAnnouncement()).toBe('Committing');
    ctx.previous.set('pending');
    ctx.current.set('error');
    ctx.lastOutcome.set({ kind: 'failed', index: 1, sequence: 2 });
    expect(ctx.builders.liveAnnouncement()).toBe('Reverted to "Step a".');
  });

  it('does not re-speak on a language flip', () => {
    const ctx = setup();
    refuse(ctx, 1);
    expect(ctx.builders.liveAnnouncement()).toBe('Not allowed, stayed on "Step a".');
    ctx.lang.set('de');
    expect(ctx.builders.liveAnnouncement()).toBe('Not allowed, stayed on "Step a".');
  });

  it('a failure never speaks the refused phrase', () => {
    const ctx = setup();
    ctx.originIndexDuringCommit.set(0);
    ctx.lastOutcome.set({ kind: 'failed', index: 1, sequence: 1 });
    ctx.lastFailedIndex.set(1);
    ctx.current.set('error');
    expect(ctx.builders.liveAnnouncement()).toBe('Reverted to "Step a".');
  });
});

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
      stepRolledBack: (base: string) => `${base} rolled back`,
      stepRefused: (base: string) => `${base} not allowed`,
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
    const lastFailedIndex = signal<number | undefined>(undefined);
    const lastOutcome = signal<CngxTransitionOutcome | undefined>(undefined);
    const presenter = {
      stepsOnly,
      activeStepIndex: signal(0),
      lastFailedIndex,
      lastOutcome,
      originIndexDuringCommit: signal(undefined),
      commitTransition: { current: signal('idle'), previous: signal('idle') },
    } as unknown as CngxStepperHost;
    const builders = createStepperAnnouncementBuilders({ presenter, stepsOnly, i18n });
    return { builders, node, lastFailedIndex, lastOutcome };
  }

  it('describes a refused row with stepRefused and a failed row with stepRolledBack', () => {
    const { builders, node, lastFailedIndex, lastOutcome } = buildersFor('idle');
    lastFailedIndex.set(0);
    lastOutcome.set({ kind: 'refused', index: 0, sequence: 1 });
    expect(builders.statusPhrase(node)).toBe('Step 1 of 1: Account not allowed');
    lastOutcome.set({ kind: 'failed', index: 0, sequence: 2 });
    expect(builders.statusPhrase(node)).toBe('Step 1 of 1: Account rolled back');
  });

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
