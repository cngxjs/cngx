import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxTag — 13 stories cover variants, density, slots, link mode,
// group semantic, truncation, config provider.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['app-wide-defaults', 'common/display/tag/app-wide-defaults-via-providetagconfig'],
  ['color-palette', 'common/display/tag/color-palette'],
  ['composition-icon', 'common/display/tag/composition-with-cngxicon'],
  ['density', 'common/display/tag/density'],
  ['group-list', 'common/display/tag/group-semantic-list'],
  ['group-header', 'common/display/tag/group-with-header-accessory'],
  ['alignment', 'common/display/tag/layout-only-alignment'],
  ['gap-variants', 'common/display/tag/layout-only-gap-variants'],
  ['link-mode', 'common/display/tag/link-mode'],
  ['slot-custom-label', 'common/display/tag/slot-overrides-custom-label'],
  ['slot-prefix-suffix', 'common/display/tag/slot-overrides-prefix-label-suffix'],
  ['truncate', 'common/display/tag/truncate-maxwidth'],
  ['variant-matrix', 'common/display/tag/variant-matrix'],
];

test.describe('common/display/tag', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
