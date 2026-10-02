import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMessage } from './format-message';
import type { CngxPluralMessage } from './language-pack';

const FSI = '⁨';
const PDI = '⁩';

const SIX_FORMS: CngxPluralMessage = {
  zero: 'zero {count}',
  one: 'one {count}',
  two: 'two {count}',
  few: 'few {count}',
  many: 'many {count}',
  other: 'other {count}',
};

describe('formatMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes a brace-free string through unchanged', () => {
    expect(formatMessage('Close dialog', {}, 'en')).toBe('Close dialog');
  });

  it('replaces placeholders in any order', () => {
    expect(
      formatMessage(
        '{label}: step {position} of {count}',
        { count: 4, label: 'Ship', position: 2 },
        'en',
      ),
    ).toBe(`${FSI}Ship${PDI}: step 2 of 4`);
    expect(formatMessage('{b} {a} {b}', { a: 'x', b: 'y' }, 'en')).toBe(
      `${FSI}y${PDI} ${FSI}x${PDI} ${FSI}y${PDI}`,
    );
  });

  it('formats numbers with the locale', () => {
    expect(formatMessage('{count} rows', { count: 1234.5 }, 'en')).toBe('1,234.5 rows');
    expect(formatMessage('{count} Zeilen', { count: 1234.5 }, 'de')).toBe('1.234,5 Zeilen');
  });

  it('picks the English and German plural forms', () => {
    const message: CngxPluralMessage = { one: '{count} error', other: '{count} errors' };
    expect(formatMessage(message, { count: 1 }, 'en')).toBe('1 error');
    expect(formatMessage(message, { count: 0 }, 'en')).toBe('0 errors');
    expect(formatMessage(message, { count: 2 }, 'de')).toBe('2 errors');
  });

  it('picks all six Arabic plural forms', () => {
    const forms = [0, 1, 2, 3, 11, 100].map(
      (count) => formatMessage(SIX_FORMS, { count }, 'ar').split(' ')[0],
    );
    expect(forms).toEqual(['zero', 'one', 'two', 'few', 'many', 'other']);
  });

  it('uses other for a one-form language', () => {
    expect(formatMessage(SIX_FORMS, { count: 1 }, 'zh').split(' ')[0]).toBe('other');
  });

  it('falls back to other when a category is missing', () => {
    expect(formatMessage({ other: '{count} items' }, { count: 1 }, 'en')).toBe('1 items');
  });

  it('isolates a Latin argument inside an Arabic sentence', () => {
    const out = formatMessage('تم حذف {name}', { name: 'Report.pdf' }, 'ar');
    expect(out).toBe(`تم حذف ${FSI}Report.pdf${PDI}`);
  });

  it('calls a function message with the arguments and the locale', () => {
    const fn = vi.fn(
      (args: Readonly<Record<string, string | number>>, locale: string) =>
        `${locale}:${String(args['n'])}`,
    );
    expect(formatMessage(fn, { n: 3 }, 'de')).toBe('de:3');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('keeps an unmatched placeholder visible and warns in dev mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(formatMessage('Hello {name}', {}, 'en')).toBe('Hello {name}');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('warns and uses other when a plural message has no numeric count', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(formatMessage({ one: 'one', other: 'many' }, { count: 'x' }, 'en')).toBe('many');
    expect(warn).toHaveBeenCalledOnce();
  });
});
