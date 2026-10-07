import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';

import { withSidenavLabels } from '../config/features';
import { provideSidenavConfig } from '../config/provide-sidenav-config';
import { injectSidenavLabels } from './sidenav-i18n';
import { CNGX_SIDENAV_LANGUAGE_EN } from './sidenav-language-section';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['sidenav'] = CNGX_SIDENAV_LANGUAGE_EN;

const labels = () => TestBed.runInInjectionContext(() => injectSidenavLabels());

describe('sidenav language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English labels from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = labels()();
    expect(en.resizeHandle).toBe('Resize navigation');
    expect(stripBidiIsolates(en.resizeValueText(40, '40%'))).toBe('40%');
    expect(EN_SECTION.resizeValueText).toBe('{value}');
  });

  it('reads the section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const resolved = labels();
    expect(resolved().resizeHandle).toBe('Resize navigation');

    pack.set({ locale: 'de', sidenav: { resizeHandle: 'Navigation anpassen' } });
    expect(resolved().resizeHandle).toBe('Navigation anpassen');
    expect(stripBidiIsolates(resolved().resizeValueText(40, '40\u00a0%'))).toBe('40\u00a0%');
  });

  it('lets withSidenavLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            sidenav: { resizeHandle: 'Breite', resizeValueText: '{percent} Prozent' },
          }),
          withDocumentLanguage('off'),
        ),
        provideSidenavConfig(withSidenavLabels({ resizeHandle: 'Navigation anpassen' })),
      ],
    });
    const resolved = labels()();
    expect(resolved.resizeHandle).toBe('Navigation anpassen');
    expect(resolved.resizeValueText(1200, '1.200\u00a0%')).toBe('1.200 Prozent');
  });

  it('formats the {percent} number in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({ locale: 'en', sidenav: { resizeValueText: '{percent} of 1000' } }),
          withDocumentLanguage('off'),
        ),
        provideLocale('en'),
      ],
    });
    const root = labels();
    const german = runInSubtree([provideLocaleAt('de')], () => injectSidenavLabels());
    expect(root().resizeValueText(1000, '')).toBe('1,000 of 1000');
    expect(german().resizeValueText(1000, '')).toBe('1.000 of 1000');
  });

  it('keeps the labels reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = labels();
    const second = labels();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
  });
});
