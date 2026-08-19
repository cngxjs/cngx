import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(here, '..');
const skillsRoot = resolve(pluginRoot, 'skills');

// Every skill Claude Code auto-discovers under skills/<name>/SKILL.md. Glob so
// this guard covers each skill as it lands, with no per-skill wiring.
const skillDirs = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const frontmatterOf = (source) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  return match ? match[1] : null;
};

const bodyOf = (source) => source.replace(/^---\n[\s\S]*?\n---/, '');

// Tokens assembled from fragments on purpose: the guard must not itself carry
// the maintainer-internal literals verbatim (mirrors command-cngx-init.spec).
const FORBIDDEN = [
  `cngx-${'guru'}`,
  `cngx-${'designer'}`,
  `.intern${'al'}/`,
  'localhost',
];

// The one drift-prone literal a thin router must never carry: a hardcoded
// count of slots or tokens. The concrete list lives behind the MCP tools.
const COUNT_LITERAL = /\b\d+\s+(template\s+)?(slots?|(di\s+)?tokens?)\b/i;

const RECIPE_REF = /pack\/recipes\/[\w-]+\.md/g;

it('discovers at least the index skill', () => {
  expect(skillDirs).toContain('cngx');
});

describe.each(skillDirs)('skill %s', (name) => {
  const skillPath = resolve(skillsRoot, name, 'SKILL.md');
  const source = existsSync(skillPath) ? readFileSync(skillPath, 'utf8') : '';

  it('has a SKILL.md', () => {
    expect(existsSync(skillPath), `${name}/SKILL.md is missing`).toBe(true);
  });

  it('opens with frontmatter carrying a non-empty name and description', () => {
    const frontmatter = frontmatterOf(source);
    expect(frontmatter, `${name}: missing frontmatter block`).not.toBeNull();
    expect(frontmatter).toMatch(/name:\s*\S/);
    expect(frontmatter).toMatch(/description:\s*\S/);
  });

  it('declares a name equal to its directory', () => {
    const frontmatter = frontmatterOf(source) ?? '';
    const declared = /name:\s*(\S+)/.exec(frontmatter)?.[1];
    expect(declared, `${name}: no name in frontmatter`).toBeDefined();
    expect(declared).toBe(name);
  });

  it('carries no maintainer-internal leak', () => {
    for (const token of FORBIDDEN) {
      expect(source, `${name} leaks "${token}"`).not.toContain(token);
    }
  });

  it('references only recipe paths that resolve on disk', () => {
    const refs = bodyOf(source).match(RECIPE_REF) ?? [];
    for (const ref of refs) {
      const resolved = resolve(pluginRoot, ref);
      expect(existsSync(resolved), `${name} cites a dangling recipe: ${ref}`).toBe(true);
    }
  });

  it('carries no hardcoded slot or token count (thin-router invariant)', () => {
    const match = COUNT_LITERAL.exec(bodyOf(source));
    expect(match, `${name} hardcodes a drift-prone count: "${match?.[0]}"`).toBeNull();
  });
});
