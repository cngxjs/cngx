import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Stories: forms/select/mobile-sheet/*. The breakpoint is a `(pointer:
// coarse)` media query that only an `isMobile + hasTouch` context reports, so
// the phone half runs in such a context; the desktop half proves the anchored
// path is untouched.

const ALL = 'forms/select/mobile-sheet/all-variants';
const PESSIMISTIC = 'forms/select/mobile-sheet/pessimistic-commit';
const OPT_OUT = 'forms/select/mobile-sheet/opt-out';

const VARIANTS: readonly { host: string; fill: 'sheet' | 'fullscreen' }[] = [
  { host: 'cngx-select', fill: 'sheet' },
  { host: 'cngx-multi-select', fill: 'sheet' },
  { host: 'cngx-combobox', fill: 'fullscreen' },
  { host: 'cngx-typeahead', fill: 'fullscreen' },
  { host: 'cngx-tree-select', fill: 'sheet' },
  { host: 'cngx-reorderable-multi-select', fill: 'sheet' },
  { host: 'cngx-action-select', fill: 'fullscreen' },
  { host: 'cngx-action-multi-select', fill: 'fullscreen' },
  { host: 'cngx-select-shell', fill: 'fullscreen' },
];

const panelOf = (host: Locator) => host.locator('.cngx-select__panel');
const triggerOf = (host: Locator) => host.locator('[role="combobox"]').first();

async function openVariant(page: Page, selector: string): Promise<Locator> {
  const host = page.locator(selector).first();
  await triggerOf(host).scrollIntoViewIfNeeded();
  await triggerOf(host).tap();
  await expect(panelOf(host)).toHaveAttribute('aria-modal', 'true');
  return host;
}

async function addProbe(page: Page): Promise<void> {
  // A checkbox pinned near the top of the page: the tap-through check needs
  // an element under the tap point regardless of the demo chrome layout.
  await page.evaluate(() => {
    const probe = document.createElement('input');
    probe.type = 'checkbox';
    probe.className = 'e2e-probe';
    probe.setAttribute('aria-label', 'Probe');
    probe.style.cssText =
      'position: fixed; top: 16px; left: 16px; inline-size: 40px; block-size: 40px; z-index: 1';
    document.body.appendChild(probe);
  });
}

test.describe('select mobile sheet on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(({ browserName }) => {
    test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
  });

  for (const { host: selector, fill } of VARIANTS) {
    test(`${selector} opens as a modal ${fill}, makes the page inert and restores focus`, async ({
      page,
    }) => {
      await gotoDemo(page, ALL);
      const host = await openVariant(page, selector);
      const panel = panelOf(host);
      await expect(panel).toHaveAttribute('data-cngx-presentation', fill);
      await expect(panel).toHaveAttribute('role', 'dialog');
      expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      const radiogroup = page.getByRole('radiogroup', { name: 'Presentation' });
      expect(await radiogroup.evaluate((el) => el.closest('[inert]') !== null)).toBe(true);

      await panel.locator('.cngx-select-sheet-header__close').tap();
      await expect(panel).toBeHidden();
      expect(
        await host.evaluate(
          (el) =>
            el.contains(document.activeElement) &&
            !el.querySelector('.cngx-select__panel')!.contains(document.activeElement),
        ),
      ).toBe(true);
      expect(await radiogroup.evaluate((el) => el.closest('[inert]') !== null)).toBe(false);
    });
  }

  test('a tap above the sheet closes it without reaching the page underneath', async ({ page }) => {
    await gotoDemo(page, ALL);
    await addProbe(page);
    const host = await openVariant(page, 'cngx-select');
    await page.touchscreen.tap(36, 36);
    await expect(panelOf(host)).toBeHidden();
    await expect(page.locator('.e2e-probe')).not.toBeChecked();
  });

  test('a multi pick is spoken from the region inside the sheet', async ({ page }) => {
    await gotoDemo(page, ALL);
    const host = await openVariant(page, 'cngx-multi-select');
    const panel = panelOf(host);
    await panel.getByRole('option', { name: 'Athens' }).tap();
    await expect(panel.locator('[aria-live="polite"]')).toContainText('Athens');
    await expect(panel).toBeVisible();
  });

  test('a pessimistic commit keeps the sheet open on X and outside tap, then closes', async ({
    page,
  }) => {
    await gotoDemo(page, PESSIMISTIC);
    const host = await openVariant(page, 'cngx-select');
    const panel = panelOf(host);
    await panel.getByRole('option', { name: 'Rome' }).tap();
    const close = panel.locator('.cngx-select-sheet-header__close');
    await expect(close).toHaveAttribute('aria-disabled', 'true');
    // Playwright treats aria-disabled as not actionable; the tap itself is the test.
    await close.tap({ force: true });
    await page.touchscreen.tap(36, 36);
    await expect(panel).toBeVisible();
    await expect(panel).toBeHidden({ timeout: 10_000 });
  });

  test('a commit error is spoken assertively from inside the sheet', async ({ page }) => {
    await gotoDemo(page, PESSIMISTIC);
    await page.getByRole('checkbox', { name: 'simulate error' }).check();
    const host = await openVariant(page, 'cngx-select');
    const panel = panelOf(host);
    await panel.getByRole('option', { name: 'Oslo' }).tap();
    await expect(panel.locator('[aria-live="assertive"]')).toContainText('Save failed', {
      timeout: 10_000,
    });
    await expect(panel).toBeVisible();
  });

  test('withMobileSheet("off") keeps the panel anchored on a phone', async ({ page }) => {
    await gotoDemo(page, OPT_OUT);
    const host = page.locator('cngx-select').first();
    await triggerOf(host).tap();
    await expect(panelOf(host)).toHaveAttribute('data-cngx-presentation', 'anchored');
    await expect(panelOf(host)).not.toHaveAttribute('aria-modal', /.*/);
  });
});

test.describe('select mobile sheet on a desktop', () => {
  test('every variant stays anchored', async ({ page }) => {
    await gotoDemo(page, ALL);
    for (const { host: selector } of VARIANTS) {
      const host = page.locator(selector).first();
      await triggerOf(host).click();
      await expect(panelOf(host)).toHaveAttribute('data-cngx-presentation', 'anchored');
      await expect(panelOf(host)).not.toHaveAttribute('role', 'dialog');
      await page.keyboard.press('Escape');
      await expect(panelOf(host)).toBeHidden();
    }
  });
});
