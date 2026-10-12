import { describe, expect, it } from 'vitest';

import { type EditFile } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { instructionTargets, planAiTools, withdrawnAiTargets } from './ai-tools';

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

  it('names a different pin of an existing cngx entry instead of rewriting it', () => {
    const facts = createFacts({
      mcpConfigs: { claude: 'wired', cursor: 'absent', vscode: 'absent' },
      mcpPins: { claude: '0.2.0', cursor: undefined, vscode: undefined },
    });
    const result = planAiTools(facts, createAnswers({ aiTools: ['claude'] }), VERSIONS);

    expect(result.skipped).toContainEqual(
      expect.objectContaining({
        id: 'ai-tools:claude',
        reason: '.mcp.json already declares a cngx server, pinned to @cngx/mcp@0.2.0 (this release pins 0.3.0)',
      }),
    );
  });

  it('says so instead of editing a config that is not a JSON object', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'invalid' } });
    const [change] = planAiTools(facts, createAnswers({ aiTools: ['vscode'] }), VERSIONS).changes;

    expect(change).toMatchObject({
      kind: 'note',
      id: 'ai-tools:vscode',
      label: 'Skip .vscode/mcp.json',
      reason: 'it has no servers object cngx can add to; add servers.cngx by hand',
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

  it('leaves the plugin to the readme, so a run never plans a second cngx server', () => {
    const result = planAiTools(createFacts(), createAnswers({ aiTools: ['claude'] }), VERSIONS);

    expect(result.changes.map((change) => change.id)).toEqual(['ai-tools:claude', 'ai-tools:agents']);
  });

  it('puts the block where Claude Code reads it and skips AGENTS.md for Claude alone', () => {
    const facts = createFacts({ claudeInstructions: { path: '.claude/CLAUDE.md', state: 'present' } });
    const result = planAiTools(facts, createAnswers({ aiTools: ['claude'] }), VERSIONS);

    expect(result.changes).toContainEqual(
      expect.objectContaining({
        kind: 'edit-file',
        id: 'ai-tools:claude-instructions',
        path: '.claude/CLAUDE.md',
        label: 'Point .claude/CLAUDE.md at the cngx MCP server',
        reason: 'read by Claude Code',
      }),
    );
    expect(result.changes.some((change) => change.id === 'ai-tools:agents')).toBe(false);
  });

  it('skips a Claude instruction file that already carries the block', () => {
    const facts = createFacts({ claudeInstructions: { path: 'CLAUDE.md', state: 'wired' } });
    const result = planAiTools(facts, createAnswers({ aiTools: ['claude'] }), VERSIONS);

    expect(result.skipped).toContainEqual(
      expect.objectContaining({ id: 'ai-tools:claude-instructions', reason: 'CLAUDE.md already carries the cngx block' }),
    );
  });

  describe('instructionTargets', () => {
    it('serves Claude Code through AGENTS.md when the app has no CLAUDE.md', () => {
      expect(instructionTargets(createFacts(), createAnswers({ aiTools: ['claude', 'cursor'] }))).toEqual([
        { id: 'ai-tools:agents', path: 'AGENTS.md', state: 'absent', readers: ['claude', 'cursor'] },
      ]);
    });

    it('gives Claude Code its own file and AGENTS.md the other editors', () => {
      const facts = createFacts({ claudeInstructions: { path: 'CLAUDE.md', state: 'present' }, agentsMd: 'present' });

      expect(instructionTargets(facts, createAnswers({ aiTools: ['claude', 'vscode'] }))).toEqual([
        { id: 'ai-tools:claude-instructions', path: 'CLAUDE.md', state: 'present', readers: ['claude'] },
        { id: 'ai-tools:agents', path: 'AGENTS.md', state: 'present', readers: ['vscode'] },
      ]);
    });

    it('ignores a CLAUDE.md when Claude Code was not chosen', () => {
      const facts = createFacts({ claudeInstructions: { path: 'CLAUDE.md', state: 'present' } });

      expect(instructionTargets(facts, createAnswers({ aiTools: ['cursor'] })).map((target) => target.path)).toEqual([
        'AGENTS.md',
      ]);
    });
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

describe('withdrawnAiTargets', () => {
  const ALL = createAnswers({ aiTools: ['claude', 'cursor', 'vscode'] });
  const INSTALLED = ['ai-tools:claude', 'ai-tools:cursor', 'ai-tools:agents'];

  it('reads a recorded MCP entry that is gone as removed by the user', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'absent', cursor: 'wired', vscode: 'absent' }, agentsMd: 'wired' });

    expect([...withdrawnAiTargets(facts, ALL, INSTALLED, [])]).toEqual(['ai-tools:claude']);
  });

  it('reads a recorded agent block that is gone as removed, whether the file stays or not', () => {
    const wired = { claude: 'wired', cursor: 'wired', vscode: 'absent' } as const;

    expect([...withdrawnAiTargets(createFacts({ mcpConfigs: wired, agentsMd: 'present' }), ALL, INSTALLED, [])]).toEqual([
      'ai-tools:agents',
    ]);
    expect([...withdrawnAiTargets(createFacts({ mcpConfigs: wired, agentsMd: 'absent' }), ALL, INSTALLED, [])]).toEqual([
      'ai-tools:agents',
    ]);
  });

  it('withdraws nothing an explicit --ai-tools asks for again', () => {
    const facts = createFacts({ mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'absent' }, agentsMd: 'absent' });

    expect([...withdrawnAiTargets(facts, ALL, INSTALLED, ['claude'])]).toEqual(['ai-tools:cursor']);
  });

  it('withdraws nothing the last install did not record', () => {
    expect([...withdrawnAiTargets(createFacts(), ALL, [], [])]).toEqual([]);
  });
});

describe('planAiTools with withdrawn targets', () => {
  it('records a withdrawn target as left out instead of writing it again', () => {
    const answers = createAnswers({ aiTools: ['claude', 'cursor'] });
    const result = planAiTools(createFacts(), answers, VERSIONS, new Set(['ai-tools:claude', 'ai-tools:agents']));

    expect(result.changes.map((change) => [change.kind, change.id])).toEqual([
      ['note', 'ai-tools:claude'],
      ['write-json', 'ai-tools:cursor'],
      ['note', 'ai-tools:agents'],
    ]);
    expect(result.skipped).toEqual([
      {
        id: 'ai-tools:claude',
        label: 'Add the cngx MCP server to .mcp.json',
        reason: 'removed since the last install; pass --ai-tools claude to add it back',
      },
      {
        id: 'ai-tools:agents',
        label: 'Point AGENTS.md at the cngx MCP server',
        reason: 'removed since the last install; pass --ai-tools claude,cursor to add it back',
      },
    ]);
  });
});
