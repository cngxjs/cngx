import { expect, test } from './_test';

// Proves the console guard in ./_test.ts bites: a planted warning has to fail
// the test, a clean page has to pass. No demo route involved, so a story
// change cannot turn either case vacuous.

test.describe('console guard', () => {
  test('fails a test whose page logs an unlisted console.warn', async ({ page }) => {
    test.fail();
    await page.setContent('<p>planted</p>');
    await page.evaluate(() => console.warn('CNGX0000: planted by the console guard self-check'));
    await expect(page.locator('p')).toHaveText('planted');
  });

  test('fails a test whose page throws an uncaught error', async ({ page }) => {
    test.fail();
    await page.setContent('<p>planted</p>');
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('planted by the console guard self-check');
      });
    });
    await page.waitForTimeout(100);
  });

  test('passes a test whose page logs nothing on the guarded channels', async ({ page }) => {
    await page.setContent('<p>clean</p>');
    await page.evaluate(() => console.info('info is not a guarded channel'));
    await expect(page.locator('p')).toHaveText('clean');
  });
});
