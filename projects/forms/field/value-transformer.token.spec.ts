import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  CNGX_VALUE_TRANSFORMER,
  type CngxValueTransformer,
} from './value-transformer.token';

@Injectable()
class NumericTransformer implements CngxValueTransformer<number | null> {
  format(raw: number | null): string {
    return raw === null ? '' : String(raw);
  }
  parse(display: string): number | null {
    return display === '' ? null : Number(display);
  }
}

describe('CNGX_VALUE_TRANSFORMER', () => {
  it('returns null when no provider is wired', () => {
    TestBed.configureTestingModule({});
    const transformer = TestBed.inject(CNGX_VALUE_TRANSFORMER, null, { optional: true });
    expect(transformer).toBeNull();
  });

  it('resolves a transformer class via useExisting and round-trips format/parse', () => {
    TestBed.configureTestingModule({
      providers: [
        NumericTransformer,
        { provide: CNGX_VALUE_TRANSFORMER, useExisting: NumericTransformer },
      ],
    });

    const resolved = TestBed.inject(CNGX_VALUE_TRANSFORMER) as CngxValueTransformer<number | null>;
    expect(resolved).toBeInstanceOf(NumericTransformer);
    expect(resolved.format(42)).toBe('42');
    expect(resolved.format(null)).toBe('');
    expect(resolved.parse('42')).toBe(42);
    expect(resolved.parse('')).toBeNull();
  });
});
