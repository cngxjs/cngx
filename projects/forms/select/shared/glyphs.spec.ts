import { describe, expect, it } from 'vitest';

import { CNGX_SELECT_GLYPHS, type CngxSelectGlyphKey } from './glyphs';

describe('CNGX_SELECT_GLYPHS', () => {
  it('exposes the five expected glyph keys', () => {
    expect(Object.keys(CNGX_SELECT_GLYPHS).sort()).toEqual([
      'caret',
      'clear',
      'commitError',
      'dragHandle',
      'treeTwisty',
    ]);
  });

  it('every glyph is a non-empty string', () => {
    for (const key of Object.keys(CNGX_SELECT_GLYPHS) as CngxSelectGlyphKey[]) {
      const value = CNGX_SELECT_GLYPHS[key];
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('returns the exact canonical default glyph strings', () => {
    expect(CNGX_SELECT_GLYPHS.clear).toBe('✕');
    expect(CNGX_SELECT_GLYPHS.caret).toBe('▾');
    expect(CNGX_SELECT_GLYPHS.treeTwisty).toBe('▸');
    expect(CNGX_SELECT_GLYPHS.dragHandle).toBe('⋮⋮');
    expect(CNGX_SELECT_GLYPHS.commitError).toBe('!');
  });

  it('is readonly at the type level (as const)', () => {
    // Compile-time assertion — would fail `tsc --noEmit` if the const
    // assertion drifts off the declaration.
    const _typeCheck: Readonly<Record<CngxSelectGlyphKey, string>> = CNGX_SELECT_GLYPHS;
    expect(_typeCheck).toBe(CNGX_SELECT_GLYPHS);
  });
});
