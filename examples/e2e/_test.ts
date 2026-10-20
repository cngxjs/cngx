import { test as base, expect, type Page } from '@playwright/test';

import { CONSOLE_ALLOWLIST } from '../e2e-sweep/console-allowlist';
import {
  formatConsoleLine,
  isSweptConsoleType,
  matchesAllowRow,
  normaliseConsoleText,
  routeOfUrl,
  type ConsoleLine,
} from '../e2e-sweep/console-lines';

export { expect };

interface RoutedConsoleLine extends ConsoleLine {
  /** Route of the page when the line fired; `''` off the hash router. */
  readonly route: string;
}

const isListed = (line: RoutedConsoleLine) =>
  CONSOLE_ALLOWLIST.some((row) => row.route === line.route && matchesAllowRow(line, row));

const DRAIN_CAP_MS = 500;

/**
 * Lets a line the last action scheduled (an afterNextRender check, a deferred
 * effect, a zero-delay timer) reach the console before the guard asserts. One
 * frame plus one task, capped because a background page may never paint.
 * Playwright delivers the console events of that window before the evaluate
 * result, so no fixed settle is needed.
 */
async function drainConsole(page: Page): Promise<void> {
  await page
    .evaluate(
      (capMs) =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => setTimeout(resolve));
          setTimeout(resolve, capMs);
        }),
      DRAIN_CAP_MS,
    )
    // A page the test closed or left mid-navigation has nothing to drain.
    .catch(() => undefined);
}

/**
 * The feature e2e `test`. Every spec imports it instead of the bare
 * `@playwright/test` one (lint-enforced), so each test runs under the console
 * guard: a console warning, console error, failed console.assert or page error
 * fails the test unless a row of the sweep's allowlist names it on the route
 * the page showed when the line fired. This is the interaction half of the
 * console sweep, which only sees what a fresh load logs.
 */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ context }, use) => {
      const lines: RoutedConsoleLine[] = [];
      context.on('console', (msg) => {
        const type = msg.type();
        if (isSweptConsoleType(type)) {
          lines.push({
            type,
            text: normaliseConsoleText(msg.text()),
            route: routeOfUrl(msg.page()?.url() ?? 'about:blank'),
          });
        }
      });
      context.on('weberror', (webError) => {
        const err = webError.error();
        lines.push({
          type: 'pageerror',
          text: normaliseConsoleText(`${err.name}: ${err.message}`),
          route: routeOfUrl(webError.page()?.url() ?? 'about:blank'),
        });
      });

      await use();
      await Promise.all(context.pages().map(drainConsole));

      const unlisted = lines.filter((line) => !isListed(line));
      expect(
        unlisted.map((line) => `${line.route || '(no route)'} ${formatConsoleLine(line)}`),
        'unlisted console lines during the test (allowlist: examples/e2e-sweep/console-allowlist.ts)',
      ).toEqual([]);
    },
    { auto: true },
  ],
});
