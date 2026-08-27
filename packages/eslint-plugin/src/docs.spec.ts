import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RULE_METADATA } from './metadata';
import { plugin } from './plugin';

// Every rule's meta.docs.url points at docs/rules/<name>.md in this package.
// This guard keeps that promise mechanical: the page must exist on disk and the
// registered rule's URL must resolve to exactly that path - a renamed rule, a
// deleted page, or a changed URL builder turns the suite red instead of
// shipping lint reports that link to 404s.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(packageRoot, 'docs', 'rules');

const ruleIds = Object.keys(RULE_METADATA);

describe('per-rule doc pages', () => {
  it.each(ruleIds)('%s has a doc page whose title is the rule id', (id) => {
    const page = join(docsDir, `${id}.md`);
    expect(existsSync(page)).toBe(true);
    expect(readFileSync(page, 'utf8').startsWith(`# ${id}\n`)).toBe(true);
  });

  it.each(ruleIds)('%s registers a docs url that targets its page', (id) => {
    const rule = plugin.rules?.[id] as { meta?: { docs?: { url?: string } } } | undefined;
    expect(rule?.meta?.docs?.url).toBe(
      `https://github.com/cngxjs/cngx/blob/main/packages/eslint-plugin/docs/rules/${id}.md`,
    );
  });
});
