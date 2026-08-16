import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_COMMAND_PALETTE_CONFIG,
  injectCommandPaletteConfig,
  provideCommandPaletteConfig,
  withCommandPaletteLabels,
  withKeyboardLegend,
  withPaletteShortcut,
  withResultCountFormatter,
} from './command-palette-config';

function resolve() {
  return TestBed.runInInjectionContext(() => injectCommandPaletteConfig());
}

describe('command palette config cascade', () => {
  it('defaults to the English internal labels and the mod+k open combo', () => {
    TestBed.configureTestingModule({});
    const config = resolve();
    expect(config.searchPlaceholder).toBe('Type a command or search...');
    expect(config.emptyLabel).toBe('No matching commands.');
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
    expect(config.loadingLabel).toBe('Loading commands...');
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

  it('is available on the token with the default factory', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CNGX_COMMAND_PALETTE_CONFIG).listboxLabel).toBe('Commands');
  });
});
