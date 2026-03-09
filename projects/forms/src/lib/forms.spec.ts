import { describe, it, expect } from 'vitest';
import { CNGX_FORMS_VERSION } from './forms';

describe('CNGX_FORMS_VERSION', () => {
  it('should be a non-empty string', () => {
    expect(typeof CNGX_FORMS_VERSION).toBe('string');
    expect(CNGX_FORMS_VERSION.length).toBeGreaterThan(0);
  });
});
