import { runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  CNGX_TABS_I18N,
  injectTabsI18n,
  provideTabsI18n,
  withTabsI18nLabels,
} from './tabs-i18n';

describe('CngxTabsI18n', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('library default ships English strings + callbacks', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(i18n.tabsLabel).toBe('Tabs');
    expect(i18n.previousTab).toBe('Previous tab');
    expect(i18n.nextTab).toBe('Next tab');
    expect(i18n.commitFailedRetry).toBe('Tab change refused — retry?');
    expect(i18n.commitInFlight).toBe('Switching tab…');
    expect(i18n.commitRolledBackTo('Profile')).toBe(
      'Could not save changes — reverted to "Profile".',
    );
    expect(i18n.selectedTab('Settings', 2, 5)).toBe('Tab 2 of 5: Settings');
    expect(i18n.tabHasErrors(1)).toBe('1 error');
    expect(i18n.tabHasErrors(3)).toBe('3 errors');
    expect(i18n.moreTabsLabel(4)).toBe('4 more');
  });

  it('provideTabsI18n can override commitRolledBackTo with a localised template', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels({
            commitRolledBackTo: (label) =>
              `Speichern fehlgeschlagen — zurück auf „${label}".`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(i18n.commitRolledBackTo('Einstellungen')).toBe(
      'Speichern fehlgeschlagen — zurück auf „Einstellungen".',
    );
    // Other keys keep their defaults.
    expect(i18n.commitFailedRetry).toBe('Tab change refused — retry?');
  });

  it('provideTabsI18n shallow-merges over the defaults — unset keys keep English', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels({
            tabsLabel: 'Reiter',
            previousTab: 'Vorheriger Reiter',
            nextTab: 'Nächster Reiter',
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(i18n.tabsLabel).toBe('Reiter');
    expect(i18n.previousTab).toBe('Vorheriger Reiter');
    expect(i18n.nextTab).toBe('Nächster Reiter');
    // Unset keys keep their English defaults.
    expect(i18n.commitInFlight).toBe('Switching tab…');
    expect(i18n.tabHasErrors(2)).toBe('2 errors');
  });

  it('provideTabsI18n can override callback keys', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels({
            selectedTab: (label, pos, count) =>
              `Aktiv: ${label} (${pos}/${count})`,
            moreTabsLabel: (n) => `${n} weitere`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(i18n.selectedTab('Profil', 1, 4)).toBe('Aktiv: Profil (1/4)');
    expect(i18n.moreTabsLabel(3)).toBe('3 weitere');
  });

  it('injectTabsI18n returns the resolved bundle in an injection context', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(withTabsI18nLabels({ tabsLabel: 'X' })),
      ],
    });
    const injector = TestBed.inject(EnvironmentInjector);
    const i18n = runInInjectionContext(injector, () => injectTabsI18n());
    expect(i18n.tabsLabel).toBe('X');
  });
});
