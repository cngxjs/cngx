import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { type CngxSpeak } from '@cngx/common';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';

import { CNGX_SPEAK_LANGUAGE_EN } from './i18n/speak-language-section';

import { CngxSpeakButton } from './speak-button';
import {
  CNGX_SPEAK_I18N,
  injectSpeakI18n,
  provideSpeakI18n,
  withSpeakI18nLabels,
  type CngxSpeakI18n,
} from './speak-i18n';

// Compile-checked: the English section is a complete section of a pack, and
// the token keeps the section's keys.
const EN_SECTION: CngxLanguagePack['speak'] = CNGX_SPEAK_LANGUAGE_EN;
const SAME_SHAPE: CngxSpeakI18n = EN_SECTION;

const idleSpeak = { speaking: () => false, supported: true, toggle: () => undefined };

describe('CNGX_SPEAK_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('ships the English labels without a provider', () => {
    expect(TestBed.inject(CNGX_SPEAK_I18N)()).toEqual({
      readAloud: 'Read aloud',
      stopSpeaking: 'Stop speaking',
    });
  });

  it('flips live through a Signal override and keeps unset keys English', () => {
    const overrides = signal<Partial<CngxSpeakI18n>>({});
    TestBed.configureTestingModule({
      providers: [provideSpeakI18n(withSpeakI18nLabels(overrides))],
    });
    const bundle = TestBed.runInInjectionContext(() => injectSpeakI18n());
    expect(bundle().readAloud).toBe('Read aloud');
    overrides.set({ readAloud: 'Vorlesen' });
    expect(bundle().readAloud).toBe('Vorlesen');
    expect(bundle().stopSpeaking).toBe('Stop speaking');
  });

  it('shares one Signal across readers under one injector', () => {
    TestBed.configureTestingModule({
      providers: [provideSpeakI18n(withSpeakI18nLabels({ readAloud: 'Vorlesen' }))],
    });
    const first = TestBed.runInInjectionContext(() => injectSpeakI18n());
    const second = TestBed.runInInjectionContext(() => injectSpeakI18n());
    expect(first).toBe(second);
  });

  it('defaults the speak button labels from the bundle', () => {
    TestBed.configureTestingModule({
      imports: [CngxSpeakButton],
      providers: [provideSpeakI18n(withSpeakI18nLabels({ readAloud: 'Vorlesen' }))],
    });
    const fixture = TestBed.createComponent(CngxSpeakButton);
    fixture.componentRef.setInput('speakRef', idleSpeak as unknown as CngxSpeak);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Vorlesen');
  });

  it('relabels an unbound speak button on a language switch', () => {
    const overrides = signal<Partial<CngxSpeakI18n>>({});
    TestBed.configureTestingModule({
      imports: [CngxSpeakButton],
      providers: [provideSpeakI18n(withSpeakI18nLabels(overrides))],
    });
    const fixture = TestBed.createComponent(CngxSpeakButton);
    fixture.componentRef.setInput('speakRef', idleSpeak as unknown as CngxSpeak);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Read aloud');

    overrides.set({ readAloud: 'Vorlesen' });
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Vorlesen');
  });

  it('reads the speak section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const bundle = TestBed.runInInjectionContext(() => injectSpeakI18n());
    expect(bundle()).toEqual(SAME_SHAPE);

    pack.set({ locale: 'de', speak: { readAloud: 'Vorlesen' } });
    expect(bundle()).toEqual({ readAloud: 'Vorlesen', stopSpeaking: 'Stop speaking' });
  });

  it('lets withSpeakI18nLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            speak: { readAloud: 'Vorlesen', stopSpeaking: 'Vorlesen beenden' },
          }),
          withDocumentLanguage('off'),
        ),
        provideSpeakI18n(withSpeakI18nLabels({ readAloud: 'Laut lesen' })),
      ],
    });
    const bundle = TestBed.runInInjectionContext(() => injectSpeakI18n());
    expect(bundle()).toEqual({ readAloud: 'Laut lesen', stopSpeaking: 'Vorlesen beenden' });
  });

  it('keeps the bundle reference on an equal pack recompute', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>({
      locale: 'de',
      speak: { readAloud: 'Vorlesen' },
    });
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const bundle = TestBed.runInInjectionContext(() => injectSpeakI18n());
    const first = bundle();
    pack.set({ locale: 'de', speak: { readAloud: 'Vorlesen' } });
    expect(bundle()).toBe(first);
  });

  it('keeps the section label for a key an override sets to undefined', () => {
    const overrides = signal<Partial<CngxSpeakI18n>>({ readAloud: 'Vorlesen' });
    TestBed.configureTestingModule({
      imports: [CngxSpeakButton],
      providers: [provideSpeakI18n(withSpeakI18nLabels(overrides))],
    });
    const fixture = TestBed.createComponent(CngxSpeakButton);
    fixture.componentRef.setInput('speakRef', idleSpeak as unknown as CngxSpeak);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Vorlesen');

    overrides.set({ readAloud: undefined });
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Read aloud');
  });
});
