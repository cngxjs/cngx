import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_ID, signal, type EnvironmentProviders, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectDirection, provideDirection } from '@cngx/core';
import { injectLocale } from '@cngx/core/utils';

import {
  CNGX_LANGUAGE_PACK,
  injectLanguageSection,
  provideCngxI18n,
  withDocumentLanguage,
  withPack,
  withPartialPack,
  type CngxCompleteLanguagePack,
} from './provide-i18n';

// Optional on purpose: a required section here would join every pack typed
// in the core spec program.
declare module './language-pack' {
  interface CngxLanguagePack {
    readonly __spec?: { readonly title: string; readonly close: string };
  }
}

const EN_SECTION = { title: 'Title', close: 'Close' };
const DE: CngxCompleteLanguagePack = {
  locale: 'de',
  __spec: { title: 'Titel', close: 'Schließen' },
};
const FR: CngxCompleteLanguagePack = { locale: 'fr', __spec: { title: 'Titre', close: 'Fermer' } };

const AR: CngxCompleteLanguagePack = { locale: 'ar', __spec: { title: 'عنوان', close: 'إغلاق' } };

function setup(providers: (EnvironmentProviders | Provider)[] = []) {
  TestBed.configureTestingModule({ providers });
  return {
    pack: TestBed.inject(CNGX_LANGUAGE_PACK),
    section: TestBed.runInInjectionContext(() => injectLanguageSection('__spec')),
    locale: TestBed.runInInjectionContext(() => injectLocale()),
    direction: TestBed.runInInjectionContext(() => injectDirection()),
  };
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

describe('provideCngxI18n', () => {
  it('reads English without a provider', () => {
    const { pack, section } = setup();
    expect(pack()).toEqual({ locale: 'en' });
    expect(section()).toBeUndefined();
  });

  it('reads a plain pack', () => {
    const { pack, section } = setup([provideCngxI18n(withPack(DE))]);
    expect(pack().locale).toBe('de');
    expect(section()).toBe(DE.__spec);
  });

  it('switches the section when the pack Signal flips', () => {
    const active = signal<CngxCompleteLanguagePack | undefined>(DE);
    const { section } = setup([provideCngxI18n(withPack(active))]);
    expect(section()?.title).toBe('Titel');

    active.set(FR);
    expect(section()?.title).toBe('Titre');
  });

  it('reads English while the pack Signal is undefined', () => {
    const active = signal<CngxCompleteLanguagePack | undefined>(undefined);
    const { pack, section } = setup([provideCngxI18n(withPack(active))]);
    expect(pack()).toEqual({ locale: 'en' });
    expect(section()).toBeUndefined();

    active.set(DE);
    expect(section()).toBe(DE.__spec);
  });

  it('accepts a partial pack through withPartialPack', () => {
    const { section } = setup([
      provideCngxI18n(withPartialPack({ locale: 'de', __spec: { title: 'Titel' } })),
    ]);
    expect(section()).toEqual({ title: 'Titel' });
  });

  it('lets the last pack feature win', () => {
    const { section } = setup([provideCngxI18n(withPack(DE), withPack(FR))]);
    expect(section()?.title).toBe('Titre');
  });

  it('keeps the section reference when the pack changes but the section does not', () => {
    const active = signal<CngxCompleteLanguagePack | undefined>(DE);
    const { section } = setup([provideCngxI18n(withPack(active))]);
    const first = section();

    active.set({ ...DE, locale: 'de-CH' });
    expect(Object.is(section(), first)).toBe(true);
  });

  it('types a complete pack for withPack and a partial one for withPartialPack', () => {
    withPack({ locale: 'de', __spec: EN_SECTION });
    // @ts-expect-error -- withPack rejects a section with a missing key
    withPack({ locale: 'de', __spec: { title: 'Titel' } });
    // @ts-expect-error -- every pack names its locale
    withPack({ __spec: EN_SECTION });
    withPartialPack({ locale: 'de', __spec: { title: 'Titel' } });
    withPartialPack({ locale: 'de' });
    expect(true).toBe(true);
  });
});

describe('provideCngxI18n locale and direction', () => {
  it('flips locale, direction and copy in the same pass', () => {
    const active = signal<CngxCompleteLanguagePack | undefined>(DE);
    const { section, locale, direction } = setup([provideCngxI18n(withPack(active))]);
    expect([locale(), direction(), section()?.close]).toEqual(['de', 'ltr', 'Schließen']);

    active.set(AR);
    expect([locale(), direction(), section()?.close]).toEqual(['ar', 'rtl', 'إغلاق']);
  });

  it('reads English, ltr while the pack is undefined', () => {
    const { locale, direction } = setup([provideCngxI18n(withPack(signal(undefined)))]);
    expect([locale(), direction()]).toEqual(['en', 'ltr']);
  });

  it('lets an explicit pack dir win over the derived one', () => {
    const { direction } = setup([provideCngxI18n(withPack({ ...DE, dir: 'rtl' }))]);
    expect(direction()).toBe('rtl');
  });

  it('drives the locale from a regional spread', () => {
    const { locale, direction } = setup([provideCngxI18n(withPack({ ...DE, locale: 'de-CH' }))]);
    expect([locale(), direction()]).toEqual(['de-CH', 'ltr']);
  });

  it('derives rtl for other right-to-left scripts', () => {
    const active = signal<CngxCompleteLanguagePack | undefined>({ ...DE, locale: 'he-IL' });
    const { direction } = setup([provideCngxI18n(withPack(active))]);
    expect(direction()).toBe('rtl');
    active.set({ ...DE, locale: 'fa' });
    expect(direction()).toBe('rtl');
    active.set({ ...DE, locale: 'not a tag' });
    expect(direction()).toBe('ltr');
  });

  it('writes <html lang> and <html dir> and follows a switch', () => {
    const active = signal<CngxCompleteLanguagePack | undefined>(DE);
    setup([provideCngxI18n(withPack(active))]);
    TestBed.tick();
    expect([root.lang, root.dir]).toEqual(['de', 'ltr']);

    active.set(AR);
    TestBed.tick();
    expect([root.lang, root.dir]).toEqual(['ar', 'rtl']);

    active.set(undefined);
    TestBed.tick();
    expect([root.lang, root.dir]).toEqual(['en', 'ltr']);
  });

  it('writes the attributes and reports rtl on the server platform', () => {
    const { direction } = setup([
      { provide: PLATFORM_ID, useValue: 'server' },
      provideCngxI18n(withPack(AR)),
    ]);
    expect(direction()).toBe('rtl');
    TestBed.tick();
    expect([root.lang, root.dir]).toEqual(['ar', 'rtl']);
  });

  it("leaves the DOM alone and reads dir from it with withDocumentLanguage('off')", () => {
    root.lang = 'x-app';
    root.dir = 'rtl';
    const { locale, direction } = setup([
      provideCngxI18n(withPack(DE), withDocumentLanguage('off')),
    ]);
    TestBed.tick();
    expect([root.lang, root.dir]).toEqual(['x-app', 'rtl']);
    expect(direction()).toBe('rtl');
    expect(locale()).toBe('de');
  });

  it('lets a later provideDirection win while <html dir> follows the pack', () => {
    const { direction } = setup([provideCngxI18n(withPack(AR)), provideDirection('ltr')]);
    TestBed.tick();
    expect(direction()).toBe('ltr');
    expect(root.dir).toBe('rtl');
  });
});
