import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMediaQuery wraps matchMedia() as a signal. Resizing the
// viewport must flip the `matches()` value for the affected breakpoint
// directives; toggling emulated color scheme / reduced motion does the
// same for preference queries.

test.describe('common/layout/media-query', () => {
  test('viewport-breakpoints: tablet/desktop/wide badges follow viewport size', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/media-query/viewport-breakpoints');

    const tablet = page.locator('.status-badge', { hasText: /^\s*tablet/ });
    const desktop = page.locator('.status-badge', { hasText: /^\s*desktop/ });
    const wide = page.locator('.status-badge', { hasText: /^\s*wide/ });

    // 1280×720 (Playwright default chromium devices) → tablet + desktop true,
    // wide false.
    await expect(tablet).toContainText('tablet (768px+): true');
    await expect(desktop).toContainText('desktop (1024px+): true');
    await expect(wide).toContainText('wide (1440px+): false');
    await expect(tablet).toHaveClass(/active/);
    await expect(wide).not.toHaveClass(/active/);

    // Shrink below 768px — every breakpoint should now be false.
    await page.setViewportSize({ width: 600, height: 720 });
    await expect(tablet).toContainText('false', { timeout: 2000 });
    await expect(desktop).toContainText('false');
    await expect(tablet).not.toHaveClass(/active/);

    // Grow past 1440px — every breakpoint should now be true.
    await page.setViewportSize({ width: 1600, height: 720 });
    await expect(tablet).toContainText('true', { timeout: 2000 });
    await expect(wide).toContainText('true');
    await expect(wide).toHaveClass(/active/);

  });

  test('viewport-breakpoints: preference badges follow emulated media', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
    await gotoDemo(page, 'common/layout/media-query/viewport-breakpoints');

    const motion = page.locator('.status-badge', { hasText: /reduced-motion/ });
    const dark = page.locator('.status-badge', { hasText: /prefers-dark/ });

    await expect(motion).toContainText('reduced-motion: false');
    await expect(dark).toContainText('prefers-dark: false');

    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await expect(motion).toContainText('true', { timeout: 2000 });
    await expect(dark).toContainText('true');
    await expect(motion).toHaveClass(/active/);

    // Reset for sibling tests.
    await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
  });
});
