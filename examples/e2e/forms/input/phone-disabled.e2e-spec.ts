import { expect, test } from '@playwright/test';

import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// CngxPhoneInput.value is raw (dial code + national digits). A display string
// such as "664 1234567" trips CNGX2022 and renders a garbled mask.

const ROUTE = 'forms/input/phone/disabled';

test.describe('forms/input/phone/disabled', () => {
  test('renders the raw value through the mask and logs no CNGX2022', async ({ page }) => {
    expect(routesIn('forms', 'input', 'phone').map((r) => r.path)).toContain(ROUTE);
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('CNGX2022')) {
        warnings.push(msg.text());
      }
    });

    await gotoDemo(page, ROUTE);

    await expect(page.locator('cngx-phone-input input')).toHaveValue('+1 202 555 0123');
    expect(warnings).toEqual([]);
  });
});
