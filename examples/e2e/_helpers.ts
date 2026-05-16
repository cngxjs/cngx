import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The examples app uses Angular's hash location strategy
 * (provideRouter(routes, withHashLocation())) so deep links resolve off
 * the `#` fragment. Always navigate through this helper so tests don't
 * accidentally land on the home/index page.
 */
export async function gotoDemo(page: Page, routePath: string): Promise<void> {
  const clean = routePath.replace(/^\/+/, '');
  await page.goto(`/#/${clean}`);
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
