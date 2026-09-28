import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { type CngxSpeak } from '@cngx/common';

import { CngxSpeakButton } from './speak-button';
import {
  CNGX_SPEAK_I18N,
  injectSpeakI18n,
  provideSpeakI18n,
  withSpeakI18nLabels,
  type CngxSpeakI18n,
} from './speak-i18n';

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
});
