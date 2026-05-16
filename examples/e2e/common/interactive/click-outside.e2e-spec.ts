import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxClickOutside listens to pointerdown on the document and
// emits (clickOutside) when the target is outside its host.

test.describe('common/interactive/click-outside', () => {
  test('dropdown: clicking outside closes; clicking the inner button does not', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/click-outside/dropdown');

    const toggle = page.getByRole('button', { name: /Toggle dropdown/ });
    const status = page.locator('.output-badge');

    await expect(status).toContainText('closed');

    await toggle.click();
    await expect(status).toContainText('open');
    const inner = page.getByRole('button', { name: "Inner button (won't close)" });
    await expect(inner).toBeVisible();

    // Click the inner button — propagation is stopped so the dropdown
    // stays open.
    await inner.click();
    await expect(status).toContainText('open');

    // Click somewhere outside (the body, well away from the dropdown).
    await page.mouse.click(10, 10);
    await expect(status).toContainText('closed');

  });

  test('enabled-toggle: outside clicks bump the counter; disabled stops emissions', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/click-outside/enabled-toggle');

    const badge = page.locator('.output-badge').filter({ hasText: 'Outside clicks' });
    const counter = badge.locator('strong');
    const toggleBtn = page.getByRole('button', { name: /(Disable|Enable) outside detection/ });

    const startCount = parseInt((await counter.textContent()) || '0', 10);

    // While enabled, an outside click must bump the counter.
    await page.mouse.click(10, 10);
    await expect
      .poll(async () => parseInt((await counter.textContent()) || '0', 10))
      .toBeGreaterThan(startCount);

    // Disable the directive (the click on the toggle itself is also outside
    // the host, so it counts before disable takes effect — sample AFTER).
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Enable outside detection');
    const afterDisableCount = parseInt((await counter.textContent()) || '0', 10);

    // Further outside clicks must NOT bump the counter while disabled.
    await page.mouse.click(10, 10);
    await page.mouse.click(20, 20);
    await page.waitForTimeout(150);
    const afterClicksCount = parseInt((await counter.textContent()) || '0', 10);
    expect(afterClicksCount).toBe(afterDisableCount);

  });
});
