import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';

import { injectInputAriaLabels, provideInputConfig, withInputAriaLabels } from '../input-config';
import { CngxPasswordStrength } from '../password-strength.directive';
import { injectInputSectionLabels } from './input-i18n';
import { CNGX_INPUT_LANGUAGE_EN } from './input-language-section';

// Compile-checked: the English section is a complete input section of a pack.
const EN_SECTION: CngxLanguagePack['input'] = CNGX_INPUT_LANGUAGE_EN;

function labels() {
  return TestBed.runInInjectionContext(() => injectInputAriaLabels());
}

describe('input language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English copy from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = labels()();
    expect(en.clear).toBe('Clear');
    expect(en.otpGroup).toBe('One-time code');
    expect(en.otpSlot(0, 6)).toBe('Digit 1 of 6');
    expect(en.otpComplete).toBe('Code complete');
    expect(en.copySuccess).toBe('Copied');
    expect(en.copyError).toBe('Copy failed');
    expect(en.fileDropZone).toBe('File drop zone');
    expect(en.capsLockOn).toBe('Caps Lock is on');
    expect(stripBidiIsolates(en.passwordStrength(en.passwordStrengthLevel('strong')))).toBe(
      'Password strength: strong',
    );
    expect(
      ['weak', 'fair', 'good', 'strong'].map((l) => en.passwordStrengthLevel(l as never)),
    ).toEqual(['weak', 'fair', 'good', 'strong']);
    expect(en.inputRejected).toBe('Character not allowed');
    expect(en.sensitiveReveal).toBe('Value revealed');
    expect(en.sensitiveHide).toBe('Value hidden');
    expect(en.ratingValue(3, 5)).toBe('3 of 5');
    expect(en.ratingValue(2.5, 5)).toBe('2.5 of 5');
    expect(en.ratingItem(3, 5)).toBe('3 of 5');
    expect(en.phoneCountry).toBe('Country');
    expect(stripBidiIsolates(en.phoneCountryOption('+43', 'Austria'))).toBe('+43 Austria');
    expect(en.charCountMax(5, 64)).toBe('5/64');
    expect(en.charCountMin(0, 10)).toBe('0 (min 10)');
    expect(EN_SECTION.phoneCountryOption).toBe('{dialCode} {country}');
  });

  it('reads the input section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const resolved = labels();
    expect(resolved().clear).toBe('Clear');

    pack.set({
      locale: 'de',
      input: {
        clear: 'Leeren',
        passwordStrength: 'Passwortstärke: {level}',
        passwordStrengthLevel: { weak: 'schwach', fair: 'mittel', good: 'gut', strong: 'stark' },
        charCountMax: '{current} von {max}',
        phoneCountryOption: '{country} ({dialCode})',
      },
    });
    const de = resolved();
    expect(de.clear).toBe('Leeren');
    expect(stripBidiIsolates(de.passwordStrength(de.passwordStrengthLevel('good')))).toBe(
      'Passwortstärke: gut',
    );
    expect(de.charCountMax(1200, 5000)).toBe('1.200 von 5.000');
    expect(stripBidiIsolates(de.phoneCountryOption('+43', 'Österreich'))).toBe('Österreich (+43)');
    expect(de.copySuccess).toBe('Copied');
  });

  it('lets withInputAriaLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            input: { clear: 'Leeren', copySuccess: 'Kopiert' },
          }),
          withDocumentLanguage('off'),
        ),
        provideInputConfig(withInputAriaLabels({ clear: 'Zurücksetzen', copyError: undefined })),
      ],
    });
    const resolved = labels()();
    expect(resolved.clear).toBe('Zurücksetzen');
    expect(resolved.copySuccess).toBe('Kopiert');
    expect(resolved.copyError).toBe('Copy failed');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = labels();
    const german = runInSubtree([provideLocaleAt('de')], () => injectInputAriaLabels());
    expect(root().charCountMax(1200, 5000)).toBe('1,200/5,000');
    expect(german().charCountMax(1200, 5000)).toBe('1.200/5.000');
    expect(root().ratingValue(2.5, 5)).toBe('2.5 of 5');
    expect(german().ratingValue(2.5, 5)).toBe('2,5 of 5');
  });

  it('keeps the label reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = labels();
    const second = labels();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
    const site = TestBed.runInInjectionContext(() => injectInputSectionLabels());
    const again = TestBed.runInInjectionContext(() => injectInputSectionLabels());
    expect(Object.is(site, again)).toBe(true);
    expect(Object.is(site(), again())).toBe(true);
  });
});

@Component({
  template: `<input cngxPasswordStrength type="password" />`,
  imports: [CngxPasswordStrength],
})
class StrengthHost {
  readonly directive = viewChild.required(CngxPasswordStrength);
}

describe('password-strength level words', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function announceStrong(): string {
    const announcer = TestBed.inject(CngxLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
    const fixture = TestBed.createComponent(StrengthHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Abcdef1!Ghijkl2?';
    input.dispatchEvent(new Event('input'));
    TestBed.flushEffects();
    vi.advanceTimersByTime(400);
    return stripBidiIsolates(announce.mock.calls.at(-1)?.[0] as string);
  }

  it('announces the level word of the active pack, not the level key', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            input: {
              passwordStrength: 'Passwortstärke: {level}',
              passwordStrengthLevel: {
                weak: 'schwach',
                fair: 'mittel',
                good: 'gut',
                strong: 'stark',
              },
            },
          }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    expect(announceStrong()).toBe('Passwortstärke: stark');
  });

  it('lets withInputAriaLabels map the level key to a word', () => {
    TestBed.configureTestingModule({
      providers: [
        provideInputConfig(
          withInputAriaLabels({ passwordStrengthLevel: (level) => level.toUpperCase() }),
        ),
      ],
    });
    expect(announceStrong()).toBe('Password strength: STRONG');
  });
});
