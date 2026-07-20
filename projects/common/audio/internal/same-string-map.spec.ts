import { describe, expect, it } from 'vitest';
import { sameStringMap } from './same-string-map';

describe('sameStringMap', () => {
  it('is true for two maps with identical entries', () => {
    const a = new Map([['click', 'tap'], ['focus', 'notification']]);
    const b = new Map([['click', 'tap'], ['focus', 'notification']]);
    expect(sameStringMap(a, b)).toBe(true);
  });

  it('is false when a size differs', () => {
    const a = new Map([['click', 'tap']]);
    const b = new Map([['click', 'tap'], ['focus', 'notification']]);
    expect(sameStringMap(a, b)).toBe(false);
  });

  it('is false when a value differs for the same key', () => {
    const a = new Map([['click', 'tap']]);
    const b = new Map([['click', 'success']]);
    expect(sameStringMap(a, b)).toBe(false);
  });

  it('is true for two empty maps', () => {
    expect(sameStringMap(new Map(), new Map())).toBe(true);
  });
});
