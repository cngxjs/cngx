import { describe, expect, it } from 'vitest';

import { createFixtureTree } from '../../testing/run-schematic';
import { claudeInstructionsOf, helperReadmeOf, instructionState, mcpConfigsOf } from './ai-tooling';
import { type Read } from './workspace';

function readerOf(files: Readonly<Record<string, string>>): Read {
  return (path) => files[path];
}

function statesOf(files: Readonly<Record<string, string>>) {
  const configs = mcpConfigsOf(createFixtureTree('standalone-app', files));
  return { claude: configs.claude.state, cursor: configs.cursor.state, vscode: configs.vscode.state };
}

describe('mcpConfigsOf', () => {
  it('reads each editor mcp config under its own key, comments included', () => {
    expect(
      statesOf({
        '.mcp.json': JSON.stringify({ mcpServers: { other: { command: 'other' } } }),
        '.cursor/mcp.json': JSON.stringify({ mcpServers: { cngx: { command: 'npx' } } }),
        '.vscode/mcp.json': '// workspace servers\n{ "servers": { "cngx": { "command": "npx" } } }',
      }),
    ).toEqual({ claude: 'present', cursor: 'wired', vscode: 'wired' });
  });

  it('does not take a cngx server under the wrong key as wired', () => {
    expect(statesOf({ '.vscode/mcp.json': JSON.stringify({ mcpServers: { cngx: {} } }) }).vscode).toBe('present');
  });

  it('marks an mcp config that is not a JSON object as invalid', () => {
    expect(statesOf({ '.mcp.json': '{ "mcpServers": ', '.cursor/mcp.json': '[]' })).toMatchObject({
      claude: 'invalid',
      cursor: 'invalid',
    });
  });

  it('reads the @cngx/mcp version an existing cngx entry pins', () => {
    const configs = mcpConfigsOf(
      createFixtureTree('standalone-app', {
        '.mcp.json': JSON.stringify({ mcpServers: { cngx: { command: 'npx', args: ['-y', '@cngx/mcp@0.2.0'] } } }),
        '.vscode/mcp.json': JSON.stringify({ servers: { cngx: { command: 'cngx-mcp' } } }),
      }),
    );
    expect({ claude: configs.claude.pin, cursor: configs.cursor.pin, vscode: configs.vscode.pin }).toEqual({
      claude: '0.2.0',
      cursor: undefined,
      vscode: undefined,
    });
  });

  it('marks a servers key cngx cannot add an entry to as invalid', () => {
    expect(
      statesOf({
        '.mcp.json': JSON.stringify({ mcpServers: null }),
        '.cursor/mcp.json': JSON.stringify({ mcpServers: 'none' }),
        '.vscode/mcp.json': JSON.stringify({ servers: [] }),
      }),
    ).toEqual({ claude: 'invalid', cursor: 'invalid', vscode: 'invalid' });
  });
});

describe('agent instructions', () => {
  it('finds the cngx block in AGENTS.md', () => {
    expect(instructionState(readerOf({ 'AGENTS.md': '# Agents\n' }), 'AGENTS.md')).toBe('present');
    expect(instructionState(readerOf({ 'AGENTS.md': '# Agents\n<!-- cngx:agents -->\n' }), 'AGENTS.md')).toBe('wired');
  });

  it('finds the Claude Code instructions in the root first, then where ng new --ai-config puts them', () => {
    expect(claudeInstructionsOf(readerOf({ '.claude/CLAUDE.md': '# Rules\n' }))).toEqual({
      path: '.claude/CLAUDE.md',
      state: 'present',
    });
    expect(
      claudeInstructionsOf(readerOf({ 'CLAUDE.md': '<!-- cngx:agents -->\n', '.claude/CLAUDE.md': '# Rules\n' })),
    ).toEqual({ path: 'CLAUDE.md', state: 'wired' });
  });
});

describe('helperReadmeOf', () => {
  it('tells a generated helper readme from one someone else wrote', () => {
    const generated = helperReadmeOf(readerOf({ '.cngx/README.md': '<!-- cngx:generated 0123abcd -->\n# cngx\n' }));
    const foreign = helperReadmeOf(readerOf({ '.cngx/README.md': '# Notes\n' }));

    expect(generated).toEqual({ generated: true, fingerprint: undefined });
    expect(foreign?.generated).toBe(false);
  });

  it('reads the recorded fingerprint, whatever a formatter or a CRLF checkout did to the body', () => {
    const readme = '<!-- cngx:generated 0123abcd -->\r\n<!-- cngx:fingerprint 89abcdef -->\r\n\r\n| Tool  |\r\n| ----- |\r\n';

    expect(helperReadmeOf(readerOf({ '.cngx/README.md': readme }))).toEqual({ generated: true, fingerprint: '89abcdef' });
  });
});
