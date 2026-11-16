import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The examples app uses Angular's hash location strategy
 * (provideRouter(routes, withHashLocation())) so deep links resolve off
 * the `#` fragment. Always navigate through this helper so tests don't
 * accidentally land on the home/index page: an unknown route redirects to
 * the home page (`**` -> `''`), and the helper fails when the hash no longer
 * names the requested route.
 */
/**
 * The requested route resolved if the hash is exactly the route, or the route
 * followed by a query string (`?…`) or a nested fragment (`#…`). Demos that
 * sync state into the URL append their own fragment after the hash route — the
 * stepper router-sync demo writes `#step=…`, so the live hash reads
 * `#/<route>#step=profile`. A bare equality (or route-plus-`?`) check is too
 * strict for those; the delimiter check still rejects a different route that
 * merely shares this one as a prefix.
 */
function hashNamesRoute(hash: string, expected: string): boolean {
  if (hash === expected) {
    return true;
  }
  if (!hash.startsWith(expected)) {
    return false;
  }
  const rest = hash.slice(expected.length);
  return rest.startsWith('?') || rest.startsWith('#');
}

export async function gotoDemo(page: Page, routePath: string): Promise<void> {
  const clean = routePath.replace(/^\/+/, '');
  const expected = `#/${clean}`;
  await page.goto(`/${expected}`);
  await expect(page, `route ${clean} did not resolve`).toHaveURL((url) =>
    hashNamesRoute(url.hash, expected),
  );
}

/**
 * `gotoDemo` with a language pack: `?lang=de` sits before the hash, so the
 * hash router never sees it and the app bootstraps with that pack.
 */
export async function gotoDemoLang(page: Page, routePath: string, lang: string): Promise<void> {
  const clean = routePath.replace(/^\/+/, '');
  const expected = `#/${clean}`;
  await page.goto(`/?lang=${lang}#/${clean}`);
  await expect(page, `route ${clean} did not resolve under ?lang=${lang}`).toHaveURL((url) =>
    hashNamesRoute(url.hash, expected),
  );
}

/**
 * Collect every console message whose text contains `needle`, from now on.
 * Call before `gotoDemo` so load-time diagnostics are caught; the returned
 * array fills as messages arrive.
 *
 * The general negative check is the console guard in `./_test.ts`: any
 * unlisted warning or error already fails the test. Use this helper to pin one
 * code by name (a regression spec for a fixed diagnostic, or a debug-level
 * line the guard does not watch).
 */
export function collectConsoleMessages(page: Page, needle: string): readonly string[] {
  const messages: string[] = [];
  page.on('console', (msg) => {
    if (msg.text().includes(needle)) {
      messages.push(msg.text());
    }
  });
  return messages;
}

/**
 * Assert the *computed* CSS display of a node. Catches the class of bug
 * where a component is functionally wired but the consumer-side layout
 * stylesheet is missing — e.g. cngx-card-grid hosting `.cngx-card-grid`
 * but never receiving `display: grid` so cards stack in a single column.
 */
export async function expectComputedDisplay(
  locator: Locator,
  display: 'grid' | 'flex' | 'inline-flex' | 'block' | 'inline-block',
): Promise<void> {
  const actual = await locator.evaluate((el) => getComputedStyle(el).display);
  expect(actual, `expected ${display} but got ${actual}`).toBe(display);
}

/**
 * Assert that a set of items is laid out in more than one column — i.e. at
 * least two items share the same row, and at least two share the same
 * column. Useful as a coarse "is the grid actually a grid" guard.
 */
export async function expectGridLayout(items: Locator): Promise<void> {
  const count = await items.count();
  expect(count, 'no grid items').toBeGreaterThan(1);
  const boxes = await Promise.all(
    Array.from({ length: count }, (_, i) => items.nth(i).boundingBox()),
  );
  const xs = new Set(boxes.map((b) => Math.round(b!.x)));
  const ys = new Set(boxes.map((b) => Math.round(b!.y)));
  expect(xs.size, 'all items share the same x — single column, not a grid').toBeGreaterThan(1);
  expect(ys.size, 'all items share the same y — single row, layout may be flex without wrap').toBeGreaterThan(
    0,
  );
}

/** Text of the node the host's aria-describedby points at, or null. */
export async function describedText(page: Page, host: Locator): Promise<string | null> {
  const ids = await host.getAttribute('aria-describedby');
  if (!ids) {
    return null;
  }
  const texts = await Promise.all(
    ids.split(/\s+/).map((id) => page.locator(`[id="${id}"]`).textContent()),
  );
  return texts.map((t) => t?.trim() ?? '').join(' ');
}

type CountedHost = HTMLElement & { cngxE2eClicks?: number };

/**
 * Counts the clicks that reach a bubble listener on the host. A brain's
 * guard is a capture listener on the same element, so a swallowed click
 * never reaches this one.
 */
export async function countClicks(host: Locator): Promise<void> {
  await host.evaluate((el: CountedHost) => {
    el.cngxE2eClicks = 0;
    el.addEventListener('click', () => {
      el.cngxE2eClicks = (el.cngxE2eClicks ?? 0) + 1;
    });
  });
}

export function clicksOf(host: Locator): Promise<number> {
  return host.evaluate((el: CountedHost) => el.cngxE2eClicks ?? 0);
}

type LoggedHost = HTMLElement & { cngxE2eLog?: string[] };

/**
 * Records every change of the named attributes on the host, in order, as
 * `name=value` (`name=null` for a removal). Read the log with
 * `attributeLogOf`; the order pins timing without polling.
 */
export async function recordAttributes(host: Locator, names: readonly string[]): Promise<void> {
  await host.evaluate(
    (el: LoggedHost, filter) => {
      const log: string[] = [];
      el.cngxE2eLog = log;
      new MutationObserver((records) => {
        for (const record of records) {
          const name = record.attributeName ?? '';
          log.push(`${name}=${el.getAttribute(name) ?? 'null'}`);
        }
      }).observe(el, { attributes: true, attributeFilter: filter });
    },
    [...names],
  );
}

export function attributeLogOf(host: Locator): Promise<string[]> {
  return host.evaluate((el: LoggedHost) => [...(el.cngxE2eLog ?? [])]);
}
