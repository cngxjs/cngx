import { describe, expect, it } from 'vitest';
import { foldForMatching, matchesTypeahead } from './typeahead.util';

describe('matchesTypeahead', () => {
  it('matches case-insensitively in both directions', () => {
    expect(matchesTypeahead('Postgres', 'p')).toBe(true);
    expect(matchesTypeahead('postgres', 'PO')).toBe(true);
    expect(matchesTypeahead('POSTGRES', 'post')).toBe(true);
  });

  it('is a prefix match, not a substring match', () => {
    expect(matchesTypeahead('Postgres', 'g')).toBe(false);
    expect(matchesTypeahead('Postgres', 'ostgres')).toBe(false);
  });

  it('empty term matches every label (callers gate on a non-empty buffer)', () => {
    expect(matchesTypeahead('anything', '')).toBe(true);
    expect(matchesTypeahead('', '')).toBe(true);
  });

  it('non-matching and empty labels reject a non-empty term', () => {
    expect(matchesTypeahead('', 'a')).toBe(false);
    expect(matchesTypeahead('Zebra', 'a')).toBe(false);
  });

  it('ignores accents on either side', () => {
    expect(matchesTypeahead('Über', 'u')).toBe(true);
    expect(matchesTypeahead('Uber', 'ü')).toBe(true);
    expect(matchesTypeahead('Éclair', 'ecl')).toBe(true);
    expect(matchesTypeahead('Ålesund', 'A')).toBe(true);
    expect(matchesTypeahead('Ölfass', 'e')).toBe(false);
  });

  it('lowercases with the locale before folding accents', () => {
    expect(matchesTypeahead('İzmir', 'i', 'tr')).toBe(true);
    expect(matchesTypeahead('Istanbul', 'ı', 'tr')).toBe(true);
    expect(matchesTypeahead('Istanbul', 'i', 'tr')).toBe(false);
    expect(matchesTypeahead('Istanbul', 'I', 'tr')).toBe(true);
  });

  it('keeps plain lowercasing without a locale', () => {
    expect(matchesTypeahead('Istanbul', 'i')).toBe(true);
    expect(matchesTypeahead('İzmir', 'i')).toBe(true);
  });
});

describe('foldForMatching', () => {
  it('lowercases with the locale, then drops accents', () => {
    expect(foldForMatching('Über')).toBe('uber');
    expect(foldForMatching('İzmir', 'tr')).toBe('izmir');
    expect(foldForMatching('ISTANBUL', 'tr')).toBe('ıstanbul');
    expect(foldForMatching('Crème Brûlée')).toBe('creme brulee');
  });

  it('folds away bidi isolates and other format characters', () => {
    expect(matchesTypeahead('\u2068Anna\u2069 joined', 'an')).toBe(true);
    expect(matchesTypeahead('a\u200db', 'ab')).toBe(true);
  });
});
