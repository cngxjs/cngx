import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxAriaExpanded mirrors a signal onto aria-expanded on its host
// and (optionally) emits aria-controls so AT can jump to the panel.

test.describe('common/a11y/aria-expanded', () => {
  test('disclosure pattern: click toggles aria-expanded and reveals the panel', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/a11y/aria-expanded/disclosure-pattern');

    const toggle = page.getByRole('button', { name: /Toggle details/ });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'details-panel');

    const panel = page.locator('#details-panel');
    // Panel is in the DOM either way; visibility is driven by display.
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    const stateValue = page
      .locator('.event-row', { hasText: 'aria-expanded' })
      .locator('.event-value');
    await expect(stateValue).toHaveText('true');

    await expect(page).toHaveScreenshot('disclosure-pattern-open.png', { fullPage: true });
  });

  test('accordion: each trigger maintains independent expanded state', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/aria-expanded/accordion-multiple-panels');

    const specs = page.getByRole('button', { name: 'Specifications' });
    const reviews = page.getByRole('button', { name: /Reviews/ });
    const shipping = page.getByRole('button', { name: 'Shipping & Returns' });

    await expect(specs).toHaveAttribute('aria-expanded', 'false');
    await expect(reviews).toHaveAttribute('aria-expanded', 'false');
    await expect(shipping).toHaveAttribute('aria-expanded', 'false');

    await specs.click();
    await expect(specs).toHaveAttribute('aria-expanded', 'true');
    await expect(reviews).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#panel-specs')).toBeVisible();

    await reviews.click();
    // Both specs and reviews are now open — panels are independent.
    await expect(specs).toHaveAttribute('aria-expanded', 'true');
    await expect(reviews).toHaveAttribute('aria-expanded', 'true');
    await expect(shipping).toHaveAttribute('aria-expanded', 'false');

    const specsState = page
      .locator('.event-row')
      .filter({ has: page.getByText('specs', { exact: true }) })
      .locator('.event-value');
    await expect(specsState).toHaveText('expanded');

    await expect(page).toHaveScreenshot('accordion-two-open.png', { fullPage: true });
  });
});
