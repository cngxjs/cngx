import { describe, expect, it } from 'vitest';

import { type EditFile } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { fillTemplate, planHelperReadme, renderHelperReadme } from './helper-readme';
import { MCP_TOOLS } from './mcp-capabilities.generated';

const AI_ANSWERS = createAnswers({ aiTools: ['claude', 'vscode'] });

// What detection reads back from the README this spec's answers render.
function recordedFingerprint(): string | undefined {
  return /<!-- cngx:fingerprint ([0-9a-f]{8}) -->/.exec(renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS))?.[1];
}

describe('fillTemplate', () => {
  it('fills every placeholder', () => {
    expect(fillTemplate('{{a}} and {{b}}', { a: '1', b: '2' })).toBe('1 and 2');
  });

  it('refuses a placeholder without a value', () => {
    expect(() => fillTemplate('{{missing}}', {})).toThrow('helper-readme.md.tpl uses {{missing}}, which has no value.');
  });
});

describe('renderHelperReadme', () => {
  it('renders the stamped readme for the chosen editors', () => {
    expect(renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS)).toMatchSnapshot();
  });

  it('lists every generated tool with its example question', () => {
    const readme = renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS);

    for (const tool of MCP_TOOLS) {
      expect(readme).toContain(`|\`${tool.name}\`|${tool.title}|${tool.example}|`);
    }
  });

  it('writes every table dense: no cell padding, minimal separators', () => {
    const readme = renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS);
    const tableLines = readme.split('\n').filter((line) => line.startsWith('|'));

    expect(tableLines.length).toBeGreaterThan(0);
    for (const line of tableLines) {
      expect(line).not.toMatch(/(?<!\\)\| | \|/);
    }
    for (const separator of tableLines.filter((line) => /^\|[-:| ]+\|$/.test(line))) {
      expect(separator).toMatch(/^\|(-\|)+$/);
    }
  });

  it('starts with an html provenance stamp and leaves no placeholder behind', () => {
    const readme = renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS);

    expect(readme).toMatch(
      /^<!-- cngx:generated [0-9a-f]{8} -->\n<!-- ng-add, @cngx 0\.1\.0 -->\n<!-- cngx:fingerprint [0-9a-f]{8} -->\n\n# cngx/,
    );
    expect(readme).not.toMatch(/\{\{\w+\}\}/);
    expect(readme).not.toContain(String.fromCodePoint(0x2014));
  });

  it('lists only the configs of the chosen editors', () => {
    const readme = renderHelperReadme(createFacts(), createAnswers({ aiTools: ['cursor'] }), VERSIONS);

    expect(readme).toContain('- `.cursor/mcp.json`');
    expect(readme).not.toContain('- `.mcp.json`');
    expect(readme).toContain('Cursor: open Cursor Settings');
    expect(readme).not.toContain('claude mcp list');
  });

  it('lists a config cngx could not edit with what to do instead of as configured', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'invalid' } });
    const readme = renderHelperReadme(facts, AI_ANSWERS, VERSIONS);

    expect(readme).toContain('- `.mcp.json`\n- `.vscode/mcp.json`: no `servers` object cngx can add to; add `servers.cngx` by hand\n');
  });

  it('leaves out an editor whose cngx server the user removed', () => {
    const readme = renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS, new Set(['ai-tools:claude']));

    expect(readme).toContain('- `.vscode/mcp.json`');
    expect(readme).not.toContain('- `.mcp.json`');
    expect(readme).not.toContain('claude mcp list');
  });

  it('keeps an editor whose config still declares a cngx server when this run does not choose it', () => {
    const facts = createFacts({
      mcpConfigs: { claude: 'wired', cursor: 'absent', vscode: 'absent' },
      mcpPins: { claude: '0.3.0', cursor: undefined, vscode: undefined },
    });
    const readme = renderHelperReadme(facts, createAnswers({ aiTools: ['vscode'] }), VERSIONS);

    expect(readme).toContain('- `.mcp.json`\n- `.vscode/mcp.json`\n');
    expect(readme).toContain('claude mcp list');
    expect(readme).toContain('## Claude Code plugin');
  });

  it('names the version an existing entry runs when it differs from this release', () => {
    const facts = createFacts({
      mcpConfigs: { claude: 'wired', cursor: 'wired', vscode: 'absent' },
      mcpPins: { claude: '0.2.0', cursor: undefined, vscode: undefined },
    });
    const readme = renderHelperReadme(facts, createAnswers({ aiTools: ['claude', 'cursor'] }), VERSIONS);

    expect(readme).toContain('- `.mcp.json`: its own cngx entry, running `@cngx/mcp@0.2.0`\n');
    expect(readme).toContain('- `.cursor/mcp.json`: its own cngx entry, running no `@cngx/mcp` version cngx can read\n');
  });

  it('says that a removal is remembered and how to bring the server back', () => {
    const readme = renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS);

    expect(readme).toContain('A later `ng add` remembers the removal through `.cngx/install.json`');
    expect(readme).toContain('`ng add` with the editor named, for example `--ai-tools claude`.');
  });

  it('describes the Claude Code plugin only when Claude Code is chosen', () => {
    const withClaude = renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS);
    const withoutClaude = renderHelperReadme(createFacts(), createAnswers({ aiTools: ['cursor'] }), VERSIONS);

    expect(withClaude).toContain('delete\nthe `cngx` entry from `.mcp.json`, so Claude Code runs one cngx server, not two.');
    expect(withoutClaude).not.toContain('## Claude Code plugin');
    expect(withoutClaude).toContain('for example `--ai-tools claude`.\n\n## Clients outside this project');
  });
});

describe('planHelperReadme', () => {
  it('plans nothing without an editor', () => {
    expect(planHelperReadme(createFacts(), createAnswers(), VERSIONS)).toEqual({ changes: [], skipped: [] });
  });

  it('writes the readme for a configured editor even when this run chose none', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'wired' } });

    expect(planHelperReadme(facts, createAnswers(), VERSIONS).changes).toEqual([
      expect.objectContaining({ kind: 'create-file', path: '.cngx/README.md' }),
    ]);
  });

  it('creates the readme when there is none', () => {
    const [change] = planHelperReadme(createFacts(), AI_ANSWERS, VERSIONS).changes;

    expect(change).toMatchObject({
      kind: 'create-file',
      id: 'helper-readme:file',
      path: '.cngx/README.md',
      content: renderHelperReadme(createFacts(), AI_ANSWERS, VERSIONS),
    });
  });

  it('skips a generated readme whose recorded fingerprint matches the render', () => {
    const facts = createFacts({ helperReadme: { generated: true, fingerprint: recordedFingerprint() } });

    expect(planHelperReadme(facts, AI_ANSWERS, VERSIONS)).toEqual({
      changes: [],
      skipped: [{ id: 'helper-readme:file', label: 'Update .cngx/README.md', reason: 'already up to date' }],
    });
  });

  it('regenerates a generated readme that records no fingerprint', () => {
    const facts = createFacts({ helperReadme: { generated: true, fingerprint: undefined } });

    expect(planHelperReadme(facts, AI_ANSWERS, VERSIONS).changes).toEqual([
      expect.objectContaining({ kind: 'edit-file', path: '.cngx/README.md' }),
    ]);
  });

  it('regenerates a generated readme whose inputs moved', () => {
    const facts = createFacts({ helperReadme: { generated: true, fingerprint: '00000000' } });
    const [change] = planHelperReadme(facts, AI_ANSWERS, { ...VERSIONS, mcp: '0.4.0' }).changes as EditFile[];

    expect(change).toMatchObject({ kind: 'edit-file', path: '.cngx/README.md' });
    expect(change?.edit('old')).toContain('@cngx/mcp@0.4.0');
  });

  it('leaves a readme cngx did not write alone and says so', () => {
    const facts = createFacts({ helperReadme: { generated: false, fingerprint: '00000000' } });

    expect(planHelperReadme(facts, AI_ANSWERS, VERSIONS).changes).toEqual([
      expect.objectContaining({
        kind: 'note',
        label: 'Skip .cngx/README.md',
        reason: '.cngx/README.md exists and cngx did not write it; it is left as it is',
      }),
    ]);
  });

  it('does not mutate its inputs', () => {
    expect(() => planHelperReadme(deepFreeze(createFacts()), deepFreeze(AI_ANSWERS), deepFreeze(VERSIONS))).not.toThrow();
  });
});
