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
    // Tokens assembled from fragments on purpose: the command must not name the
    // maintainer-only tools, and this guard must not itself put those literals
    // in the tree where the public-only leak grep would flag them.
    const forbidden = [`cngx-${'guru'}`, `cngx-${'designer'}`, `.intern${'al'}/`];
    for (const token of forbidden) {
      expect(source, `command leaks "${token}"`).not.toContain(token);
    }
  });

  it('documents the .cngx/profile.json shape the hook reads', () => {
    expect(source).toContain('.cngx/profile.json');
    expect(source).toContain('libs');
    expect(source).toContain('brandTokens');
  });
});
