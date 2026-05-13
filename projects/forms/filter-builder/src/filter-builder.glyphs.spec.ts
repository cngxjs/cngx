import { describe, expect, it } from 'vitest';

import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';

describe('CNGX_FILTER_BUILDER_GLYPHS', () => {
  it('exposes the five expected glyph keys', () => {
    expect(Object.keys(CNGX_FILTER_BUILDER_GLYPHS).sort()).toEqual([
      'addFilter',
      'addGroup',
      'expand',
      'negate',
      'remove',
    ]);
  });

  it('ships single-character symbol defaults', () => {
    for (const value of Object.values(CNGX_FILTER_BUILDER_GLYPHS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
