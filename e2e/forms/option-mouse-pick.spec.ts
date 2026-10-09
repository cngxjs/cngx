import { expect, test, type Locator, type Page } from '@playwright/test';

async function nextFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
}

async function openPanel(page: Page, owner: Locator, options: Locator): Promise<void> {
  await owner.click();
  await nextFrame(page);
  if (!(await options.first().isVisible())) {
    await owner.press('ArrowDown');
  }
  await expect(options.first()).toBeVisible();
}

async function countFocusOut(owner: Locator): Promise<() => Promise<number>> {
  await owner.evaluate((el) => {
    const target = el as HTMLElement & { __focusOuts?: number };
    target.__focusOuts = 0;
    el.addEventListener('focusout', () => {
      target.__focusOuts = (target.__focusOuts ?? 0) + 1;
    });
  });
  return () =>
    owner.evaluate((el) => (el as HTMLElement & { __focusOuts?: number }).__focusOuts ?? 0);
}

const VARIANTS: readonly { name: string; route: string; host: string }[] = [
  {
    name: 'CngxSelect',
    route: 'forms/select/single-select/signal-forms-required',
    host: 'cngx-select',
  },
  {
    name: 'CngxMultiSelect',
    route: 'forms/select/multi-select/multi-basic',
    host: 'cngx-multi-select',
  },
  {
    name: 'CngxCombobox',
    route: 'forms/select/combobox/combobox-basic-tag-picker-with-typeahead-filter',
    host: 'cngx-combobox',
  },
  {
    name: 'CngxTypeahead',
    route: 'forms/select/typeahead/typeahead-bound-to-a-typed-form-field',
    host: 'cngx-typeahead',
  },
  {
    name: 'CngxReorderableMultiSelect',
    route: 'forms/select/reorderable-multi-select/basic-drag-chips-via-mouse-touch',
    host: 'cngx-reorderable-multi-select',
  },
  {
    name: 'CngxActionSelect',
    route: 'forms/select/action-select/basic-sync-quick-create',
    host: 'cngx-action-select',
  },
  {
    name: 'CngxActionMultiSelect',
    route: 'forms/select/action-multi-select/basic',
    host: 'cngx-action-multi-select',
  },
  {
    name: 'CngxSelectShell',
    route: 'forms/select/select-shell/basic-flat-declarative-options',
    host: 'cngx-select-shell',
  },
];

test.describe('option mouse pick keeps focus on the owner', () => {
  for (const variant of VARIANTS) {
    test(`${variant.name}: a mouse pick keeps focus on the trigger or input`, async ({ page }) => {
      await page.goto(`/#/${variant.route}`);
      const host = page.locator(variant.host).first();
      const owner = host.locator('[role="combobox"]').first();
      const options = host.locator('[role="option"]:not([aria-disabled="true"])');

      await openPanel(page, owner, options);
      const focusOuts = await countFocusOut(owner);
      await options.nth(1).click();

      await expect(owner).toBeFocused();
      expect(await focusOuts()).toBe(0);
    });
  }

  test('CngxSelect in a required field stays untouched after a mouse pick', async ({ page }) => {
    await page.goto('/#/forms/select/single-select/signal-forms-required');
    const field = page.locator('cngx-form-field').first();
    const owner = field.locator('[role="combobox"]').first();
    const options = field.locator('[role="option"]:not([aria-disabled="true"])');

    await openPanel(page, owner, options);
    const picked = options.nth(1);
    await picked.click();

    await expect(page.locator('.event-row').first()).toContainText('green');
    await expect(field).not.toHaveClass(/cngx-field--touched/);
    await owner.press('Tab');
    await expect(field).toHaveClass(/cngx-field--touched/);
  });

  test('CngxTypeahead: a mouse pick fills the input like an Enter pick', async ({ page }) => {
    const route = '/#/forms/select/typeahead/typeahead-bound-to-a-typed-form-field';
    const owner = page.locator('cngx-form-field').first().locator('input[role="combobox"]').first();
    const options = page.locator('cngx-typeahead [role="option"]:not([aria-disabled="true"])');

    await page.goto(route);
    await openPanel(page, owner, options);
    await options.nth(1).click();
    await expect(owner).toBeFocused();
    await expect(owner).toHaveValue(/.+/);
    const byMouse = await owner.inputValue();

    await page.goto('about:blank');
    await page.goto(route);
    await openPanel(page, owner, options);
    await options.nth(1).hover();
    await owner.press('Enter');
    const byKeyboard = await owner.inputValue();

    expect(byMouse).not.toBe('');
    expect(byMouse).toBe(byKeyboard);
    await expect(page.locator('cngx-form-field').first()).not.toHaveClass(/cngx-field--touched/);
  });

  test('phone input: a country pick by mouse leaves the field untouched', async ({ page }) => {
    await page.goto('/#/forms/input/phone/intl');
    const field = page.locator('cngx-form-field').first();
    const owner = field.locator('cngx-select [role="combobox"]').first();
    const options = field.locator('[role="option"]');

    await openPanel(page, owner, options);
    await options.nth(1).click();

    await expect(page.locator('.status-badge').first()).toHaveText('Country: Austria');
    await expect(owner).toBeFocused();
    await expect(field).not.toHaveClass(/cngx-field--touched/);
    await expect(field).not.toHaveClass(/cngx-field--error/);
  });
});

test.describe('standalone listboxes', () => {
  test('a tabindex=0 listbox takes focus from an option click and keeps arrow keys', async ({
    page,
  }) => {
    await page.goto('/#/common/interactive/listbox/base/single-select');
    const listbox = page.getByRole('listbox').first();
    const options = listbox.getByRole('option');

    await options.nth(0).click();
    await expect(listbox).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      (await options.nth(1).getAttribute('id')) ?? '',
    );
  });

  test('a listbox field bridge turns touched after a click then leaving', async ({ page }) => {
    await page.goto('/#/forms/field/listbox-forms/signal-forms-single-select');
    const field = page.locator('cngx-form-field').first();
    const listbox = field.getByRole('listbox').first();

    const option = listbox.getByRole('option').nth(1);
    await option.click();
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await expect(listbox).toBeFocused();
    await expect(field).not.toHaveClass(/cngx-field--touched/);

    await page.keyboard.press('Tab');
    await expect(field).toHaveClass(/cngx-field--touched/);
  });

  test('command palette: an option click keeps focus on the search input', async ({ page }) => {
    await page.goto('/#/ui/command-palette/basic');
    await page.locator('.demo-cmdk-trigger').click();
    const dialog = page.getByRole('dialog');
    const input = dialog.locator('input').first();
    await expect(input).toBeFocused();

    const options = dialog.getByRole('option');
    await expect(options.first()).toBeVisible();
    const down = await options.first().evaluate((el) => {
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
      el.dispatchEvent(event);
      return event.defaultPrevented;
    });

    expect(down).toBe(true);
    await expect(input).toBeFocused();
  });

  test('a tabindex=0 listbox next to a search input takes focus from an option click', async ({
    page,
  }) => {
    await page.goto('/#/common/interactive/listbox/search/command-palette');
    const input = page.getByRole('searchbox', { name: 'Search commands' });
    const listbox = page.getByRole('listbox').first();

    await input.click();
    await listbox.getByRole('option').nth(1).click();

    await expect(listbox).toBeFocused();
  });

  test('paginator page-size: picking a size by mouse still closes and restores focus', async ({
    page,
  }) => {
    await page.goto('/#/ui/paginator/paginator-parts/page-size/dropdown');
    const trigger = page.locator('cngx-pgn-page-size button').first();

    await trigger.click();
    const listbox = page.getByRole('listbox').first();
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option').nth(1).click();

    await expect(listbox).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
