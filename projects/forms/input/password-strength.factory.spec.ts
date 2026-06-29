import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  CNGX_PASSWORD_STRENGTH_FACTORY,
  createPasswordStrength,
  type CngxPasswordStrengthFactory,
} from './password-strength.factory';

describe('createPasswordStrength', () => {
  const estimate = createPasswordStrength();

  it('scores an empty password as 0 / weak', () => {
    expect(estimate('')).toEqual({ score: 0, label: 'weak' });
  });

  it('scores a short single-class password low', () => {
    const result = estimate('abc');
    expect(result.score).toBe(0);
    expect(result.label).toBe('weak');
  });

  it('rewards length and class diversity', () => {
    // 16+ chars (3 length points) + lower/upper/digit/symbol (3 diversity points) -> clamped to 4.
    const result = estimate('Abcdef1!Ghijkl2?');
    expect(result.score).toBe(4);
    expect(result.label).toBe('strong');
  });

  it('lands a mid-length mixed password in the fair/good band', () => {
    const result = estimate('Abcdefg1');
    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.score).toBeLessThanOrEqual(3);
  });

  it('penalises a run of identical characters', () => {
    const plain = estimate('Abcd1234efgh');
    const repeated = estimate('Aaaa1234efgh');
    expect(repeated.score).toBeLessThan(plain.score);
  });

  it('never escapes the 0..4 range', () => {
    const result = estimate('Zx9!Zx9!Zx9!Zx9!Zx9!Zx9!');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(4);
  });
});

describe('CNGX_PASSWORD_STRENGTH_FACTORY', () => {
  it('resolves the dependency-less default without a provider', () => {
    const factory = TestBed.inject(CNGX_PASSWORD_STRENGTH_FACTORY);
    expect(factory('')).toEqual({ score: 0, label: 'weak' });
  });

  it('honours an app-level override', () => {
    const override: CngxPasswordStrengthFactory = () => ({ score: 4, label: 'strong' });
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_PASSWORD_STRENGTH_FACTORY, useValue: override }],
    });
    const factory = TestBed.inject(CNGX_PASSWORD_STRENGTH_FACTORY);
    expect(factory('whatever')).toEqual({ score: 4, label: 'strong' });
  });
});
