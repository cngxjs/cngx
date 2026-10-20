import { expect, test, type Page } from '@playwright/test';

import { gotoDemo } from '../e2e/_helpers';
import { allRoutes } from '../e2e/_routes';
import { CONSOLE_ALLOWLIST, CONSOLE_ALLOWLIST_CAP } from './console-allowlist';
import {
  formatConsoleLine,
  isWatchedConsoleType,
  matchesAllowRow,
  normaliseConsoleText,
  routeOfUrl,
  type ConsoleLine,
} from './console-lines';

// One fresh load per example route. A console warning, console error, failed
// console.assert or page error fails the route unless an allowlist row names it. Warnings that only
// fire after an interaction are out of reach here; the feature specs own them.

const NETWORK_IDLE_CAP_MS = 5_000;
// Measured probe: late effects (afterNextRender checks, deferred dev warnings)
// land within this window after network idle. A demo timer that fires later
// is out of reach, like an interaction.
const SETTLE_MS = 1_500;

const routes = allRoutes();

async function collectConsoleLines(page: Page, path: string): Promise<ConsoleLine[]> {
  const lines: ConsoleLine[] = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (isWatchedConsoleType(type)) {
      lines.push({ type, text: normaliseConsoleText(msg.text()) });
    }
  });
  page.on('pageerror', (err) => {
    lines.push({ type: 'pageerror', text: normaliseConsoleText(`${err.name}: ${err.message}`) });
  });

  await gotoDemo(page, path);
  // Every generated demo opens with this header and the home page has none, so
  // it is both the ready signal and the proof the route did not fall through
  // the `**` redirect to home.
  await expect(page.locator('header.cngx-ex-intro'), `${path} did not render`).toBeVisible();
  await page
    .waitForLoadState('networkidle', { timeout: NETWORK_IDLE_CAP_MS })
    .catch(() => undefined);
  await page.waitForTimeout(SETTLE_MS);
  expect(routeOfUrl(page.url()), `${path} navigated away while settling`).toBe(path);
  return lines;
}

test.describe('console allowlist', () => {
  test(`holds at most ${CONSOLE_ALLOWLIST_CAP} rows`, () => {
    expect(CONSOLE_ALLOWLIST.length).toBeLessThanOrEqual(CONSOLE_ALLOWLIST_CAP);
  });

  test('names only existing routes and gives every row a prefix and a reason', () => {
    const known = new Set(routes.map((r) => r.path));
    for (const row of CONSOLE_ALLOWLIST) {
      expect(known.has(row.route), `stale allowlist row: unknown route ${row.route}`).toBe(true);
      // An empty prefix would mute every line on the route's channel.
      expect(row.startsWith.trim(), `allowlist row for ${row.route} has no prefix`).not.toBe('');
      expect(row.reason.trim(), `allowlist row for ${row.route} has no reason`).not.toBe('');
    }
  });
});

test.describe('console sweep', () => {
  for (const route of routes) {
    test(route.path, async ({ page }) => {
      const lines = await collectConsoleLines(page, route.path);
      const rows = CONSOLE_ALLOWLIST.filter((row) => row.route === route.path);

      const unlisted = lines.filter((line) => !rows.some((row) => matchesAllowRow(line, row)));
      const stale = rows.filter((row) => !lines.some((line) => matchesAllowRow(line, row)));

      expect(
        unlisted.map(formatConsoleLine),
        `unlisted console lines on ${route.path} (${route.title})`,
      ).toEqual([]);
      expect(
        stale.map((row) => `[${row.type}] ${row.startsWith}`),
        `stale allowlist rows on ${route.path}: the line no longer fires`,
      ).toEqual([]);
    });
  }
});
