import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: a runtime EN/DE flip. The visible copy is bound to computed signals
// and the select's own copy follows through withAriaLabels / withFallbackLabels
// fed Signal values. The flip must retune the trigger label, the placeholder
// and the clear-button accessible name without re-speaking the live region.
const ROUTE = 'forms/select/single-select/language-flip';

const trigger = (page: Page) => page.locator('cngx-select .cngx-select__trigger').first();
const placeholder = (page: Page) =>
  page.locator('cngx-select').nth(1).locator('.cngx-select__label--placeholder');
const clearButton = (page: Page) => page.locator('cngx-select').first().locator('.cngx-select__clear');
const toGerman = (page: Page) => page.getByRole('button', { name: 'Deutsch' });

test.describe('select runtime language flip', () => {
  test('trigger label, placeholder and clear label follow the flip', async ({ page }) => {
    await gotoDemo(page, ROUTE);

    await expect(trigger(page)).toHaveAttribute('aria-label', 'Colour');
    await expect(placeholder(page)).toHaveText('Pick a colour…');
    await expect(clearButton(page)).toHaveAttribute('aria-label', 'Clear selection');

    await toGerman(page).click();

    await expect(trigger(page)).toHaveAttribute('aria-label', 'Farbe');
    await expect(placeholder(page)).toHaveText('Farbe wählen…');
    await expect(clearButton(page)).toHaveAttribute('aria-label', 'Auswahl löschen');
  });

  test('the live region does not re-speak on a flip', async ({ page }) => {
    await gotoDemo(page, ROUTE);

    const liveRegion = page.locator('.cdk-live-announcer-element');
    const before = (await liveRegion.textContent()) ?? '';

    await toGerman(page).click();
    await expect(trigger(page)).toHaveAttribute('aria-label', 'Farbe');

    const after = (await liveRegion.textContent()) ?? '';
    expect(after).toBe(before);
  });
});
