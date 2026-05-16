import type { Page } from '@playwright/test';

/**
 * The examples app uses Angular's hash location strategy
 * (provideRouter(routes, withHashLocation())) so deep links resolve off
 * the `#` fragment. Always navigate through this helper so tests don't
 * accidentally land on the home/index page.
 */
export async function gotoDemo(page: Page, routePath: string): Promise<void> {
  const clean = routePath.replace(/^\/+/, '');
  await page.goto(`/#/${clean}`);
}
