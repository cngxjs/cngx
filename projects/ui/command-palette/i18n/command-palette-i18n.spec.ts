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

import {
  injectCommandPaletteConfig,
  provideCommandPaletteConfig,
  resolveCommandPaletteCopy,
  withCommandPaletteLabels,
} from '../config/command-palette-config';
import { CNGX_COMMAND_PALETTE_LANGUAGE_EN } from './command-palette-language-section';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['commandPalette'] = CNGX_COMMAND_PALETTE_LANGUAGE_EN;

function copy() {
  return TestBed.runInInjectionContext(() =>
    resolveCommandPaletteCopy(injectCommandPaletteConfig()),
  );
}

describe('command-palette language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English copy from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = copy()();
    expect(en.searchPlaceholder).toBe('Type a command or search...');
    expect(en.listboxLabel).toBe('Commands');
    expect(en.emptyLabel).toBe('No matching commands.');
    expect(en.loadingLabel).toBe('Loading commands...');
    expect(en.errorLabel).toBe('Could not load commands.');
    expect(en.retryLabel).toBe('Retry');
    expect(en.paletteLabel).toBe('Command palette');
    expect(en.resultCount(1)).toBe('1 result');
    expect(en.resultCount(3)).toBe('3 results');
    expect(en.footerLegend).toEqual([
      { keys: 'up down', label: 'Navigate' },
      { keys: 'enter', label: 'Run' },
      { keys: 'esc', label: 'Close' },
    ]);
    expect(stripBidiIsolates(en.legendEntry('enter', 'Run'))).toBe('enter Run');
    expect(EN_SECTION.legendEntry).toBe('{keys} {label}');
  });

  it('reads the section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const resolved = copy();
    expect(resolved().listboxLabel).toBe('Commands');

    pack.set({
      locale: 'de',
      commandPalette: {
        listboxLabel: 'Befehle',
        resultCount: { one: '{count} Treffer', other: '{count} Treffer' },
        runLabel: 'Ausführen',
        legendEntry: '{label}: {keys}',
      },
    });
    const de = resolved();
    expect(de.listboxLabel).toBe('Befehle');
    expect(de.resultCount(1200)).toBe('1.200 Treffer');
    expect(de.footerLegend[1]).toEqual({ keys: 'enter', label: 'Ausführen' });
    expect(stripBidiIsolates(de.legendEntry('enter', 'Ausführen'))).toBe('Ausführen: enter');
    expect(de.emptyLabel).toBe('No matching commands.');
  });

  it('lets withCommandPaletteLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            commandPalette: { listboxLabel: 'Befehle', emptyLabel: 'Keine Befehle.' },
          }),
          withDocumentLanguage('off'),
        ),
        provideCommandPaletteConfig(withCommandPaletteLabels({ listboxLabel: 'Aktionen' })),
      ],
    });
    const resolved = copy()();
    expect(resolved.listboxLabel).toBe('Aktionen');
    expect(resolved.emptyLabel).toBe('Keine Befehle.');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = copy();
    const german = runInSubtree([provideLocaleAt('de')], () =>
      resolveCommandPaletteCopy(injectCommandPaletteConfig()),
    );
    expect(root().resultCount(1200)).toBe('1,200 results');
    expect(german().resultCount(1200)).toBe('1.200 results');
  });

  it('keeps the copy reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = copy();
    const second = copy();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
  });
});
