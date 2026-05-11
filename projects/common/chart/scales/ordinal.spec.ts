import { describe, expect, it } from 'vitest';
import { createOrdinalScale } from './ordinal';

describe('createOrdinalScale', () => {
  it('maps each domain value to the palette entry at its index', () => {
    const scale = createOrdinalScale(['a', 'b', 'c'], ['#1', '#2', '#3']);
    expect(scale('a')).toBe('#1');
    expect(scale('b')).toBe('#2');
    expect(scale('c')).toBe('#3');
  });

  it('cycles the palette when the domain is longer than the palette', () => {
    const scale = createOrdinalScale(['a', 'b', 'c', 'd'], ['#1', '#2']);
    expect(scale('a')).toBe('#1');
    expect(scale('b')).toBe('#2');
    expect(scale('c')).toBe('#1');
    expect(scale('d')).toBe('#2');
  });

  it('falls back to the first palette entry for unknown domain values', () => {
    const scale = createOrdinalScale(['a'], ['#1', '#2']);
    expect(scale('unknown')).toBe('#1');
  });

  it('throws synchronously when the palette is empty', () => {
    expect(() => createOrdinalScale(['a'], [])).toThrow(/palette must not be empty/);
  });
});
