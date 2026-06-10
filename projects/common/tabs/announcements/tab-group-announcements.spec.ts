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

describe('createTabGroupAnnouncements — statusPhrase', () => {
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
