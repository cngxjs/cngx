import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Two workers per shard halved the suite time with no flaky test across two
// full runs; the sweep already runs four and stays as it is.
describe('the Playwright workers on CI', () => {
  it.each(['playwright.config.ts', 'examples/playwright.config.ts'])('runs two workers in %s', (config) => {
    expect(readFileSync(join(ROOT, config), 'utf8')).toContain("workers: process.env['CI'] ? 2 : undefined,");
  });

  it('keeps the console sweep on four workers', () => {
    expect(readFileSync(join(ROOT, 'examples/playwright.console-sweep.config.ts'), 'utf8')).toContain('workers: 4,');
  });

  it('fails a test that passes only on retry in the example suites', () => {
    expect(readFileSync(join(ROOT, 'examples/playwright.config.ts'), 'utf8')).toContain(
      "failOnFlakyTests: !!process.env['CI'],",
    );
  });
});
