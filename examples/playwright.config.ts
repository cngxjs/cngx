import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env['EXAMPLES_E2E_BASE_URL'] ?? 'http://localhost:4200';

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

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e-spec\.ts$/,

  // Ephemeral test artifacts (traces, failure screenshots) — gitignored.
  outputDir: '../.tmp/test-results',

  // Story tests touch shared overlay roots; keep serial within a file locally.
  // The CI shards pass --fully-parallel to split by test and run two workers,
  // each its own browser, so no two tests ever share a page.
  fullyParallel: false,

  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  // The retry stays as a flake diagnostic, but a pass on retry still fails the
  // job: otherwise an intermittent console-guard hit would go green as flaky.
  failOnFlakyTests: !!process.env['CI'],
  workers: process.env['CI'] ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: '../.tmp/playwright-report', open: 'never' }],
  ],

  expect: {
    // Visual baselines live next to the spec and are committed.
    // A small tolerance keeps anti-aliasing noise from breaking the suite.
    toHaveScreenshot: {
      // 5% tolerance absorbs sub-pixel anti-aliasing flake observed when
      // running the full 335-test suite sequentially.
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

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
  ],

  webServer: {
    command: 'npm run start:examples',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    cwd: '..',
  },
});
