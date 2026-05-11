import { describe, it, expect } from 'vitest';
import '@angular/compiler';
import { FormControl } from '@angular/forms';
import { patternMatch } from './pattern-match.validator';

describe('patternMatch', () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validator = patternMatch(emailPattern);

  it('returns null for a matching value', () => {
    const control = new FormControl('user@example.com');
    expect(validator(control)).toBeNull();
  });

  it('returns an error for a non-matching value', () => {
    const control = new FormControl('not-an-email');
    expect(validator(control)).toEqual({
      patternMatch: {
        pattern: emailPattern.source,
        actual: 'not-an-email',
      },
    });
  });

  it('returns null for empty / falsy values (delegate to required)', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
  });
});
