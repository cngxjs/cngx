import { expect, test, type Locator, type Page } from '@playwright/test';

const R = {
  signalForms: '/#/forms/select/single-select/signal-forms-required',
  actionQuickCreate: '/#/forms/select/action-select/basic-sync-quick-create',
  allVariants: '/#/forms/select/mobile-sheet/all-variants',
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

// Where focus sits relative to the select host once the close settled (the
// close restore runs in a microtask; two frames later a stray restore has
// landed on the trigger). The next Tab stop is platform policy (macOS WebKit
// skips buttons unless Full Keyboard Access is on), so the leave contract is:
// focus moved forward, out of the host, and was not pulled back to the trigger.
async function settledFocusAfter(host: Locator): Promise<'inside' | 'before' | 'after' | 'body'> {
  return host.evaluate(
    (el) =>
      new Promise<'inside' | 'before' | 'after' | 'body'>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const active = document.activeElement;
            if (!active || active === document.body) {
              resolve('body');
            } else if (el.contains(active)) {
              resolve('inside');
            } else if (el.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING) {
              resolve('after');
            } else {
              resolve('before');
            }
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
    expect(await settledFocusAfter(section.locator('cngx-select').first())).toBe('after');
  });

  test('Tab out of an open select with a scrolling list skips the panel', async ({ page }) => {
    // Desktop width keeps the panels anchored. Twenty cities overflow the
    // panel, so it is a scroller, which Chromium would make a Tab stop.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(R.allVariants);
    const section = ex(page);
    const trigger = section.locator('cngx-select .cngx-select__trigger').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = section.locator('cngx-select .cngx-select__panel').first();
    expect(await panel.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    await page.keyboard.press('Tab');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(
      section.locator('cngx-multi-select .cngx-multi-select__trigger').first(),
    ).toBeFocused();
  });

  test('a click into another control keeps focus there', async ({ page }) => {
    // A text input takes focus on click in every engine; a button does not
    // in WebKit on macOS, where the click drops focus to body instead. The
    // action select input sits below the open panel, so the click reaches it.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(R.allVariants);
    const section = ex(page);
    const trigger = section.locator('cngx-select .cngx-select__trigger').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const otherInput = section
      .locator('cngx-action-select input.cngx-action-select__input')
      .first();
    await otherInput.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(await settledFocusAfter(section.locator('cngx-select').first())).toBe('after');
    await expect(otherInput).toBeFocused();
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
