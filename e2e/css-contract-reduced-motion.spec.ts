import { expect, test, type Page } from '@playwright/test';

// Reduced-motion safety net (core/theming/motion-tokens.css): under reduced
// motion the net freezes every animation, and its essential-motion carve-out
// swaps the freeze for a slow opacity pulse on hosts that are still loading.
// The carve-out must key on a loading host, never on a bare ARIA role: a
// static `role="status"` region (empty state, count line) or a determinate
// progressbar is not "still working", and a pulse there is exactly the motion
// the user asked to drop. jsdom ignores animations, so this runs in a browser.

const PULSE = 'cngx-motion-loading-pulse';

type ReduceVia = 'os' | 'attribute';

const MECHANISMS: readonly ReduceVia[] = ['os', 'attribute'];

async function openReduced(page: Page, route: string, via: ReduceVia): Promise<void> {
  if (via === 'os') {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
  await page.goto(route);
  if (via === 'attribute') {
    await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduced'));
  }
}

function animationName(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
}

for (const via of MECHANISMS) {
  test.describe(`css-contract: reduced-motion pulse (${via})`, () => {
    test('a static role=status host does not pulse', async ({ page }) => {
      await openReduced(page, '/#/ui/empty-state/inside-a-list', via);
      await expect(page.locator('cngx-empty-state').first()).toBeVisible();
      expect(await animationName(page, 'cngx-empty-state')).toBe('none');
    });

    test('a determinate progressbar does not pulse', async ({ page }) => {
      await openReduced(page, '/#/ui/feedback/progress/linear-determinate', via);
      await page.getByRole('button', { name: 'Start Upload' }).click();
      const bar = page.locator('cngx-progress[aria-valuenow]').first();
      await expect(bar).toBeVisible();
      expect(await bar.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    });

    test('an indeterminate progressbar keeps the pulse', async ({ page }) => {
      await openReduced(page, '/#/ui/feedback/progress/linear-indeterminate', via);
      const bar = page.locator('cngx-progress:not([aria-valuenow])').first();
      await expect(bar).toBeVisible();
      expect(await bar.evaluate((el) => getComputedStyle(el).animationName)).toBe(PULSE);
    });

    test('a visible loading indicator keeps the pulse', async ({ page }) => {
      await openReduced(page, '/#/ui/feedback/loading-indicator/spinner-variant', via);
      await page.getByRole('button', { name: 'Start Loading (2s)' }).click();
      const indicator = page.locator('cngx-loading-indicator.cngx-loading-indicator--visible');
      await expect(indicator).toBeVisible();
      expect(await indicator.evaluate((el) => getComputedStyle(el).animationName)).toBe(PULSE);
    });

    test('a pulse duration set on :root reaches the loading host', async ({ page }) => {
      await openReduced(page, '/#/ui/feedback/loading-indicator/spinner-variant', via);
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--cngx-pulse-duration', '4s'),
      );
      await page.getByRole('button', { name: 'Start Loading (2s)' }).click();
      const indicator = page.locator('cngx-loading-indicator.cngx-loading-indicator--visible');
      await expect(indicator).toBeVisible();
      expect(await indicator.evaluate((el) => getComputedStyle(el).animationDuration)).toBe('4s');
    });

    test('a delayed transition starts at 0s', async ({ page }) => {
      await openReduced(page, '/#/ui/empty-state/inside-a-list', via);
      const delay = await page.evaluate(() => {
        const el = document.createElement('div');
        el.style.transition = 'opacity 200ms ease 1s';
        el.style.animationDelay = '1s';
        document.body.append(el);
        const style = getComputedStyle(el);
        return [style.transitionDelay, style.animationDelay];
      });
      expect(delay).toEqual(['0s', '0s']);
    });
  });
}

test('under OS reduce, a smooth root scroll-behavior computes auto', async ({ page }) => {
  await openReduced(page, '/#/ui/empty-state/inside-a-list', 'os');
  const behavior = await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return getComputedStyle(document.documentElement).scrollBehavior;
  });
  expect(behavior).toBe('auto');
});
