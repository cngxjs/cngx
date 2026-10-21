import { computed, provideZonelessChangeDetection, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CngxTransitionOutcome } from '@cngx/common/data';
import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import {
  CNGX_TABS_CONFIG,
  provideTabsConfig,
  withTabsAriaLabels,
  withTabsFallbackLabels,
  type CngxTabsConfig,
} from '../tabs-config';
import {
  CNGX_TABS_I18N,
  provideTabsI18n,
  withTabsI18nLabels,
  type CngxTabsI18n,
} from '../i18n/tabs-i18n';
import type { CngxTabGroupHost, CngxTabHandle } from '../tab-group-host.token';
import { createTabGroupAnnouncements } from './tab-group-announcements';
import { stripBidiIsolates } from '@cngx/testing';

interface HandleOverrides {
  readonly hasError?: boolean;
  readonly errorMessage?: string | undefined;
  readonly aggregator?: CngxErrorAggregatorContract;
}

function makeHandle(overrides: HandleOverrides = {}): CngxTabHandle {
  return {
    id: 'tab-a',
    label: signal<string | undefined>('A'),
    subLabel: signal<string | undefined>(undefined),
    disabled: signal(false),
    errorAggregator: signal(overrides.aggregator),
    hasError: signal(overrides.hasError ?? false),
    errorMessage: signal(overrides.errorMessage),
    closable: signal<boolean | undefined>(undefined),
  };
}

function makePresenter(): CngxTabGroupHost {
  return {
    activeIndex: signal(0),
    tabs: signal([] as readonly CngxTabHandle[]),
  } as unknown as CngxTabGroupHost;
}

type CommitStatus = 'idle' | 'pending' | 'error' | 'success';

function makeCommitPresenter(): {
  presenter: CngxTabGroupHost;
  current: ReturnType<typeof signal<CommitStatus>>;
  previous: ReturnType<typeof signal<CommitStatus>>;
} {
  const current = signal<CommitStatus>('idle');
  const previous = signal<CommitStatus>('idle');
  const presenter = {
    activeIndex: signal(0),
    tabs: signal([] as readonly CngxTabHandle[]),
    lastFailedIndex: signal<number | undefined>(undefined),
    lastOutcome: signal<CngxTransitionOutcome | undefined>(undefined),
    originIndexDuringCommit: signal<number | undefined>(undefined),
    commitTransition: { current: current.asReadonly(), previous: previous.asReadonly() },
  } as unknown as CngxTabGroupHost;
  return { presenter, current, previous };
}

describe('createTabGroupAnnouncements - closedAnnouncement priority chain', () => {
  let i18n: Signal<CngxTabsI18n>;
  let config: CngxTabsConfig;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    i18n = TestBed.inject(CNGX_TABS_I18N);
    config = TestBed.inject(CNGX_TABS_CONFIG);
  });

  function chainSetup() {
    const { presenter, current } = makeCommitPresenter();
    const closed = signal('');
    const bundle = createTabGroupAnnouncements({
      presenter,
      i18n,
      config,
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
      closedAnnouncement: closed.asReadonly(),
    });
    return { bundle, closed, current };
  }

  it('surfaces the landed-close phrase while the commit state is idle', () => {
    const { bundle, closed } = chainSetup();
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('');
    closed.set('Closed "B"');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Closed "B"');
  });

  it('a commit phrase wins over the close phrase', () => {
    const { bundle, closed, current } = chainSetup();
    closed.set('Closed "B"');
    current.set('pending');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe(i18n().commitInFlight);
  });

  it('a stale close phrase does not re-enter after commit activity returns to idle', () => {
    const { bundle, closed, current } = chainSetup();
    closed.set('Closed "B"');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Closed "B"');
    // Commit activity spends the phrase...
    current.set('pending');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe(i18n().commitInFlight);
    current.set('idle');
    // ...so returning to idle must not re-announce the old close.
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('');
    // A NEW landed close re-arms the chain.
    closed.set('Closed "C"');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Closed "C"');
  });
});

describe('createTabGroupAnnouncements - statusPhrase', () => {
  let i18n: Signal<CngxTabsI18n>;
  let config: CngxTabsConfig;

  function build(): ReturnType<typeof createTabGroupAnnouncements> {
    return createTabGroupAnnouncements({
      presenter: makePresenter(),
      i18n,
      config,
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
    });
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    i18n = TestBed.inject(CNGX_TABS_I18N);
    config = TestBed.inject(CNGX_TABS_CONFIG);
  });

  it('returns empty when the tab has no error', () => {
    const { statusPhrase } = build();
    expect(statusPhrase(makeHandle({ hasError: false }))).toBe('');
  });

  it('announces the direct-error message when set and no aggregator', () => {
    const { statusPhrase } = build();
    const handle = makeHandle({ hasError: true, errorMessage: 'Required fields missing' });
    expect(statusPhrase(handle)).toBe('Required fields missing');
  });

  it('falls back to tabHasErrors(1) for a bare direct flag with no message', () => {
    const { statusPhrase } = build();
    const handle = makeHandle({ hasError: true, errorMessage: undefined });
    expect(statusPhrase(handle)).toBe(i18n().tabHasErrors(1));
  });

  it('prefers the aggregator announcement over the direct message', () => {
    const aggregator = {
      hasError: signal(true),
      shouldShow: signal(true),
      announcement: signal('2 fields invalid'),
      errorCount: signal(2),
      errorLabels: signal([] as readonly string[]),
      activeErrors: signal([] as readonly string[]),
      addSource: () => {},
      removeSource: () => {},
    } satisfies CngxErrorAggregatorContract;
    const { statusPhrase } = build();
    const handle = makeHandle({ hasError: true, errorMessage: 'direct msg', aggregator });
    expect(statusPhrase(handle)).toBe('2 fields invalid');
  });
});

describe('createTabGroupAnnouncements - role descriptions', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  function roleDescriptions(config: CngxTabsConfig) {
    return TestBed.runInInjectionContext(() =>
      createTabGroupAnnouncements({
        presenter: makePresenter(),
        i18n: TestBed.inject(CNGX_TABS_I18N),
        config,
        ariaLabel: signal<string | undefined>(undefined),
        ariaLabelledBy: signal<string | undefined>(undefined),
      }),
    );
  }

  it('falls back to the config defaults when a config omits fallbackLabels', () => {
    const bundle = roleDescriptions({});
    expect(bundle.tabsRoleDescription()).toBe('tab list');
    expect(bundle.tabPanelRoleDescription()).toBe('tab panel');
  });

  it('uses the configured fallback labels when set', () => {
    const bundle = roleDescriptions({
      fallbackLabels: { tabRoleDescription: 'Registerliste', tabPanelRoleDescription: 'Register' },
    });
    expect(bundle.tabsRoleDescription()).toBe('Registerliste');
    expect(bundle.tabPanelRoleDescription()).toBe('Register');
  });
});

describe('createTabGroupAnnouncements - language switch', () => {
  function switchSetup() {
    const lang = signal<'en' | 'de'>('en');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels(
            computed<Partial<CngxTabsI18n>>(() =>
              lang() === 'de'
                ? {
                    tabsLabel: 'Reiter',
                    commitInFlight: 'Wechsle Reiter',
                    commitFailedRetry: 'Abgelehnt',
                    tabHasErrors: (count) => `${count} Fehler`,
                  }
                : {},
            ),
          ),
        ),
      ],
    });
    const { presenter, current } = makeCommitPresenter();
    const bundle = createTabGroupAnnouncements({
      presenter,
      i18n: TestBed.inject(CNGX_TABS_I18N),
      config: {},
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
    });
    return { lang, bundle, current };
  }

  it('does not re-announce on a language flip', () => {
    const { lang, bundle, current } = switchSetup();
    current.set('pending');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Switching tab…');

    lang.set('de');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Switching tab…');

    current.set('error');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Abgelehnt');
  });

  it('re-labels the non-live surfaces at once', () => {
    const { lang, bundle } = switchSetup();
    const handle = makeHandle({ hasError: true });
    expect(bundle.resolvedAriaLabel()).toBe('Tabs');
    expect(bundle.statusPhrase(handle)).toBe('1 error');

    lang.set('de');
    expect(bundle.resolvedAriaLabel()).toBe('Reiter');
    expect(bundle.statusPhrase(handle)).toBe('1 Fehler');
  });
});

describe('createTabGroupAnnouncements - config copy switch', () => {
  it('re-labels the landmark and role descriptions on a language flip', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withTabsAriaLabels(computed(() => (lang() === 'de' ? { tabsRegion: 'Reiter' } : {}))),
          withTabsFallbackLabels(
            computed(() =>
              lang() === 'de'
                ? { tabRoleDescription: 'Reiterliste', tabPanelRoleDescription: 'Reiterinhalt' }
                : {},
            ),
          ),
        ),
      ],
    });
    const bundle = createTabGroupAnnouncements({
      presenter: makePresenter(),
      i18n: TestBed.inject(CNGX_TABS_I18N),
      config: TestBed.inject(CNGX_TABS_CONFIG),
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
    });
    expect(bundle.resolvedAriaLabel()).toBe('Tabs');
    expect(bundle.tabsRoleDescription()).toBe('tab list');

    lang.set('de');
    expect(bundle.resolvedAriaLabel()).toBe('Reiter');
    expect(bundle.tabsRoleDescription()).toBe('Reiterliste');
    expect(bundle.tabPanelRoleDescription()).toBe('Reiterinhalt');
  });
});

describe('createTabGroupAnnouncements - consumer-translated tab labels', () => {
  function labelSetup() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const lang = signal<'en' | 'de'>('en');
    const handle = (id: string, en: string, de: string): CngxTabHandle => ({
      ...makeHandle(),
      id,
      label: computed(() => (lang() === 'de' ? de : en)),
    });
    const { presenter, current, previous } = makeCommitPresenter();
    const tabs = presenter.tabs as ReturnType<typeof signal<readonly CngxTabHandle[]>>;
    tabs.set([handle('a', 'Profile', 'Profil'), handle('b', 'Account', 'Konto')]);
    const bundle = createTabGroupAnnouncements({
      presenter,
      i18n: TestBed.inject(CNGX_TABS_I18N),
      config: {},
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
    });
    const host = presenter as unknown as {
      activeIndex: ReturnType<typeof signal<number>>;
      lastFailedIndex: ReturnType<typeof signal<number | undefined>>;
      originIndexDuringCommit: ReturnType<typeof signal<number | undefined>>;
    };
    return { lang, bundle, current, previous, host };
  }

  it('does not re-announce the landed tab on a language flip', () => {
    const { lang, bundle, current, previous, host } = labelSetup();
    host.activeIndex.set(1);
    previous.set('pending');
    current.set('success');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Next tab: Tab 2 of 2: Account');

    lang.set('de');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Next tab: Tab 2 of 2: Account');
  });

  it('does not re-announce the rollback origin on a language flip', () => {
    const { lang, bundle, current, host } = labelSetup();
    host.lastFailedIndex.set(1);
    host.originIndexDuringCommit.set(0);
    current.set('error');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe(
      'Could not save changes - reverted to "Profile".',
    );

    lang.set('de');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe(
      'Could not save changes - reverted to "Profile".',
    );
  });
});

describe('createTabGroupAnnouncements - direction formatters', () => {
  it('lets previousTab / nextTab own the order of the commit-success sentence', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels({
            nextTab: (phrase) => `${phrase} (weiter)`,
            previousTab: (phrase) => `${phrase} (zurück)`,
          }),
        ),
      ],
    });
    const { presenter, current, previous } = makeCommitPresenter();
    const tabs = presenter.tabs as ReturnType<typeof signal<readonly CngxTabHandle[]>>;
    tabs.set([
      { ...makeHandle(), id: 'a', label: signal('Profile') },
      { ...makeHandle(), id: 'b', label: signal('Account') },
    ]);
    const bundle = createTabGroupAnnouncements({
      presenter,
      i18n: TestBed.inject(CNGX_TABS_I18N),
      config: {},
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
    });
    const host = presenter as unknown as { activeIndex: ReturnType<typeof signal<number>> };
    host.activeIndex.set(1);
    previous.set('pending');
    current.set('success');
    expect(stripBidiIsolates(bundle.liveAnnouncement())).toBe('Tab 2 of 2: Account (weiter)');
  });
});

describe('createTabGroupAnnouncements - refused commit', () => {
  function refusalSetup(labels: readonly (string | undefined)[] = ['Profile', 'Account', 'Billing']) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    const { presenter, current, previous } = makeCommitPresenter();
    const tabs = presenter.tabs as ReturnType<typeof signal<readonly CngxTabHandle[]>>;
    tabs.set(
      labels.map((label, i) => ({ ...makeHandle(), id: `t${i}`, label: signal(label) })),
    );
    const closed = signal('');
    const bundle = createTabGroupAnnouncements({
      presenter,
      i18n,
      config: {},
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
      closedAnnouncement: closed.asReadonly(),
    });
    const host = presenter as unknown as {
      activeIndex: ReturnType<typeof signal<number>>;
      lastFailedIndex: ReturnType<typeof signal<number | undefined>>;
      lastOutcome: ReturnType<typeof signal<CngxTransitionOutcome | undefined>>;
      originIndexDuringCommit: ReturnType<typeof signal<number | undefined>>;
    };
    let sequence = 0;
    const settle = (kind: 'refused' | 'failed', index: number, origin: number): void => {
      host.originIndexDuringCommit.set(origin);
      host.lastOutcome.set({ kind, index, sequence: ++sequence });
      host.lastFailedIndex.set(index);
      if (kind === 'failed') {
        current.set('error');
      }
    };
    const live = (): string => stripBidiIsolates(bundle.liveAnnouncement());
    // The organism's live region reads the phrase at first render, before
    // any commit settles; mirror that so the phrase has a prior snapshot.
    live();
    return { i18n, bundle, current, previous, host, closed, settle, live };
  }

  it('speaks commitRefused with the origin label once, not the failure copy', () => {
    const { settle, live } = refusalSetup();
    settle('refused', 1, 0);
    expect(live()).toBe('Tab switch not allowed - stayed on "Profile".');
    // Holds until something spends it - no flicker on a re-read.
    expect(live()).toBe('Tab switch not allowed - stayed on "Profile".');
  });

  it('speaks commitRefused with the position when the origin tab has no label', () => {
    const { settle, live } = refusalSetup([undefined, 'Account']);
    settle('refused', 1, 0);
    expect(live()).toBe('Tab switch not allowed - stayed on "Tab 1".');
  });

  it('speaks the generic refusal when the origin index points at a removed tab', () => {
    const { settle, live } = refusalSetup([undefined, 'Account']);
    settle('refused', 1, 4);
    expect(live()).toBe('Tab switch not allowed.');
  });

  it('a failed outcome keeps the failure arm and never the refused phrase', () => {
    const { settle, live } = refusalSetup();
    settle('failed', 1, 0);
    expect(live()).toBe('Could not save changes - reverted to "Profile".');
  });

  it('the next commit spends the refused phrase', () => {
    const { settle, live, current, i18n } = refusalSetup();
    settle('refused', 1, 0);
    expect(live()).not.toBe('');
    current.set('pending');
    expect(live()).toBe(i18n().commitInFlight);
    current.set('idle');
    expect(live()).toBe('');
  });

  it('an active-index move spends the refused phrase', () => {
    const { settle, live, host } = refusalSetup();
    settle('refused', 1, 0);
    expect(live()).not.toBe('');
    host.activeIndex.set(2);
    expect(live()).toBe('');
  });

  it('a cleared outcome (the refused tab itself closed) spends the refused phrase', () => {
    const { settle, live, host } = refusalSetup();
    settle('refused', 1, 0);
    host.lastOutcome.set(undefined);
    host.lastFailedIndex.set(undefined);
    expect(live()).toBe('');
  });

  it('a second refusal with a new sequence arms again', () => {
    const { settle, live, current } = refusalSetup();
    settle('refused', 1, 0);
    current.set('pending');
    live();
    current.set('idle');
    expect(live()).toBe('');
    settle('refused', 2, 0);
    expect(live()).toBe('Tab switch not allowed - stayed on "Profile".');
  });

  it('the close shift (index moved, sequence copied) does not re-announce', () => {
    const { settle, live, host, current } = refusalSetup();
    settle('refused', 2, 1);
    current.set('pending');
    live();
    current.set('idle');
    expect(live()).toBe('');
    const outcome = host.lastOutcome() as CngxTransitionOutcome;
    host.lastOutcome.set({ ...outcome, index: 1 });
    expect(live()).toBe('');
  });

  it('closing another tab after a refusal speaks the close phrase', () => {
    const { settle, live, closed } = refusalSetup();
    settle('refused', 1, 0);
    expect(live()).toBe('Tab switch not allowed - stayed on "Profile".');
    closed.set('Closed "Billing"');
    expect(live()).toBe('Closed "Billing"');
  });

  it('a stale close phrase does not resurface once a refusal supersedes it', () => {
    const { settle, live, closed, host } = refusalSetup();
    closed.set('Closed "Billing"');
    expect(live()).toBe('Closed "Billing"');
    settle('refused', 1, 0);
    expect(live()).toBe('Tab switch not allowed - stayed on "Profile".');
    host.activeIndex.set(2);
    expect(live()).toBe('');
  });
});

describe('createTabGroupAnnouncements - label-less tabs', () => {
  function unlabelledSetup(labels: readonly (string | undefined)[]) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const { presenter, current, previous } = makeCommitPresenter();
    const tabs = presenter.tabs as ReturnType<typeof signal<readonly CngxTabHandle[]>>;
    const handles = labels.map((label, i) => ({
      ...makeHandle(),
      id: `t${i}`,
      label: signal(label),
    }));
    tabs.set(handles);
    const bundle = createTabGroupAnnouncements({
      presenter,
      i18n: TestBed.inject(CNGX_TABS_I18N),
      config: {},
      ariaLabel: signal<string | undefined>(undefined),
      ariaLabelledBy: signal<string | undefined>(undefined),
    });
    const host = presenter as unknown as {
      activeIndex: ReturnType<typeof signal<number>>;
      lastFailedIndex: ReturnType<typeof signal<number | undefined>>;
      lastOutcome: ReturnType<typeof signal<CngxTransitionOutcome | undefined>>;
      originIndexDuringCommit: ReturnType<typeof signal<number | undefined>>;
    };
    const live = (): string => stripBidiIsolates(bundle.liveAnnouncement());
    live();
    return { bundle, handles, current, previous, host, live };
  }

  it('names a label-less tab button by its position', () => {
    const { bundle, handles } = unlabelledSetup(['Profile', undefined, 'Billing']);
    expect(stripBidiIsolates(bundle.tabAriaLabel(handles[1], 2))).toBe('Tab 2 of 3');
  });

  it('keeps the sub-label next to the position name', () => {
    const { bundle } = unlabelledSetup(['Profile', undefined, 'Billing']);
    const handle: CngxTabHandle = {
      ...makeHandle(),
      id: 't1',
      label: signal<string | undefined>(undefined),
      subLabel: signal<string | undefined>('45'),
    };
    expect(stripBidiIsolates(bundle.tabAriaLabel(handle, 2))).toBe('Tab 2 of 3, 45');
  });

  it('keeps the labelled name unchanged', () => {
    const { bundle, handles } = unlabelledSetup(['Profile', undefined, 'Billing']);
    expect(stripBidiIsolates(bundle.tabAriaLabel(handles[0], 1))).toBe('Tab 1 of 3: Profile');
  });

  it('speaks the position of a label-less tab after a successful move', () => {
    const { host, current, previous, live } = unlabelledSetup(['Profile', undefined, 'Billing']);
    host.activeIndex.set(1);
    previous.set('pending');
    current.set('success');
    expect(live()).toBe('Next tab: Tab 2 of 3');
  });

  it('speaks the rollback to a label-less origin by its position', () => {
    const { host, current, live } = unlabelledSetup([undefined, 'Account']);
    host.originIndexDuringCommit.set(0);
    host.lastFailedIndex.set(1);
    current.set('error');
    expect(live()).toBe('Could not save changes - reverted to "Tab 1".');
  });

  it('keeps the retry copy when the origin index points at a removed tab', () => {
    const { host, current, live } = unlabelledSetup([undefined, 'Account']);
    host.originIndexDuringCommit.set(5);
    host.lastFailedIndex.set(1);
    current.set('error');
    expect(live()).toBe('Could not switch tab - retry?');
  });

  it('keeps the retry copy when no origin tab resolves', () => {
    const { host, current, live } = unlabelledSetup([undefined, 'Account']);
    host.lastFailedIndex.set(1);
    current.set('error');
    expect(live()).toBe('Could not switch tab - retry?');
  });

  it('keeps the generic refusal copy when the origin is unknown', () => {
    const { host, live } = unlabelledSetup([undefined, 'Account']);
    host.lastOutcome.set({ kind: 'refused', index: 1, sequence: 1 });
    host.lastFailedIndex.set(1);
    expect(live()).toBe('Tab switch not allowed.');
  });
});
