import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

test.describe('common/interactive/error-registry', () => {
  test('inject-error-scope-programmatic: Validate marks the input invalid and ties it to the message', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/error/registry/inject-error-scope-programmatic');
    const input = page.getByRole('textbox', { name: 'Email' });

    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).not.toHaveAttribute('aria-errormessage');

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const messageId = await input.getAttribute('aria-errormessage');
    expect(messageId).toBeTruthy();
    await expect(page.locator(`[id="${messageId}"]`)).toHaveText('Email must contain @.');

    await input.fill('ada@example.com');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).not.toHaveAttribute('aria-errormessage');
  });

  test('inject-error-aggregator-programmatic: the injected aggregator lists its active labels', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/error/registry/inject-error-aggregator-programmatic');
    const region = page.getByRole('region', { name: 'Email validation' });
    const list = region.getByRole('alert');

    await expect(list.getByRole('listitem')).toHaveText(['Format invalid']);
    await page.getByLabel('Server says taken').check();
    await expect(list.getByRole('listitem')).toHaveText(['Format invalid', 'Already in use']);

    await page.getByLabel('Format invalid').uncheck();
    await page.getByLabel('Server says taken').uncheck();
    await expect(list).toHaveCount(0);
    await expect(region).toContainText('No active errors.');
  });

  test('provider-and-reveal-features: manual reveal and reset drive the named scope', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/error/registry/provider-and-reveal-features');
    const region = page.getByRole('region', { name: 'Checkout flow' });

    await expect(region.getByRole('alert')).toHaveCount(0);
    await expect(region).toContainText('No errors visible yet.');

    await page.getByRole('button', { name: 'Manual reveal' }).click();
    await expect(region.getByRole('alert')).toHaveText('Validate the cart before continuing.');

    await page.getByRole('button', { name: 'Manual reset' }).click();
    await expect(region.getByRole('alert')).toHaveCount(0);
    await expect(region).toContainText('No errors visible yet.');
  });
});
