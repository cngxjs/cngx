import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxBadge attaches a floating counter / dot to its host as a
// `.cngx-badge-indicator` span. Number values render as text; `true`
// flips to dot mode; overflow uses `max`; `hidden` tears the indicator
// out of the DOM entirely.

test.describe('common/display/badge', () => {
  test('counts-with-overflow: count text and overflow rendering', async ({ page }) => {
    await gotoDemo(page, 'common/display/badge/counts-with-overflow');

    const inbox = page.getByRole('button', { name: 'Inbox' });
    const tasks = page.getByRole('button', { name: 'Tasks' });
    const notif = page.getByRole('button', { name: 'Notifications' });

    await expect(inbox.locator('.cngx-badge-indicator')).toHaveText('3');
    await expect(tasks.locator('.cngx-badge-indicator')).toHaveText('12');
    // Value 250 with max=99 renders as "99+".
    await expect(notif.locator('.cngx-badge-indicator')).toHaveText('99+');

  });

  test('colors-and-dot-mode: error/warning/neutral variants + boolean dot', async ({ page }) => {
    await gotoDemo(page, 'common/display/badge/colors-and-dot-mode');

    const errBadge = page.getByRole('button', { name: 'Errors' }).locator('.cngx-badge-indicator');
    const warnBadge = page
      .getByRole('button', { name: 'Warnings' })
      .locator('.cngx-badge-indicator');
    const neutralBadge = page
      .getByRole('button', { name: 'Drafts' })
      .locator('.cngx-badge-indicator');
    const dotBadge = page
      .getByRole('button', { name: 'new notifications' })
      .locator('.cngx-badge-indicator');

    await expect(errBadge).toHaveClass(/cngx-badge-indicator--error/);
    await expect(warnBadge).toHaveClass(/cngx-badge-indicator--warning/);
    await expect(neutralBadge).toHaveClass(/cngx-badge-indicator--neutral/);

    // boolean `true` → dot mode (badge has no text content, gets the
    // --dot class).
    await expect(dotBadge).toHaveText('');
    await expect(dotBadge).toHaveClass(/cngx-badge-indicator--dot/);

  });

  test('inline-and-hidden: inline position renders after host text, hidden tears badge out', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/display/badge/inline-and-hidden');

    // Inline badge sits inside the labelled span.
    const featureHost = page.locator('span.cngx-badge-host').filter({ hasText: 'Feature' });
    const inlineIndicator = featureHost.locator('.cngx-badge-indicator');
    await expect(inlineIndicator).toHaveText('NEW');
    await expect(inlineIndicator).toHaveClass(/cngx-badge-indicator--inline/);

    // hidden=true removes the badge node from the host.
    const hidden = page.getByRole('button', { name: 'Hidden' });
    await expect(hidden.locator('.cngx-badge-indicator')).toHaveCount(0);

  });
});
