import { describe, it, expect } from 'vitest';
import { CNGX_UI_VERSION } from './ui';

describe('CNGX_UI_VERSION', () => {
  it('should be a non-empty string', () => {
    expect(typeof CNGX_UI_VERSION).toBe('string');
    expect(CNGX_UI_VERSION.length).toBeGreaterThan(0);
  });
});
