import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: a popover disclosure with restoreFocus and closeOnOutsideClick. The
// restore must bring focus back only when the close leaves it nowhere, never
// pull it off a control the user clicked outside the panel.

const ROUTE = 'common/popover/disclosure/link-list';

const opener = (page: Page) => page.getByRole('button', { name: 'Resources' });
const firstLink = (page: Page) => page.getByRole('link', { name: 'Angular overview' });

async function addOutsideProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    const probe = document.createElement('input');
    probe.className = 'e2e-probe';
    probe.setAttribute('aria-label', 'Probe');
    probe.style.cssText = 'position: fixed; top: 16px; right: 16px; inline-size: 120px; z-index: 1';
    document.body.appendChild(probe);
  });
}

test.describe('common/popover/disclosure/link-list', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await expect(opener(page)).toBeVisible();
  });

  test('announces a disclosure, not a menu', async ({ page }) => {
    await expect(opener(page)).not.toHaveAttribute('aria-haspopup');
    await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
    await opener(page).focus();
    await page.keyboard.press('Enter');
    await expect(opener(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(firstLink(page)).toBeVisible();
  });

  test('Escape from a link returns focus to the button', async ({ page }) => {
    await opener(page).focus();
    await page.keyboard.press('Enter');
    await firstLink(page).focus();
    await expect(firstLink(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(opener(page)).toBeFocused();
  });

  test('a click on another control closes the panel and keeps focus there', async ({ page }) => {
    await addOutsideProbe(page);
    await opener(page).focus();
    await page.keyboard.press('Enter');
    await expect(firstLink(page)).toBeVisible();
    const probe = page.locator('.e2e-probe');
    await probe.click();
    await expect(opener(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(probe).toBeFocused();
  });
});
