import { expect, test, type Page } from '@playwright/test';

const COMBOBOX = 'input[role=combobox]:not(.cngx-select-sheet-header__input)';

/**
 * Types `text` and sends `keys` as one burst from inside the page, so no
 * render runs between them: the first navigation key settles the debounced
 * term and every later key joins its deferral.
 */
async function burst(page: Page, text: string, keys: readonly string[]): Promise<void> {
  await page.evaluate(
    ([selector, term, sequence]) => {
      const input = document.querySelector<HTMLInputElement>(selector as string);
      if (!input) {
        throw new Error(`no ${selector as string}`);
      }
      input.value = term as string;
      input.dispatchEvent(
        new InputEvent('input', { bubbles: true, data: term as string, inputType: 'insertText' }),
      );
      for (const key of sequence as string[]) {
        input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      }
    },
    [COMBOBOX, text, keys] as const,
  );
}

test.describe('a deferred Enter on an action host commits only the highlighted option', () => {
  test('action-multi-select: e, ArrowDown, ArrowDown, Enter adds exactly one value', async ({
    page,
  }) => {
    await page.goto('/#/forms/select/action-multi-select/basic');
    const input = page.locator(COMBOBOX).first();
    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const values = page.locator('.event-value').first();
    await expect(values).toHaveText('design');

    await burst(page, 'e', ['ArrowDown', 'ArrowDown', 'Enter']);

    await expect(values).toHaveText('design, development');
    await page.waitForTimeout(600);
    await expect(values).toHaveText('design, development');
  });

  test('action-select: d, ArrowDown, ArrowDown, Enter picks the option and creates nothing', async ({
    page,
  }) => {
    await page.goto('/#/forms/select/action-select/basic-sync-quick-create');
    const input = page.locator('.cngx-action-select__input').first();
    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const name = page.locator('.event-value').first();

    await burst(page, 'd', ['ArrowDown', 'ArrowDown', 'Enter']);

    await expect(name).toHaveText('Development');
    await page.waitForTimeout(600);
    await expect(name).toHaveText('Development');
    await expect(page.locator('.event-value').nth(1)).toHaveText('t2');
  });
});
