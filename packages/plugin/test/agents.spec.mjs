import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FORBIDDEN, bodyOf, frontmatterOf } from './guard-helpers.mjs';
import { DOCTOR_CHECK_METADATA } from '../bin/doctor/metadata.mjs';
import { RULE_METADATA } from '../../eslint-plugin/src/metadata/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(here, '..');
const agentsRoot = resolve(pluginRoot, 'agents');

// Every agent Claude Code auto-discovers under agents/<name>.md. Glob so this
// guard covers each agent as it lands, with no per-agent wiring - the same
// property skills.spec.mjs holds for skills.
const agentFiles = existsSync(agentsRoot)
  ? readdirSync(agentsRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort()
  : [];

// The read-only tool whitelist. An agent may only declare Read/Grep/Glob or a
// read-only cngx MCP query (mcp__cngx__*). A whitelist rejects any unknown
// future write-capable or agent-spawning tool a fixed denylist would miss.
const READ_ONLY_TOOL = /^(Read|Grep|Glob|mcp__cngx__[a-z0-9_]+)$/;

// The one shared id set both real sources define: the six @cngx/eslint-plugin
// rule ids and the three doctor check ids. Derived at test time from the actual
// metadata, so an agent citation can never drift out from under either source.
const RULE_IDS = new Set([...Object.keys(RULE_METADATA), ...Object.keys(DOCTOR_CHECK_METADATA)]);

// A rule-id citation is a backticked kebab token with at least two hyphens
// (three or more segments) - the shape every real id has. Incidental two-segment
// prose in backticks (read-only, two-way, opt-in, aria-describedby) has one
// hyphen and is not matched, so it is not treated as a citation.
const BACKTICKED = /`([^`]+)`/g;
const RULE_ID_SHAPE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){2,}$/;

const toolsOf = (frontmatter) => {
  const line = /tools:\s*(.+)/.exec(frontmatter ?? '')?.[1] ?? '';
  return line
    .split(',')
    .map((tool) => tool.trim())
    .filter(Boolean);
};

const citedRuleIds = (body) => {
  const ids = [];
  for (const [, token] of body.matchAll(BACKTICKED)) {
    if (RULE_ID_SHAPE.test(token)) {
      ids.push(token);
    }
  }
  return ids;
};

it('derives a non-empty shared rule-id set from both real sources', () => {
  expect(RULE_IDS.size).toBeGreaterThan(0);
});

// The citation matcher keys on RULE_ID_SHAPE (>=2 hyphens) to tell a rule-id
// citation from incidental two-segment prose (aria-describedby, opt-in). That is
// only sound while every real id has that shape. Assert it here so the day a
// one-hyphen id lands, this fails loud - instead of that id silently dropping out
// of every agent-body citation check.
it('every derived rule id has the shape the citation matcher keys on', () => {
  for (const id of RULE_IDS) {
    expect(id, `rule id "${id}" is shorter than the matcher's citation shape`).toMatch(
      RULE_ID_SHAPE,
    );
  }
});

describe.each(agentFiles)('agent %s', (fileName) => {
  const stem = fileName.replace(/\.md$/, '');
  const agentPath = resolve(agentsRoot, fileName);
  const source = readFileSync(agentPath, 'utf8');

  it('opens with frontmatter carrying a non-empty name and description', () => {
    const frontmatter = frontmatterOf(source);
    expect(frontmatter, `${fileName}: missing frontmatter block`).not.toBeNull();
    expect(frontmatter).toMatch(/name:\s*\S/);
    expect(frontmatter).toMatch(/description:\s*\S/);
  });

  it('declares a name equal to its filename stem', () => {
    const frontmatter = frontmatterOf(source) ?? '';
    const declared = /name:\s*(\S+)/.exec(frontmatter)?.[1];
    expect(declared, `${fileName}: no name in frontmatter`).toBeDefined();
    expect(declared).toBe(stem);
  });

  it('declares only read-only tools (Read/Grep/Glob or mcp__cngx__*)', () => {
    const tools = toolsOf(frontmatterOf(source));
    expect(tools.length, `${fileName}: no tools declared`).toBeGreaterThan(0);
    for (const tool of tools) {
      expect(READ_ONLY_TOOL.test(tool), `${fileName} declares a non-read-only tool: "${tool}"`).toBe(
        true,
      );
    }
  });

  it('carries no maintainer-internal leak', () => {
    for (const token of FORBIDDEN) {
      expect(source, `${fileName} leaks "${token}"`).not.toContain(token);
    }
  });

  it('cites only rule ids that resolve in the shared id set', () => {
    for (const id of citedRuleIds(bodyOf(source))) {
      expect(RULE_IDS.has(id), `${fileName} cites an unknown rule id: "${id}"`).toBe(true);
    }
  });
});
