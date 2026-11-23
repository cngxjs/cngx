import { expect, test } from '../../_test';
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

  });

  test('basic-uncontrolled: Enter and Space toggle once and still fire the host click', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/disclosure/basic-uncontrolled');

    const trigger = page.locator('button[cngxdisclosure]').first();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.evaluate((el) => {
      el.setAttribute('data-clicks', '0');
      el.addEventListener('click', () =>
        el.setAttribute('data-clicks', String(Number(el.getAttribute('data-clicks')) + 1)),
      );
    });

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-clicks', '1');

    await page.keyboard.press(' ');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('data-clicks', '2');
  });

  test('controlled-mode: state is driven by the external signal toggle', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/disclosure/controlled-mode');

    // The page has at least one cngxDisclosure trigger; the controlled
    // signal toggles via either the trigger or an external button.
    const trigger = page.locator('button[cngxdisclosure]').first();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  });

  test('faq-accordion: multiple disclosures keep independent state', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/disclosure/faq-accordion');

    const triggers = page.locator('button[cngxdisclosure]');
    // Wait for the render before reading a count: locator.count() does not
    // retry, so reading it first races Angular's first paint.
    await expect(triggers.nth(1)).toBeVisible();
    const count = await triggers.count();

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

  });
  // One test per route: a hash-only navigation keeps the previous demo's DOM
  // for a moment, so a trigger list read across routes can hold stale buttons.
  for (const demo of [
    'basic-uncontrolled',
    'controlled-mode',
    'faq-accordion',
    'card-with-disclosure-expand-collapse',
  ]) {
    test(`${demo}: collapsed disclosures keep their aria-controls target in the DOM`, async ({
      page,
    }) => {
      await gotoDemo(page, `common/interactive/disclosure/${demo}`);
      const triggers = page.locator('button[cngxdisclosure]');
      await expect(triggers.first()).toHaveAttribute('aria-expanded', 'false');
      for (const trigger of await triggers.all()) {
        // Retrying read: right after the navigation the binding may not have painted yet.
        await expect(trigger).toHaveAttribute('aria-controls', /.+/);
        const id = await trigger.getAttribute('aria-controls');
        await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
        await expect(page.locator(`[id="${id}"]`)).toBeHidden();
      }
    });
  }
});
