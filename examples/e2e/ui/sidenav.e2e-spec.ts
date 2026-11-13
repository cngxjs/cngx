import type { Page } from '@playwright/test';

import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Story: CngxSidenav (Material-themed) renders a navigation sidebar.

interface Frame {
  readonly width: number;
  readonly contentStart: number;
  readonly rows: readonly number[];
}

// Samples the sidenav width, the content's inline start and the y of every
// top-level row on each animation frame until stop() is called.
async function startSampling(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[]; __sampling: boolean };
    w.__frames = [];
    w.__sampling = true;
    const nav = document.querySelector('cngx-sidenav')!;
    const content = document.querySelector('cngx-sidenav-content')!;
    const rows = [
      ...nav.querySelectorAll(
        ':is(.cngx-nav-link, .cngx-nav-group, .cngx-nav-label):not(.cngx-nav-group-content *)',
      ),
    ];
    const tick = () => {
      w.__frames.push({
        width: nav.getBoundingClientRect().width,
        contentStart: content.getBoundingClientRect().left,
        rows: rows.map((row) => row.getBoundingClientRect().top),
      });
      if (w.__sampling) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

async function stopSampling(page: Page): Promise<Frame[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[]; __sampling: boolean };
    w.__sampling = false;
    return w.__frames;
  });
}

const spread = (values: readonly number[]): number => Math.max(...values) - Math.min(...values);

function expectRowsStill(frames: readonly Frame[]): void {
  expect(frames.length).toBeGreaterThan(5);
  frames[0].rows.forEach((_, i) => {
    expect(spread(frames.map((frame) => frame.rows[i])), `row ${i} y`).toBeLessThanOrEqual(0.5);
  });
}

const between = (frames: readonly Frame[], low: number, high: number): number =>
  frames.filter((frame) => frame.width > low + 1 && frame.width < high - 1).length;

test.describe('ui/sidenav', () => {
  for (const { name, path } of routesUnder('ui', 'sidenav')) {
    test(`${name}: renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }

  test('the collapsed rail header shows the brand mark and keeps the name in the AX tree', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/sidenav/config-hover-dwell');
    const nav = page.locator('cngx-sidenav', { hasText: 'Config' }).first();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    const header = nav.locator('cngx-nav-header');
    const mark = header.locator('.demo-sidenav__brand-mark');
    const name = header.locator('.demo-sidenav__brand-name');

    await expect(mark).toBeVisible();
    await expect(mark).toHaveText('C');
    // The name leaves the flow with the sr-only clip, so it paints nothing.
    const box = await name.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(1);
    expect(box?.height ?? 0).toBeLessThanOrEqual(1);
    // The mark is aria-hidden; the clipped name still reaches the AX tree.
    await expect(header).toMatchAriaSnapshot('- text: Config');
  });

  test('full-navigation-sidebar: the rail footer shows the version inside the rail', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoDemo(page, 'ui/sidenav/full-navigation-sidebar');
    const nav = page.locator('cngx-sidenav').first();
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.mouse.move(1500, 850);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');

    const footer = nav.locator('cngx-nav-footer');
    // The visible text fits the rail, so the footer does not clip it.
    const fits = await footer.evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(fits).toBe(true);
    const nameBox = await footer.locator('.demo-sidenav__footer-name').boundingBox();
    expect(nameBox?.width ?? 0).toBeLessThanOrEqual(1);
    await expect(footer).toMatchAriaSnapshot('- text: Workspace v2.1');
  });

  test('full-navigation-sidebar: a rail row is as tall as the expanded row', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoDemo(page, 'ui/sidenav/full-navigation-sidebar');
    const nav = page.locator('cngx-sidenav').first();
    const row = nav.locator('a.cngx-nav-link').first();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'expanded');
    const expanded = (await row.boundingBox())?.height ?? 0;

    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.mouse.move(1500, 850);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    const rail = (await row.boundingBox())?.height ?? 0;

    expect(expanded).toBeGreaterThan(0);
    expect(Math.abs(rail - expanded)).toBeLessThanOrEqual(0.5);
  });

  test('full-navigation-sidebar: toggling and peeking animate the width and move no row', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoDemo(page, 'ui/sidenav/full-navigation-sidebar');
    const nav = page.locator('cngx-sidenav').first();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'expanded');
    const expandedWidth = (await nav.boundingBox())?.width ?? 0;

    // Toggle to the rail: the width animates, no row changes its y.
    await startSampling(page);
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.mouse.move(1500, 850);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    await page.waitForTimeout(600);
    const toRail = await stopSampling(page);
    const railWidth = toRail[toRail.length - 1].width;
    expectRowsStill(toRail);
    expect(between(toRail, railWidth, expandedWidth)).toBeGreaterThan(0);

    // Peek: the width animates over the content, which keeps its inline start.
    const box = (await nav.boundingBox())!;
    await startSampling(page);
    await page.mouse.move(box.x + box.width / 2, box.y + 150);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'peek');
    await page.waitForTimeout(600);
    await page.mouse.move(1500, 850);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    await page.waitForTimeout(600);
    const peek = await stopSampling(page);
    expectRowsStill(peek);
    expect(spread(peek.map((frame) => frame.contentStart))).toBeLessThanOrEqual(0.5);
    expect(between(peek, railWidth, expandedWidth)).toBeGreaterThan(0);
  });

  test('full-navigation-sidebar: under reduced motion the state switches without intermediate frames', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoDemo(page, 'ui/sidenav/full-navigation-sidebar');
    const nav = page.locator('cngx-sidenav').first();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'expanded');
    const expandedWidth = (await nav.boundingBox())?.width ?? 0;

    await startSampling(page);
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.mouse.move(1500, 850);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    await page.waitForTimeout(400);
    const frames = await stopSampling(page);
    const railWidth = frames[frames.length - 1].width;
    expect(railWidth).toBeLessThan(expandedWidth);
    expect(between(frames, railWidth, expandedWidth)).toBe(0);
  });
});
