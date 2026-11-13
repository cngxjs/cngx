import type { Page } from '@playwright/test';
import { expect, test } from '../_test';

import { gotoDemo } from '../_helpers';

// Drives the core stories whose point only shows across a reload: the
// persisted preference axes and the root pack providers (`?pack=` sits before
// the hash, so the app bootstraps with that pack).

function readout(page: Page, label: string) {
  return page
    .locator('.event-row', { has: page.locator('.event-label', { hasText: label }) })
    .locator('.event-value');
}

test.describe('core stories across a reload', () => {
  test('provideA11yPreferences restores a persisted pick and falls back to the initials once cleared', async ({
    page,
  }) => {
    await gotoDemo(page, 'core/theming/a11y-preferences/persist-choices-across-reloads');
    await page.evaluate(() => sessionStorage.removeItem('cngx-a11y-demo'));
    await page.reload();
    const attributes = readout(page, 'Isolated root <html> attributes');
    await expect(attributes).toContainText('data-density=compact');

    await page.getByRole('radio', { name: 'Spacious' }).click();
    await expect(attributes).toContainText('data-density=spacious');
    await page.reload();

    await expect(attributes).toContainText('data-density=spacious');
    await expect(page.getByRole('radio', { name: 'Spacious' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await page.getByRole('button', { name: 'Clear stored choices' }).click();
    await page.reload();

    await expect(attributes).toContainText('data-density=compact');
  });

  test('the app-wide German pack reads German at the root and stamps the detached <html>', async ({
    page,
  }) => {
    await page.goto('/?pack=de#/core/i18n/pack-providers/app-wide-german-pack');

    await expect(readout(page, 'Root CNGX_LANGUAGE_PACK locale')).toHaveText('de');
    await expect(page.locator('cngx-paginator')).toContainText('Mehr laden');
    await expect(readout(page, "Detached <html> (withDocumentLanguage('on'))")).toHaveText(
      'lang=de, dir=ltr',
    );
    await expect(
      readout(page, "Live page <html lang> (withDocumentLanguage('off'))"),
    ).not.toHaveText('de');
  });

  test('without a pack the same story reads English', async ({ page }) => {
    await gotoDemo(page, 'core/i18n/pack-providers/app-wide-german-pack');

    await expect(readout(page, 'Root CNGX_LANGUAGE_PACK locale')).toHaveText('en');
    await expect(page.locator('cngx-paginator')).not.toContainText('Mehr laden');
  });

  test('a partial pack replaces its keys and leaves the rest English', async ({ page }) => {
    await page.goto('/?pack=partial#/core/i18n/pack-providers/partial-pack-over-english');

    await expect(readout(page, 'Root CNGX_LANGUAGE_PACK locale')).toHaveText('de');
    const paginator = page.locator('cngx-paginator');
    await expect(paginator).toContainText('Weitere laden');
    await expect(paginator).toContainText(' von ');
  });
});
