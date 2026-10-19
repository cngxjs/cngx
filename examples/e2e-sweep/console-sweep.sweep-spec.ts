import { expect, test, type Page } from '@playwright/test';

import { gotoDemo } from '../e2e/_helpers';
import { allRoutes } from '../e2e/_routes';
import { CONSOLE_ALLOWLIST, CONSOLE_ALLOWLIST_CAP } from './console-allowlist';

// One fresh load per example route. A console warning, console error or page
// error fails the route unless an allowlist row names it. Warnings that only
// fire after an interaction are out of reach here; the feature specs own them.

const NETWORK_IDLE_CAP_MS = 5_000;
// Measured probe: late effects (afterNextRender checks, deferred dev warnings)
// land within this window after network idle.
const SETTLE_MS = 1_500;

const routes = allRoutes();

/**
 * First line only, without the trailing `Find more at <url>` and whatever
 * context arguments follow it (`JSHandle@node` for a logged element).
 */
function normalise(text: string): string {
  const firstLine = text.split('\n', 1)[0] ?? '';
  return firstLine.replace(/\s*Find more at \S+.*$/, '').trim();
}

async function collectConsoleLines(page: Page, path: string): Promise<string[]> {
  const lines: string[] = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'warning' || type === 'error') {
      lines.push(`[${type}] ${normalise(msg.text())}`);
    }
  });
  page.on('pageerror', (err) => {
    lines.push(`[pageerror] ${normalise(`${err.name}: ${err.message}`)}`);
  });

  await gotoDemo(page, path);
  await page
    .waitForLoadState('networkidle', { timeout: NETWORK_IDLE_CAP_MS })
    .catch(() => undefined);
  await page.waitForTimeout(SETTLE_MS);
  return lines;
}

test.describe('console allowlist', () => {
  test(`holds at most ${CONSOLE_ALLOWLIST_CAP} rows`, () => {
    expect(CONSOLE_ALLOWLIST.length).toBeLessThanOrEqual(CONSOLE_ALLOWLIST_CAP);
  });

  test('names only existing routes and gives every row a reason', () => {
    const known = new Set(routes.map((r) => r.path));
    for (const row of CONSOLE_ALLOWLIST) {
      expect(known.has(row.route), `stale allowlist row: unknown route ${row.route}`).toBe(true);
      expect(row.reason.trim(), `allowlist row for ${row.route} has no reason`).not.toBe('');
    }
  });
});

test.describe('console sweep', () => {
  for (const route of routes) {
    test(route.path, async ({ page }) => {
      const lines = await collectConsoleLines(page, route.path);
      const rows = CONSOLE_ALLOWLIST.filter((row) => row.route === route.path);
      const matches = (line: string, startsWith: string) =>
        line.replace(/^\[\w+\] /, '').startsWith(startsWith);

      const unlisted = lines.filter((line) => !rows.some((row) => matches(line, row.startsWith)));
      const stale = rows.filter((row) => !lines.some((line) => matches(line, row.startsWith)));

      expect(unlisted, `unlisted console lines on ${route.path} (${route.title})`).toEqual([]);
      expect(
        stale.map((row) => row.startsWith),
        `stale allowlist rows on ${route.path}: the line no longer fires`,
      ).toEqual([]);
    });
  }
});
