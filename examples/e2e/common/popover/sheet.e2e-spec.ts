import { expect, test, type Page } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPopoverSheet turns a popover into a modal bottom sheet on a
// coarse, narrow viewport. The breakpoint is a `(pointer: coarse)` media
// query, which only an `isMobile + hasTouch` context reports (CDP cannot
// emulate the pointer feature), so the phone half runs in such a context.

const ROUTE = 'common/popover/sheet/bottom-sheet';

const sheet = (page: Page) => page.locator('.cngx-popover-sheet');
const opener = (page: Page) => page.getByRole('button', { name: 'Choose a city' });

async function addPageProbe(page: Page): Promise<void> {
  // A checkbox pinned near the top of the page and a spacer that makes the
  // page scrollable: the tap-through and scroll-restore checks need both,
  // independent of how the demo chrome lays out at phone width.
  await page.evaluate(() => {
    const probe = document.createElement('input');
    probe.type = 'checkbox';
    probe.className = 'e2e-probe';
    probe.setAttribute('aria-label', 'Probe');
    probe.style.cssText =
      'position: fixed; top: 16px; left: 16px; inline-size: 40px; block-size: 40px; z-index: 1';
    document.body.appendChild(probe);
    const spacer = document.createElement('div');
    spacer.className = 'e2e-spacer';
    spacer.style.blockSize = '3000px';
    document.body.appendChild(spacer);
  });
}

test.describe('common/popover/sheet on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
    await gotoDemo(page, ROUTE);
    await expect(opener(page)).toBeVisible();
  });

  test('auto opens as a modal sheet named by its title only', async ({ page }) => {
    await opener(page).tap();
    await expect(sheet(page)).toHaveAttribute('data-cngx-presentation', 'sheet');
    await expect(sheet(page)).toHaveAttribute('aria-modal', 'true');
    const dialog = page.getByRole('dialog', { name: 'City', exact: true });
    await expect(dialog).toBeVisible();

    // The slide-in runs after the panel settles; poll until it lands.
    await expect
      .poll(async () => {
        const box = await sheet(page).boundingBox();
        return box && [Math.round(box.y + box.height), Math.round(box.width)];
      })
      .toEqual([844, 390]);
  });

  test('fullscreen exposes the same dialog semantics', async ({ page }) => {
    await page.getByRole('radio', { name: 'fullscreen' }).check();
    await opener(page).tap();
    await expect(sheet(page)).toHaveAttribute('data-cngx-presentation', 'fullscreen');
    await expect(page.getByRole('dialog', { name: 'City', exact: true })).toBeVisible();
  });

  test('moves focus in, makes the page inert, and restores both on close', async ({ page }) => {
    await opener(page).tap();
    await expect(sheet(page)).toHaveAttribute('role', 'dialog');

    const focusInside = await sheet(page).evaluate((el) => el.contains(document.activeElement));
    expect(focusInside).toBe(true);
    const radiogroup = page.getByRole('radiogroup', { name: 'Presentation' });
    expect(await radiogroup.evaluate((el) => el.closest('[inert]') !== null)).toBe(true);

    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).tap();
    await expect(sheet(page)).toBeHidden();
    await expect(opener(page)).toBeFocused();
    expect(await radiogroup.evaluate((el) => el.closest('[inert]') !== null)).toBe(false);
  });

  test('a tap above the sheet closes it without reaching the page underneath', async ({
    page,
  }) => {
    await addPageProbe(page);
    await opener(page).tap();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.touchscreen.tap(36, 36);
    await expect(sheet(page)).toBeHidden();
    await expect(page.locator('.e2e-probe')).not.toBeChecked();
    await expect(
      page.locator('.event-row', { hasText: 'last close request' }).locator('.event-value'),
    ).toHaveText('backdrop');
  });

  test('locks and pins the page while open and restores the scroll position', async ({
    page,
  }) => {
    await addPageProbe(page);
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(200);

    await opener(page).evaluate((el: HTMLElement) => el.click());
    await expect(page.getByRole('dialog')).toBeVisible();
    const locked = await page.evaluate(() => ({
      html: getComputedStyle(document.documentElement).overflow,
      position: document.body.style.position,
      top: document.body.style.top,
    }));
    expect(locked).toEqual({ html: 'hidden', position: 'fixed', top: '-200px' });

    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).tap();
    await expect(sheet(page)).toBeHidden();
    expect(await page.evaluate(() => document.body.style.position)).toBe('');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(200);
  });
});

test.describe('common/popover/sheet on a desktop', () => {
  test('auto stays an anchored popover', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await opener(page).click();
    await expect(sheet(page)).toHaveAttribute('data-cngx-presentation', 'anchored');
    await expect(sheet(page)).not.toHaveAttribute('role', 'dialog');
    await expect(sheet(page)).not.toHaveAttribute('aria-modal', /.*/);
    const radiogroup = page.getByRole('radiogroup', { name: 'Presentation' });
    expect(await radiogroup.evaluate((el) => el.closest('[inert]') !== null)).toBe(false);
  });

  // Chromium turns an Escape nobody cancelled into a CloseWatcher close
  // request. The sheet arms a watcher for the Android back gesture, so a
  // real keypress proves Escape stays with CngxPopover's closeOnEscape.
  test.describe('Escape and the close watcher', () => {
    test.beforeEach(async ({ page }) => {
      await gotoDemo(page, ROUTE);
      expect(await page.evaluate(() => 'CloseWatcher' in window)).toBe(true);
      await page.getByRole('radio', { name: 'sheet', exact: true }).check();
    });

    const lastRequest = (page: Page) =>
      page.locator('.event-row', { hasText: 'last close request' }).locator('.event-value');

    test('Escape closes once through closeOnEscape, not as a back gesture', async ({ page }) => {
      await opener(page).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(sheet(page)).toBeHidden();
      await expect(lastRequest(page)).toHaveText('none');
      await expect(opener(page)).toBeFocused();
    });

    test('closeOnEscape=false keeps the sheet open on Escape', async ({ page }) => {
      await page.getByRole('checkbox', { name: 'Escape closes' }).uncheck();
      await opener(page).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(lastRequest(page)).toHaveText('none');
    });
  });
});
