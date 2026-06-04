import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env['EXAMPLES_E2E_BASE_URL'] ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e-spec\.ts$/,

  // Ephemeral test artifacts (traces, failure screenshots) — gitignored.
  outputDir: '../.tmp/test-results',

  // Story tests touch shared overlay roots; keep serial within a file.
  fullyParallel: false,

  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 1 : undefined,

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
