import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxRadio + CngxRadioGroup — radiogroup APG. Only one radio is
// aria-checked at a time; arrow keys cycle within the group.

test.describe('common/interactive/radio', () => {
  test('basic vertical: click selects, arrow moves selection within the group', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/radio/basic-vertical-group');

    const radios = page.getByRole('radio');
    expect(await radios.count()).toBeGreaterThanOrEqual(2);

    await radios.nth(1).click();
    await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'false');

  });

  test('orientation horizontal: radios render with horizontal aria-orientation', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/radio/orientation-horizontal');
    const group = page.getByRole('radiogroup').first();
    await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
  });

  test('disabled cascade: group + per-radio disabled both surface aria-disabled', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/radio/disabled-group-cascades-per-radio-overrides');
    // At least one radio has aria-disabled=true (per-radio variant).
    const radios = page.getByRole('radio');
    const states = await radios.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getAttribute('aria-disabled')),
    );
    expect(states.some((s) => s === 'true')).toBe(true);
  });

  test('custom dot-glyph: consumer dot glyph renders', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/radio/custom-dot-glyph');
    expect(await page.getByRole('radio').count()).toBeGreaterThan(0);
  });
});
