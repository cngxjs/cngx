import { beforeEach, describe, expect, it } from 'vitest';
import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';

import {
  CNGX_MENU_BUTTON_I18N,
  injectMenuButtonI18n,
  provideMenuButtonI18n,
  withMenuButtonI18nLabels,
} from './menu-button-i18n';

describe('CNGX_MENU_BUTTON_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('defaults to the English section', () => {
    expect(TestBed.inject(CNGX_MENU_BUTTON_I18N)()).toEqual({ splitToggle: 'More options' });
  });

  it('reads the menu-button section of the active pack and English for the keys it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const bundle = TestBed.inject(CNGX_MENU_BUTTON_I18N);
    expect(bundle().splitToggle).toBe('More options');

    pack.set({ locale: 'de', menuButton: { splitToggle: 'Weitere Optionen' } });
    expect(bundle().splitToggle).toBe('Weitere Optionen');

    pack.set({ locale: 'de', menuButton: { splitToggle: undefined } });
    expect(bundle().splitToggle).toBe('More options');

    pack.set(undefined);
    expect(bundle().splitToggle).toBe('More options');
  });

  it('lets a provideMenuButtonI18n subtree override a key on top of the active pack', () => {
    @Component({
      selector: 'cngx-menu-button-i18n-subtree',
      template: '',
      providers: [provideMenuButtonI18n(withMenuButtonI18nLabels({ splitToggle: 'More actions' }))],
    })
    class Subtree {
      readonly bundle = injectMenuButtonI18n();
    }
    TestBed.configureTestingModule({
      imports: [Subtree],
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', menuButton: { splitToggle: 'Weitere Optionen' } }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    const { bundle } = TestBed.createComponent(Subtree).componentInstance;
    expect(bundle().splitToggle).toBe('More actions');
    expect(TestBed.inject(CNGX_MENU_BUTTON_I18N)().splitToggle).toBe('Weitere Optionen');
  });

  it('follows a Signal override and keeps its reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideMenuButtonI18n(
          withMenuButtonI18nLabels(
            computed(() => (lang() === 'en' ? {} : { splitToggle: 'Weitere Optionen' })),
          ),
        ),
      ],
    });
    const bundle = TestBed.inject(CNGX_MENU_BUTTON_I18N);
    expect(bundle().splitToggle).toBe('More options');

    lang.set('de');
    const german = bundle();
    expect(german.splitToggle).toBe('Weitere Optionen');

    lang.set('de-AT');
    expect(bundle()).toBe(german);
  });
});
