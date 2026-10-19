import { expect, test } from '@playwright/test';

import { collectConsoleMessages, gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// The story labels its three columns through withTreetableLabels; without them
// the treetable warns CNGX4001 per column and shows the unlabeled-column text.

const ROUTE = 'data-display/treetable/async/async-state-lifecycle';

test.describe('data-display/treetable/async/async-state-lifecycle', () => {
  test('labels every column header and logs no CNGX4001', async ({ page }) => {
    expect(routesIn('data-display', 'treetable', 'async').map((r) => r.path)).toContain(ROUTE);
    const warnings = collectConsoleMessages(page, 'CNGX4001');

    await gotoDemo(page, ROUTE);

    // The leading expander column has no visible text by design.
    const headers = page.getByRole('columnheader').filter({ hasText: /\S/ });
    await expect(headers).toHaveText(['Name', 'Role', 'Location']);
    expect(warnings).toEqual([]);
  });
});
