import type { Page } from '@playwright/test';

import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSplitButton joins a main cngxButton and a cngxIconMenuButton
// caret. The caret follows the main action: while it runs the caret refuses
// activation and an open menu closes. A menu choice runs through the main
// button. The pass runs per direction and pins the seam order: the caret sits
// at the inline end of the main button.

const BASIC = 'common/menu-button/split-button/basic';
const BUSY = 'common/menu-button/split-button/busy-and-disabled';

async function setDirection(page: Page, dir: 'ltr' | 'rtl'): Promise<void> {
  await page.evaluate((d) => document.documentElement.setAttribute('dir', d), dir);
}

function eventValue(page: Page, label: string) {
  return page
    .locator('.event-row')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('.event-value');
}

for (const dir of ['ltr', 'rtl'] as const) {
  test.describe(`common/menu-button/split-button (${dir})`, () => {
    test('two Tab stops, the caret at the inline end, named from the pack', async ({ page }) => {
      await gotoDemo(page, BASIC);
      await setDirection(page, dir);

      const group = page.getByRole('group', { name: 'Publish' });
      const main = group.getByRole('button', { name: 'Publish' });
      const caret = group.getByRole('button', { name: 'More options' });
      await expect(caret).toHaveAttribute('aria-haspopup', 'menu');
      await expect(caret).toHaveAttribute('aria-expanded', 'false');

      const mainBox = await main.boundingBox();
      const caretBox = await caret.boundingBox();
      expect(mainBox && caretBox).toBeTruthy();
      if (dir === 'ltr') {
        expect(caretBox!.x).toBeGreaterThan(mainBox!.x);
      } else {
        expect(caretBox!.x).toBeLessThan(mainBox!.x);
      }

      await main.focus();
      await page.keyboard.press('Tab');
      await expect(caret).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(main).toBeFocused();
    });

    test('the caret refuses activation while the main action runs', async ({ page }) => {
      await gotoDemo(page, BASIC);
      await setDirection(page, dir);

      const main = page.getByRole('button', { name: 'Publish' });
      const caret = page.getByRole('button', { name: 'More options' });
      const menu = page.getByRole('menu', { name: 'Publish options' });

      await main.click();
      await expect(eventValue(page, 'Busy')).toHaveText('yes');
      await expect(caret).toHaveAttribute('aria-disabled', 'true');

      // force: Playwright refuses an aria-disabled target; the core must swallow it.
      await caret.click({ force: true });
      await expect(menu).toBeHidden();
      await caret.focus();
      for (const key of ['ArrowDown', 'ArrowUp', 'Enter', ' ']) {
        await page.keyboard.press(key);
        await expect(menu).toBeHidden();
      }

      await expect(eventValue(page, 'Busy')).toHaveText('no');
      await expect(caret).not.toHaveAttribute('aria-disabled', 'true');
    });

    test('an open menu closes when the main action starts', async ({ page }) => {
      await gotoDemo(page, BASIC);
      await setDirection(page, dir);

      const main = page.getByRole('button', { name: 'Publish' });
      const caret = page.getByRole('button', { name: 'More options' });
      const menu = page.getByRole('menu', { name: 'Publish options' });

      await caret.focus();
      await page.keyboard.press('ArrowDown');
      await expect(menu).toBeVisible();
      // A programmatic click fires no pointerdown, so outside-click dismissal
      // stays out of it: only the main action starting can close the menu.
      await main.evaluate((el: HTMLElement) => el.click());
      await expect(menu).toBeHidden();
      await expect(caret).toHaveAttribute('aria-disabled', 'true');
    });

    test('a menu choice runs the main action', async ({ page }) => {
      await gotoDemo(page, BASIC);
      await setDirection(page, dir);

      const caret = page.getByRole('button', { name: 'More options' });
      const menu = page.getByRole('menu', { name: 'Publish options' });

      await caret.focus();
      await page.keyboard.press('ArrowDown');
      await expect(menu).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(menu).toBeHidden();
      await expect(eventValue(page, 'Busy')).toHaveText('yes');
      await expect(eventValue(page, 'Last run')).toHaveText('draft');
    });

    test('a disabled main button blocks the caret without lending it a reason', async ({
      page,
    }) => {
      await gotoDemo(page, BUSY);
      await setDirection(page, dir);

      const main = page.getByRole('button', { name: 'Export PDF' });
      const caret = page.getByRole('button', { name: 'More options' });
      const menu = page.getByRole('menu', { name: 'Export formats' });

      await page.getByRole('button', { name: 'Revoke analyst role' }).click();
      await expect(main).toHaveAccessibleDescription('Exporting needs the analyst role.');
      await expect(caret).toHaveAttribute('aria-disabled', 'true');
      await expect(caret).toHaveAccessibleDescription('');
      await caret.click({ force: true });
      await expect(menu).toBeHidden();

      await page.getByRole('button', { name: 'Grant analyst role' }).click();
      await page.getByRole('button', { name: 'Lock other formats' }).click();
      await expect(main).not.toHaveAttribute('aria-disabled', 'true');
      await expect(caret).toHaveAttribute('aria-disabled', 'true');
      await expect(caret).toHaveAccessibleDescription('Other formats are part of the Pro plan.');
    });
  });
}
