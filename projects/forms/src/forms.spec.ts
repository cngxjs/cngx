import { describe, it, expect } from 'vitest';
import { VERSION } from './forms';

describe('VERSION', () => {
  it('should be a non-empty string', () => {
    expect(typeof VERSION.full).toBe('string');
    expect(VERSION.full.length).toBeGreaterThan(0);
  });
});
