import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { gateFailure } from '../e2e-gate.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('gateFailure', () => {
  it.each([
    ['success', 'all', 'success', undefined],
    ['success', 'some', 'success', undefined],
    ['success', 'none', 'skipped', undefined],
    ['success', 'some', 'skipped', 'the shards ended with "skipped" (scope some)'],
    ['success', 'all', 'failure', 'the shards ended with "failure" (scope all)'],
    ['success', 'all', 'cancelled', 'the shards ended with "cancelled" (scope all)'],
    ['failure', '', 'skipped', 'the e2e-scope job ended with "failure"'],
  ])('scope %s, mode %s, shards %s', (scope, mode, shards, failure) => {
    expect(gateFailure(scope, mode, shards)).toBe(failure);
  });
});

describe('the ci workflow', () => {
  const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');

  // Branch protection requires these names; the shard jobs report under
  // their expanded matrix names, so the gate jobs carry them.
  it.each(['examples-e2e', 'console-sweep'])('keeps the required check %s as a gate over its shards', (job) => {
    const block = workflow.slice(workflow.indexOf(`\n  ${job}:\n`), workflow.indexOf(`\n  ${job}:\n`) + 600);

    expect(block).toContain(`needs: [e2e-scope, ${job}-shard]`);
    expect(block).toContain('if: ${{ !cancelled() }}');
    expect(block).toContain('node scripts/e2e-gate.mjs');
  });

  it('shards both suites by the scope and asks the scope on pull requests only', () => {
    expect(workflow).toContain('node scripts/e2e-scope.mjs --base "$BASE_SHA"');
    expect(workflow).toContain('node scripts/e2e-scope.mjs --all');
    expect(workflow).toContain('fromJSON(needs.e2e-scope.outputs.examples-shards)');
    expect(workflow).toContain('fromJSON(needs.e2e-scope.outputs.sweep-shards)');
    expect(workflow.match(/--shard=\$\{\{ matrix\.shard \}\}\/\$\{\{ strategy\.job-total \}\}/g)).toHaveLength(3);
  });

  // The root suite has no scope: its gate needs only the shards, and a failed
  // build skips them, which the gate reports as red.
  it('keeps the required check e2e as a gate over the root suite shards', () => {
    const block = workflow.slice(workflow.indexOf('\n  e2e:\n'), workflow.indexOf('\n  e2e:\n') + 600);

    expect(block).toContain('needs: e2e-shard');
    expect(block).toContain('if: ${{ !cancelled() }}');
    expect(block).toContain('node scripts/e2e-gate.mjs success all "$SHARDS"');
    expect(gateFailure('success', 'all', 'skipped')).toBe('the shards ended with "skipped" (scope all)');
  });
});
