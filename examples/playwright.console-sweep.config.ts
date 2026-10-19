import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env['EXAMPLES_E2E_BASE_URL'] ?? 'http://localhost:4200';

// Loads every example route once and fails on any console warning, console
// error or page error not on the allowlist (e2e-sweep/console-allowlist.ts).
// Kept apart from playwright.config.ts: one load per route, no interaction,
// fully parallel, and its own CI job.
export default defineConfig({
  testDir: './e2e-sweep',
  testMatch: /.*\.sweep-spec\.ts$/,

  outputDir: '../.tmp/sweep-results',

  // Each test is one fresh page load; nothing is shared between routes.
  fullyParallel: true,

  forbidOnly: !!process.env['CI'],
  // No retry: a line that fires on one run and not the next is an
  // intermittent warning, and a retry would hide it.
  retries: 0,
  workers: 4,

  reporter: [['list'], ['html', { outputFolder: '../.tmp/sweep-report', open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
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
