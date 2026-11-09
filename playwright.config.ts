import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

/* Playwright's bundled Firefox probes the real macOS Firefox home folder on
   startup even when it is handed a throwaway -profile. On macOS 27 that folder
   is privacy-blocked, so the launch dies with the misleading
   "Could not find profile folder". Pointing CFFIXED_USER_HOME at a fresh,
   per-run temp dir gives CoreFoundation a home the test run owns and the
   launch succeeds. macOS-only (undefined elsewhere, so Linux CI is unchanged);
   removable once Playwright ships the Firefox 158 fix (>= 1.65). */
const firefoxMacHome =
  process.platform === 'darwin'
    ? mkdtempSync(join(tmpdir(), 'cngx-pw-firefox-home-'))
    : undefined;

const firefoxUse = firefoxMacHome
  ? {
      ...devices['Desktop Firefox'],
      launchOptions: {
        env: { ...process.env, CFFIXED_USER_HOME: firefoxMacHome } as Record<
          string,
          string
        >,
      },
    }
  : { ...devices['Desktop Firefox'] };

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Two workers on CI: the 4-vCPU runner serves `ng serve` and two browsers. */
  workers: process.env['CI'] ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4200',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* The examples app is the fixture for every spec in ./e2e, and until now
     each run silently depended on a dev server someone had started by hand.
     Locally an already-running `npm start` is reused; CI gets its own.

     `ng serve` rather than `npm start`, deliberately: the `prestart` hook
     re-runs `docs:json` over every project plus `examples:generate` before
     the server even boots, and CI has already done both two steps earlier.
     Paying for a second compodoc pass inside the server's start-up window
     is how a gate turns into a timeout. Run `npm run examples:generate`
     first when starting from a clean tree locally. */
  webServer: {
    command: 'npx ng serve examples',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: firefoxUse,
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
