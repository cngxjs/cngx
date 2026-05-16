import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPopover (flat demo) — click, controlled-open, escape-mode,
// placement variants. The popover-panel and tooltip families have their
// own specs.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['click', 'common/popover/click-popover'],
  ['controlled-open', 'common/popover/controlled-open'],
  ['escape-mode', 'common/popover/escape-mode'],
  ['placement-variants', 'common/popover/placement-variants'],
];

test.describe('common/popover/popover', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
