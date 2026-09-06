import { describe, expect, it } from 'vitest';
import { dateTimeFormatterFor } from './intl-format.util';

describe('dateTimeFormatterFor', () => {
  it('returns the same formatter instance for equal locale + options', () => {
    const a = dateTimeFormatterFor('en-US', { year: 'numeric', month: 'short' });
    const b = dateTimeFormatterFor('en-US', { year: 'numeric', month: 'short' });
    expect(a).toBe(b);
  });

  it('returns distinct formatters per locale and per options', () => {
    const base = dateTimeFormatterFor('en-US', { month: 'short' });
    expect(dateTimeFormatterFor('de-AT', { month: 'short' })).not.toBe(base);
    expect(dateTimeFormatterFor('en-US', { month: 'long' })).not.toBe(base);
  });

  it('formats correctly across more option variants than the cache holds', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const months = ['numeric', '2-digit', 'long', 'short'] as const;
    const days = ['numeric', '2-digit'] as const;
    const years = ['numeric', '2-digit'] as const;
    const eras = [undefined, 'short', 'long'] as const;
    const combo = (i: number): Intl.DateTimeFormatOptions => ({
      month: months[i % 4],
      day: days[Math.floor(i / 4) % 2],
      year: years[Math.floor(i / 8) % 2],
      era: eras[Math.floor(i / 16) % 3],
    });
    // 40 distinct combos overflow the bounded cache; eviction must never
    // change the output, including for evicted-then-recreated entries.
    for (let i = 0; i < 40; i++) {
      expect(dateTimeFormatterFor('en-US', combo(i)).format(date)).toBe(
        new Intl.DateTimeFormat('en-US', combo(i)).format(date),
      );
    }
    expect(dateTimeFormatterFor('en-US', combo(0)).format(date)).toBe(
      new Intl.DateTimeFormat('en-US', combo(0)).format(date),
    );
  });
});
