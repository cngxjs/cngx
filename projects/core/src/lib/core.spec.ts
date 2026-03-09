import { describe, it, expect } from 'vitest';
import { CNGX_VERSION } from './core';

describe('CNGX_VERSION', () => {
  it('should be a non-empty string', () => {
    expect(typeof CNGX_VERSION).toBe('string');
    expect(CNGX_VERSION.length).toBeGreaterThan(0);
  });
});
