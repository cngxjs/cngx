import { describe, expect, it } from 'vitest';
import { matchesTypeahead } from './typeahead.util';

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
});
