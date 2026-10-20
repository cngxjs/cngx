import { expect, test as guarded } from './_test';

// Proves the console guard in ./_test.ts bites: a planted line has to fail
// the test through the guard, a clean page has to pass. No demo route involved,
// so a story change cannot turn either case vacuous.

const PLANTED = 'planted by the console guard self-check';
const GUARD_ERROR = 'unlisted console lines during the test';

// A planted case is green only when the guard's own error names the planted
// line. `context` tears down after the guard (the guard depends on it), so its
// teardown sees that error. Otherwise the expected status is set to the
// opposite of the outcome: a case that passed (guard silent) or failed for
// another reason reddens.
const test = guarded.extend<{ expectGuardFailure: boolean }>({
  expectGuardFailure: [false, { option: true }],
  context: async ({ context, expectGuardFailure }, use, testInfo) => {
    await use(context);
    if (!expectGuardFailure) {
      return;
    }
    const byGuard = testInfo.errors.some(
      (error) => error.message?.includes(GUARD_ERROR) && error.message.includes(PLANTED),
    );
    const failedOtherwise = !byGuard && testInfo.errors.length > 0;
    testInfo.expectedStatus = failedOtherwise ? 'passed' : 'failed';
  },
});

test.describe('console guard: planted lines', () => {
  test.use({ expectGuardFailure: true });

  test('fails a test whose page logs an unlisted console.warn', async ({ page }) => {
    await page.setContent('<p>planted</p>');
    await page.evaluate((text) => console.warn(`CNGX0000: ${text}`), PLANTED);
    await expect(page.locator('p')).toHaveText('planted');
  });

  test('fails a test whose page throws an uncaught error', async ({ page }) => {
    await page.setContent('<p>planted</p>');
    await page.evaluate((text) => {
      setTimeout(() => {
        throw new Error(text);
      });
    }, PLANTED);
  });

  test('fails a test whose last action logs a warning one task later', async ({ page }) => {
    await page.setContent('<p>planted</p>');
    await page.evaluate((text) => {
      setTimeout(() => console.warn(`CNGX0000: ${text}`));
    }, PLANTED);
  });
});

test.describe('console guard: clean page', () => {
  test('passes a test whose page logs nothing on the guarded channels', async ({ page }) => {
    await page.setContent('<p>clean</p>');
    await page.evaluate(() => console.info('info is not a guarded channel'));
    await expect(page.locator('p')).toHaveText('clean');
  });
});
