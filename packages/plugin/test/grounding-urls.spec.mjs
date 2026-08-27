import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The published docs base URL is repeated across every grounding surface the
// plugin ships - skills, agents, the session hook, the README - because a
// markdown skill cannot import a constant. This spec is the drift guard that
// duplication otherwise lacks: if the docs base ever moves, one authoritative
// constant changes here and every stale occurrence turns the suite red, instead
// of ~14 files drifting apart silently.
const DOCS_BASE = 'https://cngxjs.github.io/cngx';
const LLMS_TXT = `${DOCS_BASE}/llms.txt`;
const LLMS_FULL = `${DOCS_BASE}/llms-full.txt`;

const here = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(here, '..');

function walk(dir, filter) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      files.push(...walk(abs, filter));
    } else if (entry.isFile() && filter(entry.name)) {
      files.push(abs);
    }
  }
  return files;
}

// Every file kind that carries grounding prose or emits grounding context.
const surfaces = [
  ...walk(join(pluginRoot, 'skills'), (name) => name.endsWith('.md')),
  ...walk(join(pluginRoot, 'agents'), (name) => name.endsWith('.md')),
  ...walk(join(pluginRoot, 'commands'), (name) => name.endsWith('.md')),
  join(pluginRoot, 'hooks', 'session-start.mjs'),
  join(pluginRoot, 'README.md'),
  join(pluginRoot, '.claude-plugin', 'plugin.json'),
];

describe('published docs URL is uniform across the grounding surface', () => {
  it('covers the surfaces this guard exists for', () => {
    // The glob found the skills and agents - an empty walk would make the
    // uniformity assertions below pass vacuously.
    expect(surfaces.filter((f) => f.includes('/skills/')).length).toBeGreaterThanOrEqual(10);
    expect(surfaces.filter((f) => f.includes('/agents/')).length).toBeGreaterThanOrEqual(3);
  });

  it.each(surfaces.map((file) => [file.slice(pluginRoot.length + 1), file]))(
    'every cngxjs.github.io occurrence in %s starts with the canonical base',
    (_rel, file) => {
      const text = readFileSync(file, 'utf8');
      for (const [url] of text.matchAll(/https?:\/\/cngxjs\.github\.io[^\s)'"`<>]*/g)) {
        expect(url.startsWith(DOCS_BASE)).toBe(true);
      }
    },
  );

  it('the session hook emits exactly the canonical llms pointers', () => {
    const hook = readFileSync(join(pluginRoot, 'hooks', 'session-start.mjs'), 'utf8');
    expect(hook).toContain(`'${LLMS_TXT}'`);
    expect(hook).toContain(`'${LLMS_FULL}'`);
  });

  it('every llms pointer in the markdown surfaces is one of the two canonical files', () => {
    for (const file of surfaces.filter((f) => f.endsWith('.md'))) {
      const text = readFileSync(file, 'utf8');
      for (const [url] of text.matchAll(/https?:\/\/cngxjs\.github\.io\/cngx\/llms[^\s)'"`<>]*/g)) {
        expect([LLMS_TXT, LLMS_FULL]).toContain(url);
      }
    }
  });
});
