import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_COMMAND_PALETTE_CONFIG,
  injectCommandPaletteConfig,
  provideCommandPaletteConfig,
  resolveCommandPaletteCopy,
  withCommandPaletteLabels,
  withKeyboardLegend,
  withPaletteShortcut,
  withResultCountFormatter,
} from './command-palette-config';

function resolve() {
  return TestBed.runInInjectionContext(() => resolveCommandPaletteCopy(injectCommandPaletteConfig()))();
}

describe('command palette config cascade', () => {
  it('defaults to the English internal labels and the mod+k open combo', () => {
    TestBed.configureTestingModule({});
    const config = resolve();
    expect(config.searchPlaceholder).toBe('Type a command or search…');
    expect(config.emptyLabel).toBe('No matching commands');
    expect(config.footerLegend.length).toBeGreaterThan(0);
    expect(config.openShortcut).toBe('mod+k');
  });

  it('overrides the open combo via withPaletteShortcut', () => {
    TestBed.configureTestingModule({
      providers: [provideCommandPaletteConfig(withPaletteShortcut('mod+shift+p'))],
    });
    expect(resolve().openShortcut).toBe('mod+shift+p');
  });

  it('overrides only the labels named by withCommandPaletteLabels', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCommandPaletteConfig(
          withCommandPaletteLabels({ emptyLabel: 'Keine Treffer.', retryLabel: 'Erneut' }),
        ),
      ],
    });
    const config = resolve();
    expect(config.emptyLabel).toBe('Keine Treffer.');
    expect(config.retryLabel).toBe('Erneut');
    // Untouched labels keep the default.
    expect(config.loadingLabel).toBe('Loading commands…');
  });

  it('replaces the keyboard legend and count formatter', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCommandPaletteConfig(
          withKeyboardLegend([{ keys: 'enter', label: 'Ausführen' }]),
          withResultCountFormatter((n) => `${n} Treffer`),
        ),
      ],
    });
    const config = resolve();
    expect(config.footerLegend).toEqual([{ keys: 'enter', label: 'Ausführen' }]);
    expect(config.resultCount(3)).toBe('3 Treffer');
  });

  it('is available on the token with the default factory, carrying no copy', () => {
    TestBed.configureTestingModule({});
    const config = TestBed.inject(CNGX_COMMAND_PALETTE_CONFIG);
    expect(config.openShortcut).toBe('mod+k');
    expect(config.listboxLabel).toBeUndefined();
    expect(resolve().listboxLabel).toBe('Commands');
  });

  it('follows a Signal of label overrides and keeps unset labels inherited', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideCommandPaletteConfig(
          withCommandPaletteLabels({ retryLabel: 'Try again' }),
          withCommandPaletteLabels(
            computed(() => (lang() === 'en' ? {} : { emptyLabel: 'Keine Treffer.' })),
          ),
        ),
      ],
    });
    const copy = TestBed.runInInjectionContext(() =>
      resolveCommandPaletteCopy(injectCommandPaletteConfig()),
    );
    expect(copy().emptyLabel).toBe('No matching commands');
    expect(copy().retryLabel).toBe('Try again');

    lang.set('de');
    expect(copy().emptyLabel).toBe('Keine Treffer.');
    expect(copy().retryLabel).toBe('Try again');
  });

  it('keeps the resolved copy reference on an equal recompute', () => {
    const labels = signal<{ emptyLabel?: string }>({});
    TestBed.configureTestingModule({
      providers: [provideCommandPaletteConfig(withCommandPaletteLabels(labels))],
    });
    const copy = TestBed.runInInjectionContext(() =>
      resolveCommandPaletteCopy(injectCommandPaletteConfig()),
    );
    const first = copy();
    labels.set({});
    expect(copy()).toBe(first);
  });

  it('switches the count formatter and the legend through Signals', () => {
    const de = signal(false);
    TestBed.configureTestingModule({
      providers: [
        provideCommandPaletteConfig(
          withResultCountFormatter(
            computed(() => (de() ? (n: number) => `${n} Treffer` : (n: number) => `${n} hits`)),
          ),
          withKeyboardLegend(
            computed(() => [{ keys: 'enter', label: de() ? 'Ausführen' : 'Run' }]),
          ),
        ),
      ],
    });
    const copy = TestBed.runInInjectionContext(() =>
      resolveCommandPaletteCopy(injectCommandPaletteConfig()),
    );
    expect(copy().resultCount(2)).toBe('2 hits');
    de.set(true);
    expect(copy().resultCount(2)).toBe('2 Treffer');
    expect(copy().footerLegend).toEqual([{ keys: 'enter', label: 'Ausführen' }]);
  });
});
