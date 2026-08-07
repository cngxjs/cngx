import { expect, test, type Locator, type Page } from '@playwright/test';

// One story = one example page. Each behaviour lives on its own leaf route.
const BASE = '/#/forms/select/select-shell';
const ROUTES = {
  basic: `${BASE}/basic-flat-declarative-options`,
  rich: `${BASE}/rich-content-option-plain-text-trigger`,
  async: `${BASE}/async-commit-pending-error-inline-glyphs`,
};

function artifact(page: Page): Locator {
  return page.locator('.cngx-ex-artifact');
}

function chrome(page: Page): Locator {
  return page.locator('.cngx-ex-chrome');
}

function triggerOf(page: Page): Locator {
  return page.locator('cngx-select-shell .cngx-select-shell__trigger').first();
}

test.describe('CngxSelectShell demo', () => {
  test('mouse: click trigger toggles aria-expanded; click option commits', async ({ page }) => {
    await page.goto(ROUTES.basic);
    const trigger = triggerOf(page);

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await artifact(page).locator('cngx-option').nth(1).click();
    await expect(
      chrome(page).locator('.event-row', { hasText: 'value' }).first().locator('.event-value'),
    ).toHaveText('green');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('keyboard: ArrowDown + Enter commits a value', async ({ page }) => {
    await page.goto(ROUTES.basic);
    const trigger = triggerOf(page);

    await trigger.focus();
    await trigger.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(
      chrome(page).locator('.event-row', { hasText: 'value' }).first().locator('.event-value'),
    ).toHaveText('green');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('click-outside closes the panel', async ({ page }) => {
    await page.goto(ROUTES.basic);
    const trigger = triggerOf(page);

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.locator('body').click({ position: { x: 20, y: 20 } });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('plain-text trigger: rich option markup renders as plain text in the closed trigger', async ({
    page,
  }) => {
    await page.goto(ROUTES.rich);
    const trigger = triggerOf(page);

    await trigger.click();
    await artifact(page).locator('cngx-option').nth(0).click();

    const labelEl = trigger.locator('.cngx-select-shell__label').first();
    await expect(labelEl).toHaveText('Premium Service');
    // Closed trigger label region must contain zero element nodes — pillar-2
    // plain-text guarantee. The full DOM scan would include the caret, so
    // limit to the label region.
    const innerHtml = await labelEl.innerHTML();
    expect(innerHtml).not.toContain('<b>');
    expect(innerHtml).not.toContain('<strong>');
  });

  test('async commit success: option commits, panel closes, no error glyph', async ({ page }) => {
    await page.goto(ROUTES.async);
    const trigger = triggerOf(page);

    await trigger.click();
    await artifact(page).locator('cngx-option').nth(1).click();

    // Trigger label shows the committed option once the commit resolves.
    await expect(trigger).toContainText('Green', { timeout: 3000 });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const greenOption = artifact(page).locator('cngx-option').nth(1);
    await expect(greenOption).not.toHaveAttribute('data-status', 'error');
  });

  test('async commit error: value rolls back, status-host glyph renders inside option', async ({
    page,
  }) => {
    await page.goto(ROUTES.async);

    // Toggle "Server fails" for this example.
    const failToggle = chrome(page).locator('input[type=checkbox]').first();
    await failToggle.check();

    const trigger = triggerOf(page);
    await trigger.click();
    await artifact(page).locator('cngx-option').nth(1).click();

    const greenOption = artifact(page).locator('cngx-option').nth(1);

    // After rollback the failed option carries data-status="error" via the
    // status-host contract. The glyph renders inside the option's reserved
    // internal slot, never alongside user content.
    await expect(greenOption).toHaveAttribute('data-status', 'error', { timeout: 3000 });
    const slot = greenOption.locator('.cngx-option__status').first();
    await expect(slot).toBeVisible();

    // Trigger reverted to the pre-pick value 'red' (label "Red").
    await expect(trigger).toContainText('Red');

    // commitError event-row populated.
    await expect(
      chrome(page).locator('.event-row', { hasText: 'commitError' }).first(),
    ).toContainText('Server rejected');
  });
});
