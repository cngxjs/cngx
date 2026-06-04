import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/select-shell';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

test.describe('CngxSelectShell demo', () => {
  test('mouse: click trigger toggles aria-expanded; click option commits', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — flat');
    const trigger = section.locator('cngx-select-shell .cngx-select-shell__trigger').first();

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await section.locator('cngx-option').nth(1).click();
    await expect(
      section.locator('.event-row', { hasText: 'value' }).first().locator('.event-value'),
    ).toHaveText('green');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('keyboard: ArrowDown + Enter commits a value', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — flat');
    const trigger = section.locator('cngx-select-shell .cngx-select-shell__trigger').first();

    await trigger.focus();
    await trigger.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(
      section.locator('.event-row', { hasText: 'value' }).first().locator('.event-value'),
    ).toHaveText('green');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('click-outside closes the panel', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — flat');
    const trigger = section.locator('cngx-select-shell .cngx-select-shell__trigger').first();

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.locator('body').click({ position: { x: 20, y: 20 } });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('plain-text trigger: rich option markup renders as plain text in the closed trigger', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Rich-content option');
    const trigger = section.locator('cngx-select-shell .cngx-select-shell__trigger').first();

    await trigger.click();
    await section.locator('cngx-option').nth(0).click();

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
    await page.goto(ROUTE);
    const section = card(page, 'Async commit');
    const trigger = section.locator('cngx-select-shell .cngx-select-shell__trigger').first();

    await trigger.click();
    await section.locator('cngx-option').nth(1).click();

    // Optimistic mode: trigger label shows the intended value during pending,
    // and stays after the commit resolves.
    await expect(trigger).toContainText('Grün', { timeout: 2000 });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const greenOption = section.locator('cngx-option').nth(1);
    await expect(greenOption).not.toHaveAttribute('data-status', 'error');
  });

  test('async commit error: value rolls back, status-host glyph renders inside option', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Async commit');

    // Toggle "Server fails" for this section.
    const failToggle = section.locator('input[type=checkbox]').first();
    await failToggle.check();

    const trigger = section.locator('cngx-select-shell .cngx-select-shell__trigger').first();
    await trigger.click();
    await section.locator('cngx-option').nth(1).click();

    const greenOption = section.locator('cngx-option').nth(1);

    // After rollback the failed option carries data-status="error" via the
    // status-host contract. The glyph renders inside the option's reserved
    // internal slot, never alongside user content.
    await expect(greenOption).toHaveAttribute('data-status', 'error', { timeout: 2000 });
    const slot = greenOption.locator('.cngx-option__status').first();
    await expect(slot).toBeVisible();

    // Trigger reverted to the pre-pick value 'red' (label "Rot").
    await expect(trigger).toContainText('Rot');

    // commitError event-row populated.
    await expect(
      section.locator('.event-row', { hasText: 'commitError' }).first(),
    ).toContainText('Server rejected');
  });
});
