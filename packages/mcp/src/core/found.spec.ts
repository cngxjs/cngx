import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaultFound } from './found.js';

describe('defaultFound', () => {
  it('counts every payload except null, undefined and an empty array', () => {
    expect(defaultFound({})).toBe(true);
    expect(defaultFound([1])).toBe(true);
    expect(defaultFound('')).toBe(true);
    expect(defaultFound(null)).toBe(false);
    expect(defaultFound(undefined)).toBe(false);
    expect(defaultFound([])).toBe(false);
  });

  // The leaf module exists so the query helpers never depend on the command shape.
  it('is imported by query.ts without an import of command.ts', () => {
    const source = readFileSync(new URL('./query.ts', import.meta.url), 'utf8');

    expect(source).toMatch(/from '\.\/found\.js'/);
    expect(source).not.toMatch(/from '\.\/command\.js'/);
  });
});
