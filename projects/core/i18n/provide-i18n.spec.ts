import { afterEach, describe, expect, it } from 'vitest';
import { signal, type EnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  CNGX_LANGUAGE_PACK,
  injectLanguageSection,
  provideCngxI18n,
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

function setup(providers: EnvironmentProviders[] = []) {
  TestBed.configureTestingModule({ providers });
  return {
    pack: TestBed.inject(CNGX_LANGUAGE_PACK),
    section: TestBed.runInInjectionContext(() => injectLanguageSection('__spec')),
  };
}

describe('provideCngxI18n', () => {
  afterEach(() => TestBed.resetTestingModule());

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
