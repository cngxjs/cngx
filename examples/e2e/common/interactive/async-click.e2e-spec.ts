import { expect, test } from '../../_test';
import { attributeLogOf, gotoDemo, recordAttributes } from '../../_helpers';

// Story: cngxAsyncClick runs a Promise or Observable action on click, sets
// aria-busy and aria-disabled on any host while the run is pending (never the
// native disabled attribute), swallows a second click while pending, and
// speaks the settle through a polite region it renders as the host's next
// sibling, unless [autoAnnounce]="false" hands the announcement to the page.

const BASIC = 'common/interactive/async-click/basic-happy-path';
const FEEDBACK = 'common/interactive/async-click/success-and-error-feedback';
const ANNOUNCE = 'common/interactive/async-click/announcement-for-aria-live';
const SETTLE = 'common/interactive/async-click/settle-events';
const ANCHOR = 'common/interactive/async-click/on-anchor-element';

test.describe('common/interactive/async-click', () => {
  test('basic-happy-path: a slow run is busy and aria-disabled, then settles and is spoken', async ({
    page,
  }) => {
    await gotoDemo(page, BASIC);
    await page.getByRole('radio', { name: /slow/ }).check();
    const artifact = page.locator('.cngx-ex-artifact');
    const save = artifact.getByRole('button').first();

    await save.click();
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await expect(save).toHaveAttribute('aria-disabled', 'true');
    await expect(save).not.toHaveAttribute('disabled');
    await expect(save).toHaveText('Saving...');

    await expect(save).toHaveText('Saved!', { timeout: 5_000 });
    await expect(artifact.locator('button + [aria-live="polite"]')).toHaveText('Action succeeded');
  });

  test('basic-happy-path: a second click while pending starts no second run', async ({ page }) => {
    await gotoDemo(page, BASIC);
    await page.getByRole('radio', { name: /slow/ }).check();
    const save = page.locator('.cngx-ex-artifact').getByRole('button').first();
    await recordAttributes(save, ['aria-busy']);

    await save.click();
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await save.click();

    await expect(save).toHaveText('Saved!', { timeout: 5_000 });
    await expect(save).not.toHaveAttribute('aria-busy');
    expect(await attributeLogOf(save)).toEqual(['aria-busy=true', 'aria-busy=null']);
  });

  test('success-and-error-feedback: the fail flag swaps the success class for the error class', async ({
    page,
  }) => {
    await gotoDemo(page, FEEDBACK);
    const submit = page.locator('.cngx-ex-artifact').getByRole('button').first();

    await submit.click();
    await expect(submit).toHaveClass(/cngx-async--success/, { timeout: 5_000 });
    await expect(submit).toHaveText('Submitted!');

    await page.getByRole('checkbox', { name: 'Server fails' }).check();
    await submit.click();
    await expect(submit).toHaveClass(/cngx-async--error/, { timeout: 5_000 });
    await expect(submit).not.toHaveClass(/cngx-async--success/);
    await expect(submit).toHaveText('Failed');
  });

  test('announcement-for-aria-live: no built-in region, the page region receives the text', async ({
    page,
  }) => {
    await gotoDemo(page, ANNOUNCE);
    const artifact = page.locator('.cngx-ex-artifact');
    const save = artifact.getByRole('button').first();
    const announcer = page.locator('#save-announcer');

    await save.click();
    await expect(save).toHaveText('Saved!', { timeout: 5_000 });
    await expect(announcer).toHaveText('Note saved to server');
    await expect(artifact.locator('[aria-live]')).toHaveCount(1);
    await expect(artifact.locator('span[role="status"]')).toHaveCount(0);
  });

  test('settle-events: two runs log generations 1 and 2', async ({ page }) => {
    await gotoDemo(page, SETTLE);
    const upload = page.locator('.cngx-ex-artifact').getByRole('button').first();
    const settled = page
      .locator('.event-row')
      .filter({ has: page.getByText('(settled)', { exact: true }) })
      .locator('.event-value');

    await expect(settled).toHaveText('-');
    await upload.click();
    await expect(settled).toHaveText('#1 success', { timeout: 5_000 });

    await expect(upload).not.toHaveAttribute('aria-disabled');
    await upload.click();
    await expect(settled).toHaveText(/#1 success,\s*#2 success/, { timeout: 5_000 });
  });

  test('on-anchor-element: Space and Enter each run once and keep the route', async ({ page }) => {
    await gotoDemo(page, ANCHOR);
    const link = page.locator('.cngx-ex-artifact').getByRole('button').first();
    const route = page.url();
    await recordAttributes(link, ['aria-busy']);

    await link.focus();
    await page.keyboard.press('Space');
    await expect(link).toHaveAttribute('aria-busy', 'true');
    await expect(link).toHaveAttribute('aria-disabled', 'true');
    await expect(link).not.toHaveAttribute('disabled');
    await expect(link).toHaveText('Loaded!', { timeout: 5_000 });
    await expect(link).not.toHaveAttribute('aria-busy');
    expect(await attributeLogOf(link)).toEqual(['aria-busy=true', 'aria-busy=null']);
    expect(page.url()).toBe(route);

    await page.keyboard.press('Enter');
    await expect(link).toHaveAttribute('aria-busy', 'true');
    await expect(link).not.toHaveAttribute('disabled');
    await expect(link).not.toHaveAttribute('aria-busy', { timeout: 5_000 });
    expect(await attributeLogOf(link)).toEqual([
      'aria-busy=true',
      'aria-busy=null',
      'aria-busy=true',
      'aria-busy=null',
    ]);
    expect(page.url()).toBe(route);
  });
});
