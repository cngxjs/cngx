import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { formatMessage } from '../format-message';
import {
  CNGX_LANGUAGE_PACK,
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
} from '../provide-i18n';
import { CNGX_LANGUAGE_DE } from './language-de';

/** Every leaf of a value, with its dotted path. */
function leaves(value: unknown, path = ''): [string, unknown][] {
  if (value === null || typeof value !== 'object') {
    return [[path, value]];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, path ? `${path}.${key}` : key),
  );
}

describe('CNGX_LANGUAGE_DE', () => {
  it('is a German pack of plain string data', () => {
    expect(CNGX_LANGUAGE_DE.locale).toBe('de');
    const nonStrings = leaves(CNGX_LANGUAGE_DE).filter(([, value]) => typeof value !== 'string');
    expect(nonStrings).toEqual([]);
  });

  it('carries the time-range error of the form field', () => {
    expect(CNGX_LANGUAGE_DE.formField.timeRange).not.toBe('Enter a valid time.');
  });

  it('picks the German plural form for one and many', () => {
    const message = CNGX_LANGUAGE_DE.treetable.rowsSelected;
    expect(formatMessage(message, { count: 1 }, 'de')).not.toBe(
      formatMessage(message, { count: 2 }, 'de').replace('2', '1'),
    );
  });

  it('is accepted as the active pack', () => {
    const pack = signal(CNGX_LANGUAGE_DE);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    expect(TestBed.inject(CNGX_LANGUAGE_PACK)().locale).toBe('de');
  });
});
