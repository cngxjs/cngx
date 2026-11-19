import { expect, test } from '@playwright/test';

// mat-hint has no colour of its own in M3 and inherits it, so the lab has to
// paint its text in the Material role, or the reference hint shows the examples
// app colour and the field pair is not a fair compare.
test('the Material reference hint in the lab inherits on-surface', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#/material-lab');
  const hint = page.locator('mat-hint').first();
  await expect(hint).toBeVisible();

  const [hintColor, onSurface] = await hint.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--mat-sys-on-surface)';
    el.append(probe);
    const colors = [getComputedStyle(el).color, getComputedStyle(probe).color];
    probe.remove();
    return colors;
  });
  expect(hintColor).toBe(onSurface);
});
