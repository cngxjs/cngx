import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-CSS contract for the invalid and busy paint on bare controls. The
// rendered border and cursor are asserted in e2e/css-contract-bare-controls.

const css = readFileSync(resolve(__dirname, 'base.css'), 'utf-8');

function stateRule(state: string): string {
  const start = css.indexOf(`select${state} {`);
  expect(start, `${state} rule not found`).toBeGreaterThan(-1);
  const head = css.lastIndexOf('  input:where(', start);
  return css.slice(head, css.indexOf('}', start) + 1);
}

describe('cngx.base invalid and busy controls', () => {
  const invalid = stateRule(":is([aria-invalid='true'], :user-invalid)");
  const busy = stateRule("[aria-busy='true']");

  it('paints an invalid control border in the danger colour', () => {
    expect(invalid).toContain('border-color: var(--cngx-color-danger');
  });

  // :invalid would paint an empty required field red on load.
  it('keys on the ARIA mark and :user-invalid, never on :invalid', () => {
    expect(invalid).not.toMatch(/[^-]:invalid/);
  });

  it('shows a progress cursor on a busy control', () => {
    expect(busy).toContain('cursor: progress');
  });

  it.each([
    ['invalid', () => invalid],
    ['busy', () => busy],
  ] as const)('covers the text-like inputs, textarea and select when %s', (_, rule) => {
    expect(rule()).toContain("[type='text']");
    expect(rule()).toContain('textarea');
    expect(rule()).toContain('select');
    expect(rule()).not.toContain("[type='checkbox']");
  });

  // Tokens belong to components, not elements: a bare element reads system
  // tokens only.
  it('reads no component token', () => {
    expect(invalid + busy).not.toMatch(/--cngx-(field|input|select)-/);
  });
});
