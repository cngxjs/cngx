import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (...path) => readFileSync(join(ROOT, ...path), 'utf8');

describe('the Playwright install in ci', () => {
  const workflow = read('.github', 'workflows', 'ci.yml');
  const action = read('.github', 'actions', 'setup-playwright', 'action.yml');

  // --with-deps runs apt-get update, the step that took up to 9 minutes.
  it('never installs system deps through apt', () => {
    expect(workflow).not.toContain('--with-deps');
    expect(action).not.toContain('--with-deps');
    expect(action).toContain('run: npx playwright install chromium');
  });

  it('caches the browsers in the shared action only', () => {
    expect(action).toContain('path: ~/.cache/ms-playwright');
    expect(workflow).not.toContain('ms-playwright');
  });

  it.each(['geometry', 'e2e-shard', 'examples-e2e-shard', 'console-sweep-shard'])(
    'sets up chromium in %s through the shared action after npm ci',
    (job) => {
      const start = workflow.indexOf(`\n  ${job}:\n`);
      const end = workflow.indexOf('\n\n  ', start + 1);
      const block = workflow.slice(start, end);

      expect(start).toBeGreaterThan(-1);
      expect(block.indexOf('uses: ./.github/actions/setup-playwright')).toBeGreaterThan(block.indexOf('run: npm ci'));
    },
  );

  it('uses the shared action in exactly those four jobs', () => {
    expect(workflow.match(/uses: \.\/\.github\/actions\/setup-playwright/g)).toHaveLength(4);
  });
});
