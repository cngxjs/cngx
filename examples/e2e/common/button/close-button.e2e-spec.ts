import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxCloseButton is an icon-only host with fixed ghost / sm / neutral
// axes. Its name is the host aria-label; the default X, a provided glyph or a
// projected cngx-icon all sit in the aria-hidden glyph span. The dismissible
// stories remove the closed content and leave a text in its place; neither
// story moves focus programmatically, so the spec only pins that focus is not
// left on a removed node inside the artifact.

const BASIC = 'common/button/close-button/basic';
const LABELS = 'common/button/close-button/contextual-labels';
const CARD = 'common/button/close-button/inside-a-dismissible-card';
const PROJECTED = 'common/button/close-button/projected-icon';
const PROVIDED = 'common/button/close-button/provided-icon';

test.describe('common/button/close-button', () => {
  test('basic: named, fixed axes, closes the message on click', async ({ page }) => {
    await gotoDemo(page, BASIC);
    const artifact = page.locator('.cngx-ex-artifact');
    const close = artifact.getByRole('button', { name: 'Close message' });

    await expect(close).toHaveAttribute('data-variant', 'ghost');
    await expect(close).toHaveAttribute('data-size', 'sm');
    await expect(close).toHaveAttribute('data-tone', 'neutral');
    await expect(close.locator('.cngx-icon-button__glyph')).toHaveAttribute('aria-hidden', 'true');
    await expect(close.locator('svg.cngx-close-button__icon')).toHaveCount(1);

    await close.click();
    await expect(close).toHaveCount(0);
    await expect(artifact).toContainText('Dismissed.');
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(artifact.getByRole('button', { name: 'Close message' })).toBeVisible();
  });

  test('basic: Enter on the focused close button dismisses', async ({ page }) => {
    await gotoDemo(page, BASIC);
    const artifact = page.locator('.cngx-ex-artifact');
    const close = artifact.getByRole('button', { name: 'Close message' });

    await close.focus();
    await page.keyboard.press('Enter');
    await expect(close).toHaveCount(0);
    await expect(artifact).toContainText('Dismissed.');
  });

  test('contextual-labels: each close button carries its own name', async ({ page }) => {
    await gotoDemo(page, LABELS);
    const artifact = page.locator('.cngx-ex-artifact');

    for (const name of [
      'Close session-expired alert',
      'Dismiss save-failed toast',
      'Close settings dialog',
      'Collapse filter sidebar',
    ]) {
      await expect(artifact.getByRole('button', { name, exact: true })).toHaveAttribute(
        'data-variant',
        'ghost',
      );
    }
    await expect(artifact.getByRole('button')).toHaveCount(4);
  });

  test('inside-a-dismissible-card: closes the card, focus is not left on a removed node', async ({
    page,
  }) => {
    await gotoDemo(page, CARD);
    const artifact = page.locator('.cngx-ex-artifact');
    const close = artifact.getByRole('button', { name: 'Dismiss saved-successfully card' });
    const card = artifact.locator('.demo-dismissible-card');

    await expect(card).toBeVisible();
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveCount(0);
    await expect(artifact.getByRole('status')).toHaveText('Card dismissed.');
    // The focused button is gone; the document never holds a detached focus.
    const focusConnected = await page.evaluate(() => document.activeElement?.isConnected ?? true);
    expect(focusConnected).toBe(true);

    await page.getByRole('button', { name: 'Show' }).click();
    await expect(card).toBeVisible();
    await expect(close).toBeVisible();
  });

  test('projected-icon: a projected cngx-icon replaces the default X', async ({ page }) => {
    await gotoDemo(page, PROJECTED);
    const artifact = page.locator('.cngx-ex-artifact');

    const fallback = artifact.getByRole('button', { name: 'Default close' });
    await expect(fallback.locator('svg.cngx-close-button__icon')).toHaveCount(1);
    for (const name of ['Close with circle', 'Collapse']) {
      const button = artifact.getByRole('button', { name, exact: true });
      await expect(button.locator('.cngx-icon-button__glyph cngx-icon')).toHaveCount(1);
      await expect(button.locator('svg.cngx-close-button__icon')).toHaveCount(0);
      await expect(button.locator('.cngx-icon-button__glyph')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }
  });

  test('provided-icon: the provided glyph is used unless one is projected', async ({ page }) => {
    await gotoDemo(page, PROVIDED);
    const artifact = page.locator('.cngx-ex-artifact');

    for (const name of ['Close panel', 'Dismiss notice']) {
      const button = artifact.getByRole('button', { name, exact: true });
      await expect(button.locator('.cngx-icon-button__glyph demo-circle-close')).toHaveCount(1);
      await expect(button.locator('svg.cngx-close-button__icon')).toHaveCount(0);
    }
    const collapse = artifact.getByRole('button', { name: 'Collapse' });
    await expect(collapse.locator('demo-circle-close')).toHaveCount(0);
    await expect(collapse.locator('.cngx-icon-button__glyph cngx-icon')).toHaveCount(1);

    // Outside the provider scope the default X renders.
    const reference = page.locator('demo-default-close-reference').getByRole('button', {
      name: 'Close preview',
    });
    await expect(reference.locator('svg.cngx-close-button__icon')).toHaveCount(1);
  });
});
