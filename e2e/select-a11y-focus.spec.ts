import { expect, test, type Locator, type Page } from '@playwright/test';

const R = {
  signalForms: '/#/forms/select/single-select/signal-forms-required',
};

function ex(page: Page): Locator {
  return page.locator('main');
}

// The close restore runs in a microtask after the panel flips shut; two frames
// later any stray restore has landed on the trigger.
async function settledActiveText(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const active = document.activeElement;
            resolve(active === document.body ? 'body' : (active?.textContent ?? '').trim());
          }),
        ),
      ),
  );
}

test.describe('select family focus on leave', () => {
  test('Tab out of an open select lands on the next control in one press', async ({ page }) => {
    await page.goto(R.signalForms);
    const section = ex(page);
    const trigger = section.locator('cngx-select .cngx-select__trigger').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Tab');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(await settledActiveText(page)).toBe('Submit');
  });

  test('a click into another control keeps focus there', async ({ page }) => {
    await page.goto(R.signalForms);
    const section = ex(page);
    const trigger = section.locator('cngx-select .cngx-select__trigger').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await section.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(await settledActiveText(page)).toBe('Submit');
  });
});
