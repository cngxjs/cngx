import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, '../commands/cngx-init.md'), 'utf8');

describe('cngx-init command', () => {
  it('opens with YAML frontmatter carrying a description', () => {
    const frontmatter = /^---\n([\s\S]*?)\n---/.exec(source);
    expect(frontmatter, 'missing frontmatter block').not.toBeNull();
    expect(frontmatter[1]).toMatch(/description:\s*\S/);
  });

  it('references no maintainer-internal tool', () => {
    expect(source).not.toMatch(/cngx-guru|cngx-designer|\.internal\//);
  });

  it('documents the .cngx/profile.json shape the hook reads', () => {
    expect(source).toContain('.cngx/profile.json');
    expect(source).toContain('libs');
    expect(source).toContain('brandTokens');
  });
});
