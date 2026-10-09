import { expect, test, type Page } from '@playwright/test';

const ROUTE = '/#/forms/input/numeric/reactive-forms';

async function nextFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
}

test.describe('numeric input commits per keystroke', () => {
  test('Enter right after typing submits the typed value', async ({ page }) => {
    await page.goto(ROUTE);
    const input = page.locator('input[cngxNumericInput]').first();

    await input.focus();
    await nextFrame(page);
    await page.keyboard.type('1234,5');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('amount-submitted')).toHaveText('Submitted: 1234.5');
    await expect(input).toBeFocused();
  });

  test('the control follows the typing before blur, the text is not rewritten', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const input = page.locator('input[cngxNumericInput]').first();

    await input.focus();
    await nextFrame(page);
    await page.keyboard.type('1234,5');

    await expect(page.getByTestId('amount-value')).toHaveText('Control value: 1234.5');
    await expect(input).toHaveValue('1234,5');
    await expect(input).toBeFocused();
  });

  test('a short value stays as typed while focused and formats on blur', async ({ page }) => {
    await page.goto(ROUTE);
    const input = page.locator('input[cngxNumericInput]').first();

    await input.focus();
    await nextFrame(page);
    await page.keyboard.type('5');

    await expect(page.getByTestId('amount-value')).toHaveText('Control value: 5');
    await expect(input).toHaveValue('5');

    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('5,00');
  });
});
