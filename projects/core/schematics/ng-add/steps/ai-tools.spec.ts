import { describe, expect, it } from 'vitest';

import { type EditFile } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { planAiTools } from './ai-tools';

const NPX = { command: 'npx', args: ['-y', '@cngx/mcp@0.3.0'] };

describe('planAiTools', () => {
  it('plans nothing when no editor was asked for', () => {
    expect(planAiTools(createFacts(), createAnswers(), VERSIONS)).toEqual({ changes: [], skipped: [] });
  });

  it('registers the pinned server in each editor config under its own key', () => {
    const result = planAiTools(createFacts(), createAnswers({ aiTools: ['claude', 'cursor', 'vscode'] }), VERSIONS);

    expect(result.changes.filter((change) => change.kind === 'write-json')).toEqual([
      expect.objectContaining({ id: 'ai-tools:claude', path: '.mcp.json', entries: [[['mcpServers', 'cngx'], NPX]] }),
      expect.objectContaining({
        id: 'ai-tools:cursor',
        path: '.cursor/mcp.json',
        entries: [[['mcpServers', 'cngx'], { type: 'stdio', ...NPX }]],
      }),
      expect.objectContaining({
        id: 'ai-tools:vscode',
        path: '.vscode/mcp.json',
        entries: [[['servers', 'cngx'], { type: 'stdio', ...NPX }]],
      }),
    ]);
    expect(result.skipped).toEqual([]);
  });

  it('merges into an existing config without touching the servers already there', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'present', cursor: 'absent', vscode: 'absent' } });
    const [change] = planAiTools(facts, createAnswers({ aiTools: ['claude'] }), VERSIONS).changes;

    expect(change).toMatchObject({ kind: 'write-json', path: '.mcp.json', entries: [[['mcpServers', 'cngx'], NPX]] });
  });

  it('leaves an existing cngx server entry alone', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'wired', cursor: 'absent', vscode: 'absent' } });
    const result = planAiTools(facts, createAnswers({ aiTools: ['claude'] }), VERSIONS);

    expect(result.changes.some((change) => change.id === 'ai-tools:claude')).toBe(false);
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ id: 'ai-tools:claude', reason: '.mcp.json already declares a cngx server' }),
    );
  });

  it('says so instead of editing a config that is not a JSON object', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'invalid' } });
    const [change] = planAiTools(facts, createAnswers({ aiTools: ['vscode'] }), VERSIONS).changes;

    expect(change).toMatchObject({
      kind: 'note',
      id: 'ai-tools:vscode',
      label: 'Skip .vscode/mcp.json',
      reason: 'it is not a JSON object cngx can edit; add servers.cngx by hand',
    });
  });

  it('creates AGENTS.md with the marked cngx block when there is none', () => {
    const result = planAiTools(createFacts(), createAnswers({ aiTools: ['cursor'] }), VERSIONS);
    const agents = result.changes.find((change) => change.id === 'ai-tools:agents');

    expect(agents).toMatchObject({ kind: 'create-file', path: 'AGENTS.md' });
    expect(agents?.kind === 'create-file' && agents.content).toMatchInlineSnapshot(`
      "<!-- cngx:agents -->
      ## cngx

      This app uses cngx (\`@cngx/*\`). Before writing cngx code, ask the \`cngx\` MCP
      server for the component, its inputs, slots, theme tokens and DI tokens
      instead of guessing an API. Docs: https://cngxjs.github.io/cngx/
      <!-- /cngx:agents -->
      "
    `);
  });

  it('appends the block to an existing AGENTS.md and keeps every line it had', () => {
    const facts = createFacts({ agentsMd: 'present' });
    const agents = planAiTools(facts, createAnswers({ aiTools: ['cursor'] }), VERSIONS).changes.find(
      (change): change is EditFile => change.id === 'ai-tools:agents' && change.kind === 'edit-file',
    );

    const edited = agents?.edit('# Agents\nUse pnpm.') ?? '';
    expect(edited.startsWith('# Agents\nUse pnpm.\n\n<!-- cngx:agents -->\n')).toBe(true);
    expect(agents?.edit(edited)).toBe(edited);
  });

  it('skips AGENTS.md when it already carries the block', () => {
    const facts = createFacts({ agentsMd: 'wired' });
    const result = planAiTools(facts, createAnswers({ aiTools: ['cursor'] }), VERSIONS);

    expect(result.skipped).toContainEqual(expect.objectContaining({ id: 'ai-tools:agents' }));
  });

  it('tells a Claude Code user how to add the plugin, which a project cannot install', () => {
    const withClaude = planAiTools(createFacts(), createAnswers({ aiTools: ['claude'] }), VERSIONS);
    const withoutClaude = planAiTools(createFacts(), createAnswers({ aiTools: ['vscode'] }), VERSIONS);

    expect(withClaude.changes).toContainEqual(
      expect.objectContaining({
        kind: 'note',
        id: 'ai-tools:claude-plugin',
        reason: 'run `/plugin marketplace add cngxjs/cngx`, then `/plugin install cngx@cngxjs` in Claude Code',
      }),
    );
    expect(withoutClaude.changes.some((change) => change.id === 'ai-tools:claude-plugin')).toBe(false);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planAiTools(
        deepFreeze(createFacts({ agentsMd: 'present' })),
        deepFreeze(createAnswers({ aiTools: ['claude', 'cursor', 'vscode'] })),
        deepFreeze(VERSIONS),
      ),
    ).not.toThrow();
  });
});
