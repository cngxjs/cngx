import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_ID, signal, type EnvironmentProviders, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectDirection } from '@cngx/core';
import {
  CNGX_LANGUAGE_PACK,
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
} from '@cngx/core/i18n';
import {
  CNGX_LOADING_DEFAULTS,
  createVisibilityGate,
  injectLoadingConfig,
  injectLocale,
  provideLoadingConfig,
  provideLocale,
  withMinDwell,
  withShowDelay,
} from '@cngx/core/utils';

import { provideCngxTesting } from './public-api';

function setup(providers: (EnvironmentProviders | Provider)[]) {
  TestBed.configureTestingModule({ providers });
  return {
    config: TestBed.runInInjectionContext(() => injectLoadingConfig()),
    locale: TestBed.runInInjectionContext(() => injectLocale()),
    direction: TestBed.runInInjectionContext(() => injectDirection()),
  };
}

function gateUnderTesting(overrides: EnvironmentProviders[] = []) {
  vi.useFakeTimers();
  const { config } = setup([provideCngxTesting(), ...overrides]);
  const busy = signal(false);
  const visible = TestBed.runInInjectionContext(() =>
    createVisibilityGate(busy, signal(config.showDelay), signal(config.minDwell)),
  );
  TestBed.tick();
  return { busy, visible, config };
}

// One shared document across spec files (isolate: false): restore <html>.
const root = document.documentElement;
let initialLang = '';
let initialDir = '';
beforeEach(() => {
  initialLang = root.lang;
  initialDir = root.dir;
});
afterEach(() => {
  TestBed.resetTestingModule();
  root.lang = initialLang;
  root.dir = initialDir;
});

describe('provideCngxTesting', () => {
  it('zeroes show delay and min dwell and keeps the default cutoff', () => {
    const { config } = setup([provideCngxTesting()]);
    expect(config.showDelay).toBe(0);
    expect(config.minDwell).toBe(0);
    expect(config.spinnerVsSkeletonCutoff).toBe(CNGX_LOADING_DEFAULTS.spinnerVsSkeletonCutoff);
  });

  it.each([
    ['the testing defaults', []],
    [
      'bound show delay and min dwell',
      [provideLoadingConfig(withShowDelay(120), withMinDwell(400))],
    ],
    ['a bound show delay with zero min dwell', [provideLoadingConfig(withShowDelay(120))]],
  ])(
    'shows a gated indicator after a flush and an advance of showDelay + minDwell + 1, then hides it on the settle flush (%s)',
    (_, overrides) => {
      const { busy, visible, config } = gateUnderTesting(overrides);

      busy.set(true);
      TestBed.tick();
      expect(visible()).toBe(false);
      vi.advanceTimersByTime(config.showDelay + config.minDwell + 1);
      expect(visible()).toBe(true);

      busy.set(false);
      TestBed.tick();
      expect(visible()).toBe(false);
    },
  );

  it('keeps the indicator after the settle flush when the clock only advanced by 0', () => {
    const { busy, visible } = gateUnderTesting();

    busy.set(true);
    TestBed.tick();
    vi.advanceTimersByTime(0);
    expect(visible()).toBe(true);

    busy.set(false);
    TestBed.tick();
    expect(visible()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(visible()).toBe(false);
  });

  it('reads the English pack and reports locale en and direction ltr under <html dir="rtl">', () => {
    root.dir = 'rtl';
    const { locale, direction } = setup([provideCngxTesting()]);
    expect(TestBed.inject(CNGX_LANGUAGE_PACK)()).toEqual({ locale: 'en' });
    expect(locale()).toBe('en');
    expect(direction()).toBe('ltr');
  });

  it('outranks LOCALE_ID and yields to a later provideLocale', () => {
    expect(setup([{ provide: LOCALE_ID, useValue: 'de-DE' }, provideCngxTesting()]).locale()).toBe(
      'en',
    );
    TestBed.resetTestingModule();
    expect(setup([provideCngxTesting(), provideLocale('fr-FR')]).locale()).toBe('fr-FR');
  });

  it('leaves <html> untouched after a flush', () => {
    root.lang = 'x-app';
    root.dir = 'rtl';
    // Compared, not asserted absent: another spec's provideMotion may have left it.
    const motion = root.getAttribute('data-motion');
    const { direction } = setup([provideCngxTesting()]);
    TestBed.tick();
    expect([root.lang, root.dir]).toEqual(['x-app', 'rtl']);
    expect(root.getAttribute('data-motion')).toBe(motion);
    expect(direction()).toBe('ltr');
  });

  it('lets a later loading config in the same array win', () => {
    const { config } = setup([provideCngxTesting(), provideLoadingConfig(withShowDelay(200))]);
    expect(config.showDelay).toBe(200);
  });

  it('keeps <html> untouched with the documented pack override', () => {
    root.lang = 'x-app';
    root.dir = 'rtl';
    const { locale, direction } = setup([
      provideCngxTesting(),
      provideCngxI18n(withPartialPack({ locale: 'de' }), withDocumentLanguage('off')),
    ]);
    TestBed.tick();
    expect(locale()).toBe('de');
    expect(direction()).toBe('ltr');
    expect([root.lang, root.dir]).toEqual(['x-app', 'rtl']);
  });

  it("writes <html dir> when a pack override drops withDocumentLanguage('off')", () => {
    const { direction } = setup([
      provideCngxTesting(),
      provideCngxI18n(withPartialPack({ locale: 'ar' })),
    ]);
    TestBed.tick();
    expect(direction()).toBe('rtl');
    expect([root.lang, root.dir]).toEqual(['ar', 'rtl']);
  });
});
