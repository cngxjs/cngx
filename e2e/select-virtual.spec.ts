import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/select-virtual';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

function triggerOf(section: Locator): Locator {
  return section
    .locator('cngx-demo-virtual-select cngx-select [role="combobox"]')
    .first();
}

function panelOf(section: Locator): Locator {
  return section.locator('cngx-demo-virtual-select .cngx-select__panel').first();
}

function comboTriggerOf(section: Locator): Locator {
  return section
    .locator('cngx-demo-virtual-combo cngx-combobox [role="combobox"]')
    .first();
}

function comboPanelOf(section: Locator): Locator {
  return section.locator('cngx-demo-virtual-combo .cngx-select__panel').first();
}

test.describe('CngxSelect — virtualized panel', () => {
  test('only a window of option rows is in the DOM for a 10k dataset', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, '10,000 options — CngxSelect');
    const trigger = triggerOf(section);

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = panelOf(section);
    await expect(panel).toBeVisible();
    await expect(panel.locator('.cngx-select__option').first()).toBeVisible();

    const count = await panel.locator('.cngx-select__option').count();
    expect(count).toBeGreaterThan(0);
    // Far below 10000 — rendered window is a small subset.
    expect(count).toBeLessThan(80);
  });

  test('option rows carry aria-setsize = 10000 + valid aria-posinset', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, '10,000 options — CngxSelect');
    const trigger = triggerOf(section);

    await trigger.click();
    const panel = panelOf(section);
    await expect(panel.locator('.cngx-select__option').first()).toBeVisible();

    const first = panel.locator('.cngx-select__option').first();
    await expect(first).toHaveAttribute('aria-setsize', '10000');
    const posinset = await first.getAttribute('aria-posinset');
    expect(posinset).not.toBeNull();
    const posNum = Number(posinset);
    expect(Number.isInteger(posNum)).toBe(true);
    expect(posNum).toBeGreaterThanOrEqual(1);
    expect(posNum).toBeLessThanOrEqual(10000);
  });

  test('scrolling the panel surfaces a different window', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, '10,000 options — CngxSelect');
    const trigger = triggerOf(section);
    await trigger.click();
    const panel = panelOf(section);
    await expect(panel.locator('.cngx-select__option').first()).toBeVisible();

    const firstBefore = await panel.locator('.cngx-select__option').first().textContent();

    // Scroll ~halfway (estimateSize=32 × 5000 = 160000px).
    await panel.evaluate((el: HTMLElement) => {
      el.scrollTop = 160_000;
    });
    await page.waitForTimeout(80);

    const firstAfter = await panel.locator('.cngx-select__option').first().textContent();
    expect(firstAfter).not.toBe(firstBefore);
    expect(firstAfter).toMatch(/Item #0[3-9]\d{3}|Item #1\d{4}/);
  });

  test('CngxCombobox picks up the same withVirtualization() config', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Same wire-up on CngxCombobox');
    const trigger = comboTriggerOf(section);

    await trigger.click();
    const panel = comboPanelOf(section);
    await expect(panel).toBeVisible();
    await expect(panel.locator('.cngx-select__option').first()).toBeVisible();

    const count = await panel.locator('.cngx-select__option').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(80);
    await expect(
      panel.locator('.cngx-select__option').first(),
    ).toHaveAttribute('aria-setsize', '10000');
  });

  test('small-list section still virtualizes (viewport < content)', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Same wrapper with only 20 options');
    const trigger = triggerOf(section);
    await trigger.click();
    const panel = panelOf(section);
    await expect(panel.locator('.cngx-select__option').first()).toBeVisible();

    // The recycler windows to viewport + overscan even when the total
    // is small (20 items × 32 px = 640 px content; 16rem ≈ 256 px
    // panel → ~8 visible + 6 overscan). The aria-setsize still
    // reports the full 20, the window slides on scroll.
    const count = await panel.locator('.cngx-select__option').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(20);
    await expect(
      panel.locator('.cngx-select__option').first(),
    ).toHaveAttribute('aria-setsize', '20');
  });
});
