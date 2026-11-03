/**
 * Bans fixed sleeps in the Playwright specs.
 *
 * `page.waitForTimeout(n)` passes or fails on machine load instead of on the
 * behaviour under test: too short and CI flakes, too long and the suite
 * crawls. A retrying assertion (`expect(locator).toHaveAttribute(...)`,
 * `expect.poll(...)`) or the fake clock (`page.clock`) states what the test
 * waits for. The root `e2e/` folder is not linted (`eslint.config.js`
 * ignores it), so this guard is the only check.
 *
 * SLEEP_EXEMPT lists the files that still sleep, each with its exact count
 * and the reason. The list only shrinks: a new sleep fails, and so does a
 * removed one until its row is lowered or dropped.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCAN_ROOTS = ['e2e', 'examples/e2e'];

// Every row sits outside the select family this guard was written for; each
// needs its own retrying rewrite in the strand that owns the file.
const SLEEP_EXEMPT = [
  {
    file: 'e2e/forced-colors.spec.ts',
    count: 6,
    reason:
      'waits for the forced-colors repaint after emulateMedia; owned by the select a11y/theming strand, which rewrites this spec',
  },
  {
    file: 'e2e/incremental-list-virtualized.spec.ts',
    count: 2,
    reason: 'waits for the recycler to settle after a scroll; needs an expect.poll rewrite',
  },
  {
    file: 'e2e/mat-tabs.spec.ts',
    count: 1,
    reason: 'proves the error class survives deferred Material change detection (a negative over time)',
  },
  {
    file: 'examples/e2e/common/interactive/long-press.e2e-spec.ts',
    count: 3,
    reason: 'holds and releases the pointer around the long-press threshold; needs page.clock',
  },
  {
    file: 'examples/e2e/common/interactive/click-outside.e2e-spec.ts',
    count: 1,
    reason: 'proves disabled outside clicks do not bump the counter (a negative over time)',
  },
  {
    file: 'examples/e2e/common/menu-button/menu-button.e2e-spec.ts',
    count: 1,
    reason: 'proves the menu stays open after a suppressed toggle key (a negative over time)',
  },
];

function specFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return specFiles(path);
    }
    return /\.(ts|mjs|js)$/.test(name) ? [path] : [];
  });
}

/** Source with line and block comments blanked, so prose about sleeps is ignored. */
const withoutComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

function sleepCounts() {
  const counts = new Map();
  for (const root of SCAN_ROOTS) {
    for (const path of specFiles(join(ROOT, root))) {
      const hits = withoutComments(readFileSync(path, 'utf8')).match(/\bwaitForTimeout\s*\(/g);
      if (hits) {
        counts.set(relative(ROOT, path).split('\\').join('/'), hits.length);
      }
    }
  }
  return counts;
}

describe('e2e specs do not sleep', () => {
  const counts = sleepCounts();

  it('has no waitForTimeout outside the exempt files', () => {
    const exempt = new Set(SLEEP_EXEMPT.map((row) => row.file));
    const offenders = [...counts.keys()].filter((file) => !exempt.has(file));
    expect(offenders, 'replace the sleep with a retrying assertion or page.clock').toEqual([]);
  });

  it.each(SLEEP_EXEMPT)('$file keeps exactly its exempt count', ({ file, count, reason }) => {
    expect(reason.length).toBeGreaterThan(0);
    expect(counts.get(file) ?? 0, 'lower or drop the SLEEP_EXEMPT row').toBe(count);
  });
});
