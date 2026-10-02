import { computed, runInInjectionContext, EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { stripBidiIsolates } from '@cngx/testing';

import {
  CNGX_TABS_I18N,
  injectTabsI18n,
  provideTabsI18n,
  withTabsI18nLabels,
  type CngxTabsI18n,
} from './tabs-i18n';

describe('CngxTabsI18n', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the pre-section English copy from the English section', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N)();
    const plain = stripBidiIsolates;
    expect(i18n.tabsLabel).toBe('Tabs');
    expect(plain(i18n.previousTab('Tab 1 of 3: A'))).toBe('Previous tab: Tab 1 of 3: A');
    expect(plain(i18n.nextTab('Tab 3 of 3: C'))).toBe('Next tab: Tab 3 of 3: C');
    expect(i18n.commitFailedRetry).toBe('Tab change refused - retry?');
    expect(i18n.commitInFlight).toBe('Switching tab…');
    expect(plain(i18n.commitRolledBackTo('Profile'))).toBe(
      'Could not save changes - reverted to "Profile".',
    );
    expect(plain(i18n.selectedTab('Settings', 2, 5))).toBe('Tab 2 of 5: Settings');
    expect(plain(i18n.tabLabelWithDetail('Bookmarks', '45'))).toBe('Bookmarks, 45');
    expect(i18n.tabHasErrors(1)).toBe('1 error');
    expect(i18n.tabHasErrors(3)).toBe('3 errors');
    expect(i18n.moreTabsLabel(4)).toBe('4 more');
    expect(plain(i18n.closeTab('Profile'))).toBe('Close "Profile"');
    expect(i18n.addTab).toBe('Add tab');
    expect(plain(i18n.closedTab('Profile'))).toBe('Closed "Profile"');
    expect(i18n.closedTab('')).toBe('Tab closed');
    expect(i18n.unlabeledTab(3)).toBe('Tab 3');
  });

  it('reads the tabs section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const bundle = TestBed.inject(CNGX_TABS_I18N);
    expect(bundle().addTab).toBe('Add tab');

    pack.set({
      locale: 'de',
      tabs: {
        addTab: 'Neuer Reiter',
        moreTabsLabel: '{count} weitere',
        unlabeledTab: 'Reiter {position}',
      },
    });
    expect(bundle().addTab).toBe('Neuer Reiter');
    expect(bundle().moreTabsLabel(1200)).toBe('1.200 weitere');
    expect(bundle().unlabeledTab(2)).toBe('Reiter 2');
    expect(bundle().commitInFlight).toBe('Switching tab…');
  });

  it('lets provideTabsI18n override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            tabs: { addTab: 'Neuer Reiter', tabsLabel: 'Reiter' },
          }),
          withDocumentLanguage('off'),
        ),
        provideTabsI18n(withTabsI18nLabels({ tabsLabel: 'Bereiche' })),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N)();
    expect(i18n.tabsLabel).toBe('Bereiche');
    expect(i18n.addTab).toBe('Neuer Reiter');
  });

  it('provideTabsI18n can override commitRolledBackTo with a localised template', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels({
            commitRolledBackTo: (label) =>
              `Speichern fehlgeschlagen - zurück auf „${label}".`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N)();
    expect(i18n.commitRolledBackTo('Einstellungen')).toBe(
      'Speichern fehlgeschlagen - zurück auf „Einstellungen".',
    );
    // Other keys keep their defaults.
    expect(i18n.commitFailedRetry).toBe('Tab change refused - retry?');
  });

  it('provideTabsI18n shallow-merges over the defaults - unset keys keep English', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels({
            tabsLabel: 'Reiter',
            previousTab: (phrase) => `Vorheriger Reiter: ${phrase}`,
            nextTab: (phrase) => `${phrase} (weiter)`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N)();
    expect(i18n.tabsLabel).toBe('Reiter');
    expect(i18n.previousTab('Reiter 1')).toBe('Vorheriger Reiter: Reiter 1');
    expect(i18n.nextTab('Reiter 2')).toBe('Reiter 2 (weiter)');
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
    const i18n = TestBed.inject(CNGX_TABS_I18N)();
    expect(i18n.selectedTab('Profil', 1, 4)).toBe('Aktiv: Profil (1/4)');
    expect(i18n.moreTabsLabel(3)).toBe('3 weitere');
  });

  it('provideTabsI18n can override tabLabelWithDetail with a localised fold', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(
          withTabsI18nLabels({
            tabLabelWithDetail: (label, detail) => `${label} (${detail})`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N)();
    expect(i18n.tabLabelWithDetail('Bookmarks', '45')).toBe('Bookmarks (45)');
    // Unset keys keep their English defaults.
    expect(stripBidiIsolates(i18n.selectedTab('Settings', 2, 5))).toBe('Tab 2 of 5: Settings');
  });

  it('injectTabsI18n returns the resolved bundle in an injection context', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(withTabsI18nLabels({ tabsLabel: 'X' })),
      ],
    });
    const injector = TestBed.inject(EnvironmentInjector);
    const i18n = runInInjectionContext(injector, () => injectTabsI18n())();
    expect(i18n.tabsLabel).toBe('X');
  });

  describe('runtime language switch', () => {
    it('a Signal override flips every label without a re-inject', () => {
      const lang = signal<'en' | 'de'>('en');
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsI18n(
            withTabsI18nLabels(
              computed<Partial<CngxTabsI18n>>(() =>
                lang() === 'de' ? { tabsLabel: 'Reiter', moreTabsLabel: (n) => `${n} weitere` } : {},
              ),
            ),
          ),
        ],
      });
      const i18n = TestBed.inject(CNGX_TABS_I18N);
      expect(i18n().tabsLabel).toBe('Tabs');

      lang.set('de');
      expect(i18n().tabsLabel).toBe('Reiter');
      expect(i18n().moreTabsLabel(2)).toBe('2 weitere');
      expect(i18n().addTab).toBe('Add tab');
    });

    it('keeps the bundle reference when an override is re-set to an equal object', () => {
      const overrides = signal<Partial<CngxTabsI18n>>({ tabsLabel: 'Reiter' });
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideTabsI18n(withTabsI18nLabels(overrides))],
      });
      const i18n = TestBed.inject(CNGX_TABS_I18N);
      const before = i18n();
      overrides.set({ tabsLabel: 'Reiter' });
      expect(i18n()).toBe(before);
    });

    it('resolves static overrides to the same bundle as the eager merge', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const defaults = TestBed.inject(CNGX_TABS_I18N)();
      TestBed.resetTestingModule();

      const first: Partial<CngxTabsI18n> = { tabsLabel: 'Reiter', addTab: 'Neu' };
      const second: Partial<CngxTabsI18n> = { tabsLabel: 'Bereiche', addTab: 'Weiter' };
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsI18n(withTabsI18nLabels(first), withTabsI18nLabels(second)),
        ],
      });
      const merged = TestBed.inject(CNGX_TABS_I18N)();
      expect(merged.tabsLabel).toBe('Bereiche');
      expect(merged.addTab).toBe('Weiter');
      expect(merged.commitInFlight).toBe(defaults.commitInFlight);
    });
  });
});
