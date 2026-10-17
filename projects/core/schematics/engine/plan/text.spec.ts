import { describe, expect, it } from 'vitest';

import { errorMessage, isRecord, joinNames, newlineOf } from './text';

describe('errorMessage', () => {
  it('reads the message of an Error and stringifies anything else', () => {
    expect(errorMessage(new SyntaxError('Unexpected token'))).toBe('Unexpected token');
    expect(errorMessage('plain text')).toBe('plain text');
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage(undefined)).toBe('undefined');
  });
});

describe('isRecord', () => {
  it('accepts plain objects only', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('x')).toBe(false);
  });
});

describe('joinNames', () => {
  it('joins names the way a sentence lists them', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['a'])).toBe('a');
    expect(joinNames(['a', 'b'])).toBe('a and b');
    expect(joinNames(['a', 'b', 'c'])).toBe('a, b and c');
  });
});

describe('newlineOf', () => {
  it('keeps the CRLF line ending of a file that has one, else LF', () => {
    expect(newlineOf('a\r\nb\r\n')).toBe('\r\n');
    expect(newlineOf('a\nb\n')).toBe('\n');
    expect(newlineOf('')).toBe('\n');
  });
});
