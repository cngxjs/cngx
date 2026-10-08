import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  CNGX_LANGUAGE_PACK,
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
} from '../provide-i18n';
import { CNGX_LANGUAGE_EN } from './language-en';

/** Every leaf of a value, with its dotted path. */
function leaves(value: unknown, path = ''): [string, unknown][] {
  if (value === null || typeof value !== 'object') {
    return [[path, value]];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, path ? `${path}.${key}` : key),
  );
}

describe('CNGX_LANGUAGE_EN', () => {
  it('is an English pack of plain string data', () => {
    expect(CNGX_LANGUAGE_EN.locale).toBe('en');
    const nonStrings = leaves(CNGX_LANGUAGE_EN).filter(([, value]) => typeof value !== 'string');
    expect(nonStrings).toEqual([]);
  });

  it('carries the time-range error of the form field', () => {
    expect(CNGX_LANGUAGE_EN.formField.timeRange).toBe('Enter a valid time.');
  });

  it('is accepted as the active pack', () => {
    const pack = signal(CNGX_LANGUAGE_EN);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    expect(TestBed.inject(CNGX_LANGUAGE_PACK)().locale).toBe('en');
  });
});
