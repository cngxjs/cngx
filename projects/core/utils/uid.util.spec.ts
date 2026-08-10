import { describe, it, expect } from 'vitest';
import { nextUid } from './uid.util';

function suffix(id: string): number {
  return Number.parseInt(id.slice(id.lastIndexOf('-') + 1), 10);
}

describe('nextUid', () => {
  it('returns the prefix followed by a numeric suffix', () => {
    const id = nextUid('dialog');
    expect(id).toMatch(/^dialog-\d+$/);
  });

  it('increases strictly on each call for the same prefix', () => {
    const first = suffix(nextUid('popover'));
    const second = suffix(nextUid('popover'));
    expect(second).toBeGreaterThan(first);
  });

  it('shares one module counter across distinct prefixes', () => {
    const a = suffix(nextUid('a'));
    const b = suffix(nextUid('b'));
    // Monotonic (not absolute) so the assertion is order-independent across specs.
    expect(b).toBeGreaterThan(a);
  });
});
