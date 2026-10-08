import { afterEach, describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { createLanguageSection, createNestedLanguageSection } from './language-section';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from './provide-i18n';

declare module './language-pack' {
  interface CngxLanguagePack {
    readonly __section?: { readonly title: string; readonly hint: string };
    readonly __nested?: {
      readonly title: string;
      readonly status: { readonly done: string; readonly open: string };
    };
  }
}

const EN = { title: 'Title', hint: 'Hint' };
const injectSpecSection = createLanguageSection('__section', EN);

const read = () => TestBed.runInInjectionContext(() => injectSpecSection());

describe('createLanguageSection', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('reads the English section without a pack', () => {
    expect(read()()).toEqual(EN);
  });

  it('merges the active pack section over English and follows a switch', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const section = read();
    expect(section().title).toBe('Title');

    pack.set({ locale: 'de', __section: { title: 'Titel' } });
    expect(section()).toEqual({ title: 'Titel', hint: 'Hint' });
  });

  it('reads English for a key the pack sets to undefined', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', __section: { title: undefined, hint: 'Tipp' } }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    expect(read()()).toEqual({ title: 'Title', hint: 'Tipp' });
  });

  it('shares one Signal app-wide and keeps it on an equal pack recompute', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>({
      locale: 'de',
      __section: { title: 'Titel' },
    });
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const first = read();
    expect(read()).toBe(first);
    const value = first();
    pack.set({ locale: 'de', __section: { title: 'Titel' } });
    expect(first()).toBe(value);
  });
});

const NESTED_EN = { title: 'Title', status: { done: 'Done', open: 'Open' } };
const injectNestedSection = createNestedLanguageSection('__nested', NESTED_EN, 'status');

const readNested = () => TestBed.runInInjectionContext(() => injectNestedSection());

describe('createNestedLanguageSection', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('reads the English section without a pack', () => {
    expect(readNested()()).toEqual(NESTED_EN);
  });

  it('merges the nested record key by key and follows a switch', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const section = readNested();
    expect(section().status.done).toBe('Done');

    pack.set({ locale: 'de', __nested: { status: { done: 'Erledigt', open: 'Offen' } } });
    expect(section()).toEqual({ title: 'Title', status: { done: 'Erledigt', open: 'Offen' } });
  });

  it('reads English for a nested key the pack leaves unset', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            __nested: {
              title: 'Titel',
              status: { done: undefined, open: 'Offen' } as unknown as {
                done: string;
                open: string;
              },
            },
          }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    expect(readNested()()).toEqual({ title: 'Titel', status: { done: 'Done', open: 'Offen' } });
  });

  it('shares one Signal app-wide and keeps it on an equal pack recompute', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>({
      locale: 'de',
      __nested: { status: { done: 'Erledigt', open: 'Offen' } },
    });
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const first = readNested();
    expect(readNested()).toBe(first);
    const value = first();
    pack.set({ locale: 'de', __nested: { status: { done: 'Erledigt', open: 'Offen' } } });
    expect(first()).toBe(value);
  });

  it('rejects a key whose value is not a record', () => {
    // @ts-expect-error - title is a string, not a nested record
    createNestedLanguageSection('__nested', NESTED_EN, 'title');
  });
});
