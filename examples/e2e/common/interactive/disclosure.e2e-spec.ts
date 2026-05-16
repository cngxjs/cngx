import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxDisclosure manages aria-expanded + aria-controls on a
// trigger button. It supports both uncontrolled (internal state) and
// controlled (external signal) modes. Click / Enter / Space all toggle.

test.describe('common/interactive/disclosure', () => {
  test('basic-uncontrolled: aria-expanded toggles and aria-controls points to the panel', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/disclosure/basic-uncontrolled');

    const trigger = page.getByRole('button', { name: /Expand answer/ });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', 'faq-1');

    await trigger.click();
    await expect(page.getByRole('button', { name: /Collapse answer/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.locator('#faq-1')).toBeVisible();

    await expect(page).toHaveScreenshot('disclosure-expanded.png', { fullPage: true });
  });

  test('controlled-mode: state is driven by the external signal toggle', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/disclosure/controlled-mode');

    // The page has at least one cngxDisclosure trigger; the controlled
    // signal toggles via either the trigger or an external button.
    const trigger = page.locator('button[cngxdisclosure]').first();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await expect(page).toHaveScreenshot('disclosure-controlled.png', { fullPage: true });
  });

  test('faq-accordion: multiple disclosures keep independent state', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/disclosure/faq-accordion');

    const triggers = page.locator('button[cngxdisclosure]');
    const count = await triggers.count();
    expect(count).toBeGreaterThan(1);

    // All start collapsed.
    for (let i = 0; i < count; i++) {
      await expect(triggers.nth(i)).toHaveAttribute('aria-expanded', 'false');
    }

    // Open the first; others must remain collapsed (independent state).
    await triggers.first().click();
    await expect(triggers.first()).toHaveAttribute('aria-expanded', 'true');
    for (let i = 1; i < count; i++) {
      await expect(triggers.nth(i)).toHaveAttribute('aria-expanded', 'false');
    }

    await expect(page).toHaveScreenshot('disclosure-faq.png', { fullPage: true });
  });
});
