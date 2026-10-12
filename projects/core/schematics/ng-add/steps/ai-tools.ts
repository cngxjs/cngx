import { type JsonValue } from '@angular-devkit/core';

import {
  type AiTool,
  type Change,
  type Provenance,
  skipChange,
  type StepResult,
} from '../../engine';
import { AGENTS_MARKER, MCP_CONFIGS, type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';

const EDITOR_NAMES: Readonly<Record<AiTool, string>> = {
  claude: 'Claude Code',
  cursor: 'Cursor',
  vscode: 'VS Code',
};

// Claude Code reads the `.mcp.json` shape of packages/plugin; Cursor and
// VS Code name the transport explicitly.
function serverEntry(tool: AiTool, mcpVersion: string): JsonValue {
  const command = { command: 'npx', args: ['-y', `@cngx/mcp@${mcpVersion}`] };
  return tool === 'claude' ? command : { type: 'stdio', ...command };
}

function mcpConfig(tool: AiTool, facts: ProjectFacts, versions: Versions, provenance: Provenance): StepResult {
  const { path, key } = MCP_CONFIGS[tool];
  const state = facts.mcpConfigs[tool];
  const change: Change = {
    kind: 'write-json',
    id: `ai-tools:${tool}`,
    label: `Add the cngx MCP server to ${path}`,
    reason: `${EDITOR_NAMES[tool]} answers cngx questions from @cngx/mcp@${versions.mcp}`,
    provenance,
    path,
    entries: [[[key, 'cngx'], serverEntry(tool, versions.mcp)]],
  };
  if (state === 'wired') {
    return { changes: [], skipped: [skipChange(change, `${path} already declares a cngx server`)] };
  }
  if (state === 'invalid') {
    return {
      changes: [
        {
          kind: 'note',
          id: change.id,
          label: `Skip ${path}`,
          reason: `it is not a JSON object cngx can edit; add ${key}.cngx by hand`,
          provenance,
        },
      ],
      skipped: [],
    };
  }
  return { changes: [change], skipped: [] };
}

const AGENTS_BLOCK = [
  AGENTS_MARKER,
  '## cngx',
  '',
  'This app uses cngx (`@cngx/*`). Before writing cngx code, ask the `cngx` MCP',
  'server for the component, its inputs, slots, theme tokens and DI tokens',
  'instead of guessing an API. Docs: https://cngxjs.github.io/cngx/',
  '<!-- /cngx:agents -->',
  '',
].join('\n');

// One blank line between the user's last line and the block.
function blockSeparator(content: string): string {
  if (content === '' || content.endsWith('\n\n')) {
    return '';
  }
  return content.endsWith('\n') ? '\n' : '\n\n';
}

// Appended, never rewritten: an existing AGENTS.md keeps every line it had.
function appendAgentsBlock(content: string): string {
  if (content.includes(AGENTS_MARKER)) {
    return content;
  }
  return `${content}${blockSeparator(content)}${AGENTS_BLOCK}`;
}

function agentsMd(facts: ProjectFacts, provenance: Provenance): StepResult {
  const label = 'Point AGENTS.md at the cngx MCP server';
  const reason = 'agents that read AGENTS.md ground cngx answers in the server';
  if (facts.agentsMd === 'absent') {
    return {
      changes: [{ kind: 'create-file', id: 'ai-tools:agents', label, reason, provenance, path: 'AGENTS.md', content: AGENTS_BLOCK }],
      skipped: [],
    };
  }
  const change: Change = {
    kind: 'edit-file',
    id: 'ai-tools:agents',
    label,
    reason,
    provenance,
    path: 'AGENTS.md',
    edit: appendAgentsBlock,
  };
  return facts.agentsMd === 'wired'
    ? { changes: [], skipped: [skipChange(change, 'AGENTS.md already carries the cngx block')] }
    : { changes: [change], skipped: [] };
}

// A project cannot install a plugin for its users; the plugin brings the
// cngx skills on top of the MCP server, so the run says how to add it.
function claudePlugin(provenance: Provenance): Change {
  return {
    kind: 'note',
    id: 'ai-tools:claude-plugin',
    label: 'Add the cngx Claude Code plugin',
    reason: 'run `/plugin marketplace add cngxjs/cngx`, then `/plugin install cngx@cngxjs` in Claude Code',
    provenance,
  };
}

/**
 * Registers the pinned `@cngx/mcp` server in each chosen editor's
 * project-local config, next to any server already there, and adds a cngx
 * block to `AGENTS.md`. Nothing outside the project is written; an existing
 * `cngx` server entry and an existing `AGENTS.md` block are left as they are.
 */
export function planAiTools(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  if (answers.aiTools.length === 0) {
    return { changes: [], skipped: [] };
  }
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  const results = [
    ...answers.aiTools.map((tool) => mcpConfig(tool, facts, versions, provenance)),
    agentsMd(facts, provenance),
  ];
  const plugin = answers.aiTools.includes('claude') ? [claudePlugin(provenance)] : [];
  return {
    changes: [...results.flatMap((result) => result.changes), ...plugin],
    skipped: results.flatMap((result) => result.skipped),
  };
}
