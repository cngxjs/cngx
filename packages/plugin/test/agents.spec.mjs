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

// The executor tool class - the one exception to read-only-by-default. A named
// executor agent (EXECUTOR_AGENTS) may additionally declare the edit and shell
// tools an isolated-context migration executor needs. Read-only stays the default:
// an agent NOT in this set is still held to READ_ONLY_TOOL, so an unclassified
// future agent that declares a write tool still fails the guard. A per-class
// whitelist is stricter than dropping the guard and keeps the M7 safety property.
const EXECUTOR_AGENTS = new Set(['upgrader']);
const EXECUTOR_TOOL = /^(Read|Grep|Glob|Edit|Write|Bash|mcp__cngx__[a-z0-9_]+)$/;

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

// Read-only is the default. An agent not classified as an executor is held to the
// read-only whitelist, so a write/shell tool it declares must fail - the property
// M7 established and M8 must not drop while admitting the one audited executor. The
// same tools are legitimate only inside the classified executor class.
it('keeps read-only the default: an unclassified agent cannot declare a write tool', () => {
  const unclassified = 'unclassified-future-agent';
  expect(EXECUTOR_AGENTS.has(unclassified)).toBe(false);
  for (const writeTool of ['Edit', 'Write', 'Bash']) {
    expect(READ_ONLY_TOOL.test(writeTool), `${writeTool} must fail the default read-only whitelist`).toBe(false);
    expect(EXECUTOR_TOOL.test(writeTool), `${writeTool} must pass the executor whitelist`).toBe(true);
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

  it('declares only tools its class permits (read-only by default, executor if classified)', () => {
    const tools = toolsOf(frontmatterOf(source));
    expect(tools.length, `${fileName}: no tools declared`).toBeGreaterThan(0);
    const isExecutor = EXECUTOR_AGENTS.has(stem);
    const allowed = isExecutor ? EXECUTOR_TOOL : READ_ONLY_TOOL;
    for (const tool of tools) {
      expect(
        allowed.test(tool),
        `${fileName} (${isExecutor ? 'executor' : 'read-only'} class) declares a disallowed tool: "${tool}"`,
      ).toBe(true);
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
