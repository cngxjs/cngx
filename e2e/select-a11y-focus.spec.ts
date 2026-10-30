import { expect, test, type Locator, type Page } from '@playwright/test';

const R = {
  signalForms: '/#/forms/select/single-select/signal-forms-required',
  actionQuickCreate: '/#/forms/select/action-select/basic-sync-quick-create',
};

// The Enter that confirms an IME candidate: Chromium reports isComposing,
// Safari keyCode 229. Dispatched directly so the run does not depend on an
// installed input method.
async function dispatchCompositionEnter(target: Locator): Promise<boolean> {
  return target.evaluate((el) => {
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 229,
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });
}

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

test.describe('select family IME composition', () => {
  test('a composition Enter on an open select does not commit the active option', async ({
    page,
  }) => {
    await page.goto(R.signalForms);
    const section = ex(page);
    const trigger = section.locator('cngx-select .cngx-select__trigger').first();
    await trigger.click();
    await page.keyboard.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-activedescendant', /.+/);

    expect(await dispatchCompositionEnter(trigger)).toBe(false);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      section.locator('.event-row', { hasText: 'Field value' }).locator('.event-value'),
    ).not.toHaveText('red');
  });

  test('a composition Enter in an action select input does not quick-create', async ({ page }) => {
    await page.goto(R.actionQuickCreate);
    const input = page.locator('cngx-action-select input[role="combobox"]').first();
    await input.click();
    await input.fill('ImeDraft');

    expect(await dispatchCompositionEnter(input)).toBe(false);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const selectedRow = page
      .locator('.cngx-ex-chrome .event-row')
      .filter({ hasText: 'Selected' })
      .first();
    await expect(selectedRow).not.toContainText('ImeDraft');

    await input.press('Enter');
    await expect(selectedRow).toContainText('ImeDraft');
  });
});
