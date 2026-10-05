import { afterEach, describe, expect, it } from 'vitest';
import {
  Component,
  computed,
  inject,
  InjectionToken,
  signal,
  type Provider,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';

import { formatMessage } from './format-message';
import type { CngxPluralMessage } from './language-pack';
import {
  CNGX_LANGUAGE_PACK,
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from './provide-i18n';
import { createSectionBundle } from './section-bundle';

declare module './language-pack' {
  interface CngxLanguagePack {
    readonly __bundle?: { readonly title: string; readonly items: CngxPluralMessage };
  }
}

interface SpecSection {
  readonly title: string;
  readonly items: CngxPluralMessage;
}

interface SpecBundle {
  readonly title: string;
  readonly items: (count: number) => string;
}

const EN: SpecSection = { title: 'Title', items: { one: '{count} item', other: '{count} items' } };

const bundle = createSectionBundle<SpecSection, SpecBundle>({
  section: () => {
    const pack = inject(CNGX_LANGUAGE_PACK);
    return computed(() => ({ ...EN, ...pack().__bundle }), {
      equal: (a, b) => a.title === b.title && a.items === b.items,
    });
  },
  toBundle: (section, locale) => ({
    title: section.title,
    items: (count) => formatMessage(section.items, { count }, locale),
  }),
});

const SPEC_I18N = new InjectionToken<Signal<SpecBundle>>('SpecI18n', {
  providedIn: 'root',
  factory: () => bundle.build(),
});

function provideSpecI18n(...features: ((b: Signal<SpecBundle>) => Signal<SpecBundle>)[]): Provider {
  return { provide: SPEC_I18N, useFactory: () => bundle.build(features) };
}

const injectSpecI18n = (): Signal<SpecBundle> => bundle.resolve(inject(SPEC_I18N));

@Component({
  selector: 'cngx-spec-german-subtree',
  template: '',
  providers: [provideLocaleAt('de')],
})
class GermanSubtree {
  readonly i18n = injectSpecI18n();
}

afterEach(() => TestBed.resetTestingModule());

describe('createSectionBundle', () => {
  it('formats numbers and plurals in the locale of the reading subtree', () => {
    TestBed.configureTestingModule({ imports: [GermanSubtree], providers: [provideLocale('en')] });
    const root = TestBed.runInInjectionContext(injectSpecI18n);
    const german = TestBed.createComponent(GermanSubtree).componentInstance.i18n;
    expect(root().items(1200)).toBe('1,200 items');
    expect(german().items(1200)).toBe('1.200 items');
    expect(german().items(1)).toBe('1 item');
  });

  it('returns the identical bundle for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideLocale('en')] });
    const first = TestBed.runInInjectionContext(injectSpecI18n);
    const second = TestBed.runInInjectionContext(injectSpecI18n);
    expect(first).toBe(second);
    expect(Object.is(first(), second())).toBe(true);
    expect(Object.is(first(), TestBed.inject(SPEC_I18N)())).toBe(true);
  });

  it('builds a new bundle when the pack section changes, and keeps it for an equal one', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const i18n = TestBed.runInInjectionContext(injectSpecI18n);
    const english = i18n();
    pack.set({ locale: 'en', __bundle: { title: 'Titel' } });
    const german = i18n();
    expect(german).not.toBe(english);
    expect(german.title).toBe('Titel');
    pack.set({ locale: 'en', __bundle: { title: 'Titel' } });
    expect(i18n()).toBe(german);
  });

  it('keeps a key a feature set and lets the rest follow the subtree locale', () => {
    @Component({
      selector: 'cngx-spec-featured-subtree',
      template: '',
      providers: [provideLocaleAt('de')],
    })
    class FeaturedSubtree {
      readonly i18n = injectSpecI18n();
    }
    TestBed.configureTestingModule({
      imports: [FeaturedSubtree],
      providers: [
        provideLocale('en'),
        provideSpecI18n((b) => computed(() => ({ ...b(), title: 'Overridden' }))),
      ],
    });
    const i18n = TestBed.createComponent(FeaturedSubtree).componentInstance.i18n;
    expect(i18n().title).toBe('Overridden');
    expect(i18n().items(1200)).toBe('1.200 items');
  });

  it('keeps a token value built elsewhere and fills only the keys it leaves out', () => {
    const complete: SpecBundle = { title: 'Own', items: () => 'own' };
    const partial = { title: 'Own' } as SpecBundle;
    const value = signal<SpecBundle>(complete);
    TestBed.configureTestingModule({
      providers: [provideLocale('en'), { provide: SPEC_I18N, useValue: value }],
    });
    const i18n = TestBed.runInInjectionContext(injectSpecI18n);
    expect(i18n()).toBe(complete);
    value.set(partial);
    expect(i18n().title).toBe('Own');
    expect(i18n().items(2)).toBe('2 items');
  });
});
