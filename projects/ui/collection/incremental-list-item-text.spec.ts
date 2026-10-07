import { describe, expect, it } from 'vitest';

import { itemTextFor } from './incremental-list-item-text';

describe('itemTextFor', () => {
  it('formats a number for the locale', () => {
    expect(itemTextFor(1234.5, 'en')).toBe('1,234.5');
    expect(itemTextFor(1234.5, 'de')).toBe('1.234,5');
  });

  it('formats a date date-only for the locale', () => {
    const date = new Date(2026, 9, 7, 13, 30);
    expect(itemTextFor(date, 'en')).toBe('Oct 7, 2026');
    expect(itemTextFor(date, 'de')).toBe('7. Okt. 2026');
  });

  it('renders an invalid date empty', () => {
    expect(itemTextFor(new Date(Number.NaN), 'en')).toBe('');
  });

  it('passes every other value through', () => {
    const item = { id: 1 };
    expect(itemTextFor('Alpha', 'de')).toBe('Alpha');
    expect(itemTextFor(item, 'de')).toBe(item);
  });
});
