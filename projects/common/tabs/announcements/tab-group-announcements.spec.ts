import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CNGX_TABS_CONFIG, type CngxTabsConfig } from '../tabs-config';
import { CNGX_TABS_I18N, type CngxTabsI18n } from '../i18n/tabs-i18n';
import type { CngxTabGroupHost, CngxTabHandle } from '../tab-group-host.token';
import { createTabGroupAnnouncements } from './tab-group-announcements';

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
    originIndexDuringCommit: signal<number | undefined>(undefined),
    commitTransition: { current: current.asReadonly(), previous: previous.asReadonly() },
  } as unknown as CngxTabGroupHost;
  return { presenter, current, previous };
}

describe('createTabGroupAnnouncements - closedAnnouncement priority chain', () => {
  let i18n: CngxTabsI18n;
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
    expect(bundle.liveAnnouncement()).toBe('');
    closed.set('Closed "B"');
    expect(bundle.liveAnnouncement()).toBe('Closed "B"');
  });

  it('a commit phrase wins over the close phrase', () => {
    const { bundle, closed, current } = chainSetup();
    closed.set('Closed "B"');
    current.set('pending');
    expect(bundle.liveAnnouncement()).toBe(i18n.commitInFlight);
  });

  it('a stale close phrase does not re-enter after commit activity returns to idle', () => {
    const { bundle, closed, current } = chainSetup();
    closed.set('Closed "B"');
    expect(bundle.liveAnnouncement()).toBe('Closed "B"');
    // Commit activity spends the phrase...
    current.set('pending');
    expect(bundle.liveAnnouncement()).toBe(i18n.commitInFlight);
    current.set('idle');
    // ...so returning to idle must not re-announce the old close.
    expect(bundle.liveAnnouncement()).toBe('');
    // A NEW landed close re-arms the chain.
    closed.set('Closed "C"');
    expect(bundle.liveAnnouncement()).toBe('Closed "C"');
  });
});

describe('createTabGroupAnnouncements - statusPhrase', () => {
  let i18n: CngxTabsI18n;
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
    expect(statusPhrase(handle)).toBe(i18n.tabHasErrors(1));
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
