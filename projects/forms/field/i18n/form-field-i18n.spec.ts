import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { runInSubtree } from '@cngx/testing';

import { mockValidationError } from '../testing/mock-field';
import {
  CNGX_FORM_FIELD_I18N,
  injectFormFieldI18n,
  provideFormFieldI18n,
  resolveErrorMessage,
  withFormFieldI18nLabels,
  type CngxFormFieldI18n,
  type CngxFormFieldI18nOverrides,
} from './form-field-i18n';

function message(i18n: CngxFormFieldI18n, kind: string, extra?: Record<string, unknown>): string {
  return resolveErrorMessage(mockValidationError(kind, undefined, extra), {}, i18n);
}

describe('CngxFormFieldI18n', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English copy from the English section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    expect(message(i18n, 'required')).toBe('This field is required.');
    expect(message(i18n, 'requiredTrue')).toBe('Check this box to continue.');
    expect(message(i18n, 'email')).toBe('Enter a valid email address.');
    expect(message(i18n, 'min', { min: 0 })).toBe('Enter a value of 0 or more.');
    expect(message(i18n, 'max', { max: 2500 })).toBe('Enter a value of 2,500 or less.');
    expect(message(i18n, 'minLength', { minLength: 1 })).toBe('Enter at least 1 character.');
    expect(message(i18n, 'minLength', { minLength: 8 })).toBe('Enter at least 8 characters.');
    expect(message(i18n, 'maxLength', { maxLength: 1 })).toBe('Enter at most 1 character.');
    expect(message(i18n, 'maxLength', { maxLength: 64 })).toBe('Enter at most 64 characters.');
    expect(message(i18n, 'pattern')).toBe('Enter a value in the expected format.');
    expect(message(i18n, 'parse')).toBe('Enter a valid value.');
    expect(message(i18n, 'timeRange')).toBe('Enter a valid time.');
    expect(message(i18n, 'unknownKind')).toBe('This value is invalid.');
    expect(i18n.errorSummaryItem).toBe('{label}: {message}');
  });

  it('reads the generic message when a bounded error carries no bound', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    expect(message(i18n, 'minLength')).toBe('This value is invalid.');
  });

  it('never resolves an inherited object member as a message', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    expect(message(i18n, 'toString')).toBe('This value is invalid.');
  });

  it('resolves registry first, then the error message, then the library message', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    const registry = { required: () => 'From the registry.' };
    expect(resolveErrorMessage(mockValidationError('required', 'Own.'), registry, i18n)).toBe(
      'From the registry.',
    );
    expect(resolveErrorMessage(mockValidationError('pattern', 'Own.'), registry, i18n)).toBe(
      'Own.',
    );
    expect(resolveErrorMessage(mockValidationError('pattern'), registry, i18n)).toBe(
      'Enter a value in the expected format.',
    );
    expect(
      resolveErrorMessage(
        mockValidationError('timeRange'),
        { timeRange: () => 'Use a 24-hour time.' },
        i18n,
      ),
    ).toBe('Use a 24-hour time.');
  });

  it('reads the form-field section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const bundle = TestBed.inject(CNGX_FORM_FIELD_I18N);
    expect(message(bundle(), 'required')).toBe('This field is required.');

    pack.set({
      locale: 'de',
      formField: {
        required: 'Pflichtfeld.',
        timeRange: 'Ungueltige Uhrzeit.',
        maxLength: { one: 'Hoechstens {count} Zeichen.', other: 'Hoechstens {count} Zeichen.' },
        errorSummaryItem: '{label} - {message}',
      },
    });
    expect(message(bundle(), 'required')).toBe('Pflichtfeld.');
    expect(message(bundle(), 'timeRange')).toBe('Ungueltige Uhrzeit.');
    expect(message(bundle(), 'maxLength', { maxLength: 1200 })).toBe('Hoechstens 1.200 Zeichen.');
    expect(bundle().errorSummaryItem).toBe('{label} - {message}');
    expect(message(bundle(), 'email')).toBe('Enter a valid email address.');
  });

  it('lets provideFormFieldI18n override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            formField: { required: 'Pflichtfeld.', email: 'E-Mail?' },
          }),
          withDocumentLanguage('off'),
        ),
        provideFormFieldI18n(
          withFormFieldI18nLabels({
            invalid: 'Ungueltig.',
            errorMessages: { required: () => 'Bitte ausfuellen.' },
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    expect(message(i18n, 'required')).toBe('Bitte ausfuellen.');
    expect(message(i18n, 'email')).toBe('E-Mail?');
    expect(message(i18n, 'unknownKind')).toBe('Ungueltig.');
  });

  it('keeps the bundle reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const bundle = TestBed.inject(CNGX_FORM_FIELD_I18N);
    const first = bundle();
    expect(bundle()).toBe(first);
    const read = TestBed.runInInjectionContext(() => injectFormFieldI18n());
    expect(read()).toBe(first);
  });

  it('formats bounds in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = TestBed.runInInjectionContext(() => injectFormFieldI18n());
    const german = runInSubtree([provideLocaleAt('de')], () => injectFormFieldI18n());
    expect(message(root(), 'max', { max: 2500 })).toBe('Enter a value of 2,500 or less.');
    expect(message(german(), 'max', { max: 2500 })).toBe('Enter a value of 2.500 or less.');
  });

  it('derives the English constraint hints from the English section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    expect(i18n.hintLengthRange(8, 64)).toBe('8–64 characters');
    expect(i18n.hintMinLength(8)).toBe('Min. 8 characters');
    expect(i18n.hintMaxLength(64)).toBe('Max. 64 characters');
    expect(i18n.hintValueRange(18, 99)).toBe('18–99');
    expect(i18n.hintMinValue(0)).toBe('Min. 0');
    expect(i18n.hintMaxValue(100)).toBe('Max. 100');
  });

  it('picks the singular hint form and formats hint numbers for the locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    expect(i18n.hintMinLength(1)).toBe('Min. 1 character');
    expect(i18n.hintMaxLength(1)).toBe('Max. 1 character');
    expect(i18n.hintLengthRange(0, 1)).toBe('0–1 character');
    expect(i18n.hintValueRange(1000, 5000)).toBe('1,000–5,000');
  });

  it('switches the constraint hints with the active pack', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const bundle = TestBed.inject(CNGX_FORM_FIELD_I18N);
    expect(bundle().hintMinValue(1000)).toBe('Min. 1,000');

    pack.set({
      locale: 'de',
      formField: { hintMinValue: 'Mind. {min}', hintLengthRange: '{min} bis {max} Zeichen' },
    });
    expect(bundle().hintMinValue(1000)).toBe('Mind. 1.000');
    expect(bundle().hintLengthRange(8, 64)).toBe('8 bis 64 Zeichen');
    expect(bundle().hintMaxValue(1000)).toBe('Max. 1.000');
  });

  it('leaves the constraint hints to withConstraintHints', () => {
    // @ts-expect-error hints are overridden only through withConstraintHints
    const hint: CngxFormFieldI18nOverrides = { hintMaxValue: (max: number) => `bis ${max}` };
    const invalid: CngxFormFieldI18nOverrides = { invalid: 'Ungueltig.' };
    expect(hint).toBeDefined();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({ locale: 'de', formField: { hintMinValue: 'Mind. {min}' } }),
          withDocumentLanguage('off'),
        ),
        provideFormFieldI18n(withFormFieldI18nLabels(invalid)),
      ],
    });
    const i18n = TestBed.inject(CNGX_FORM_FIELD_I18N)();
    expect(i18n.invalid).toBe('Ungueltig.');
    expect(i18n.hintMinValue(1000)).toBe('Mind. 1.000');
    expect(i18n.hintMaxValue(5)).toBe('Max. 5');
  });

  it('formats constraint hints in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = TestBed.runInInjectionContext(() => injectFormFieldI18n());
    const german = runInSubtree([provideLocaleAt('de')], () => injectFormFieldI18n());
    expect(root().hintValueRange(1000, 5000)).toBe('1,000–5,000');
    expect(german().hintValueRange(1000, 5000)).toBe('1.000–5.000');
  });
});
