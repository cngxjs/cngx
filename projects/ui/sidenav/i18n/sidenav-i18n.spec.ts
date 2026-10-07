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
import { runInSubtree } from '@cngx/testing';

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
    expect(en.resizeValueText(280)).toBe('280 pixels');
    expect(EN_SECTION.resizeValueText).toBe('{width} pixels');
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
    expect(resolved().resizeValueText(1200)).toBe('1.200 pixels');
  });

  it('lets withSidenavLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            sidenav: { resizeHandle: 'Breite', resizeValueText: '{width} Pixel' },
          }),
          withDocumentLanguage('off'),
        ),
        provideSidenavConfig(withSidenavLabels({ resizeHandle: 'Navigation anpassen' })),
      ],
    });
    const resolved = labels()();
    expect(resolved.resizeHandle).toBe('Navigation anpassen');
    expect(resolved.resizeValueText(300)).toBe('300 Pixel');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = labels();
    const german = runInSubtree([provideLocaleAt('de')], () => injectSidenavLabels());
    expect(root().resizeValueText(1200)).toBe('1,200 pixels');
    expect(german().resizeValueText(1200)).toBe('1.200 pixels');
  });

  it('keeps the labels reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = labels();
    const second = labels();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
  });
});
