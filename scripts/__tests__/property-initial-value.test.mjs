/**
 * Guards every shipped `@property` registration against a var() in its
 * `initial-value`. The spec requires the initial value to be
 * computationally independent; a var() reference there makes the browser
 * drop the WHOLE registration silently, so the token behaves as
 * unregistered while its use-site fallbacks keep the visuals alive - a
 * defect that never surfaces visually (the dot-stepper fill derivations
 * and the paginator selected-row pair shipped exactly this).
 *
 * The intended pattern instead: register the literal end of the chain
 * and place the derivation as a host SET in `@layer cngx.tokens`, so the
 * Material bridges (components layer) and consumer overrides still win.
 *
 * Literal color-mix() and currentColor-bearing initial-values register
 * fine (runtime-verified in Chromium) and stay out of scope here.
 *
 * Scans block-by-block, not line-by-line: `@property` bodies and their
 * initial-value declarations span multiple lines.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function collectStylesheets(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectStylesheets(full, out);
    } else if (/\.(css|scss)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('@property registrations', () => {
  it('carry no var() in any initial-value (registration would be dropped)', () => {
    const offenders = [];
    const roots = [join(ROOT, 'projects'), join(ROOT, 'examples')];
    for (const file of roots.flatMap((r) => collectStylesheets(r))) {
      const src = readFileSync(file, 'utf8');
      // Lax name pattern (anything up to whitespace/brace) so a future
      // SCSS-interpolated name still enters the scan instead of slipping
      // past it; the body match stops at the first closing brace, which
      // every valid descriptor-only @property body satisfies.
      for (const block of src.matchAll(/@property\s+(--[^\s{]+)\s*\{([^}]*)\}/g)) {
        const initial = /initial-value\s*:\s*([^;]+);/s.exec(block[2]);
        if (initial && initial[1].includes('var(')) {
          offenders.push(`${file.slice(ROOT.length + 1)}: ${block[1]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
