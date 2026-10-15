import { describe, expect, it } from 'vitest';

import { normalizeDashes } from '../normalize-dashes.mjs';

const EM = '\u2014';
const EN = '\u2013';

describe('normalizeDashes', () => {
  it('turns an em or en dash into a spaced hyphen', () => {
    expect(normalizeDashes(`gap${EM}between`)).toBe('gap - between');
    expect(normalizeDashes(`gap ${EN} between`)).toBe('gap - between');
  });

  it('collapses the whitespace around a dash, line breaks included', () => {
    expect(normalizeDashes(`gap  ${EM}\n  between`)).toBe('gap - between');
  });

  it('replaces every dash and leaves a plain hyphen alone', () => {
    expect(normalizeDashes(`a ${EM} b ${EN} c - d`)).toBe('a - b - c - d');
  });
});
