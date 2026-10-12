import { type JsonValue } from '@angular-devkit/core';

import {
  type AiTool,
  type Change,
  joinNames,
  type Provenance,
  skipChange,
  type StepResult,
} from '../../engine';
import { AGENTS_MARKER, type InstructionState, MCP_CONFIGS, type ProjectFacts } from '../detect/detect';
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

// An existing entry is never rewritten; a different pin is named, not hidden.
function wiredReason(path: string, pin: string | undefined, mcpVersion: string): string {
  if (pin === undefined || pin === mcpVersion) {
    return `${path} already declares a cngx server`;
  }
  return `${path} already declares a cngx server, pinned to @cngx/mcp@${pin} (this release pins ${mcpVersion})`;
}

function aiToolId(tool: AiTool): string {
  return `ai-tools:${tool}`;
}

// A target the user removed stays out: recorded as skipped, so the manifest
// keeps the id and the next run still knows, and named in a note, since a
// collapsed skip line would not tell the user why their file stays as it is.
function withdrawnResult(change: Change, readers: readonly AiTool[], provenance: Provenance): StepResult {
  const reason = `removed since the last install; pass --ai-tools ${readers.join(',')} to add it back`;
  return {
    changes: [{ kind: 'note', id: change.id, label: `Leave out: ${change.label}`, reason, provenance }],
    skipped: [skipChange(change, reason)],
  };
}

function mcpConfig(
  tool: AiTool,
  facts: ProjectFacts,
  versions: Versions,
  provenance: Provenance,
  withdrawn: ReadonlySet<string>,
): StepResult {
  const { path, key } = MCP_CONFIGS[tool];
  const state = facts.mcpConfigs[tool];
  const change: Change = {
    kind: 'write-json',
    id: aiToolId(tool),
    label: `Add the cngx MCP server to ${path}`,
    reason: `${EDITOR_NAMES[tool]} answers cngx questions from @cngx/mcp@${versions.mcp}`,
    provenance,
    path,
    entries: [[[key, 'cngx'], serverEntry(tool, versions.mcp)]],
  };
  if (state === 'wired') {
    return { changes: [], skipped: [skipChange(change, wiredReason(path, facts.mcpPins[tool], versions.mcp))] };
  }
  if (withdrawn.has(change.id)) {
    return withdrawnResult(change, [tool], provenance);
  }
  if (state === 'invalid') {
    return {
      changes: [
        {
          kind: 'note',
          id: change.id,
          label: `Skip ${path}`,
          reason: `it has no ${key} object cngx can add to; add ${key}.cngx by hand`,
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

// Appended, never rewritten: an existing file keeps every line it had.
function appendAgentsBlock(content: string): string {
  if (content.includes(AGENTS_MARKER)) {
    return content;
  }
  return `${content}${blockSeparator(content)}${AGENTS_BLOCK}`;
}

/** A file the cngx block goes into, with the editors that read it. */
export interface InstructionTarget {
  readonly id: string;
  readonly path: string;
  readonly state: InstructionState;
  readonly readers: readonly AiTool[];
}

/**
 * One target per file an agent actually reads. Claude Code reads its own
 * `CLAUDE.md` (root or `.claude/`) and falls back to `AGENTS.md` only
 * without one; Cursor and VS Code read `AGENTS.md`. No `CLAUDE.md` is
 * created: without one, `AGENTS.md` serves Claude Code too.
 */
export function instructionTargets(facts: ProjectFacts, answers: OnboardingAnswers): readonly InstructionTarget[] {
  const claude = answers.aiTools.includes('claude') ? facts.claudeInstructions : undefined;
  const agentsReaders = answers.aiTools.filter((tool) => tool !== 'claude' || claude === undefined);
  const claudeTarget: readonly InstructionTarget[] =
    claude === undefined
      ? []
      : [{ id: 'ai-tools:claude-instructions', path: claude.path, state: claude.state, readers: ['claude'] }];
  const agentsTarget: readonly InstructionTarget[] =
    agentsReaders.length === 0
      ? []
      : [{ id: 'ai-tools:agents', path: 'AGENTS.md', state: facts.agentsMd, readers: agentsReaders }];
  return [...claudeTarget, ...agentsTarget];
}

function instructionBlock(target: InstructionTarget, provenance: Provenance, withdrawn: ReadonlySet<string>): StepResult {
  const { id, path } = target;
  const label = `Point ${path} at the cngx MCP server`;
  const reason = `read by ${joinNames(target.readers.map((tool) => EDITOR_NAMES[tool]))}`;
  const change: Change =
    target.state === 'absent'
      ? { kind: 'create-file', id, label, reason, provenance, path, content: AGENTS_BLOCK }
      : { kind: 'edit-file', id, label, reason, provenance, path, edit: appendAgentsBlock };
  if (target.state === 'wired') {
    return { changes: [], skipped: [skipChange(change, `${path} already carries the cngx block`)] };
  }
  if (withdrawn.has(id)) {
    return withdrawnResult(change, target.readers, provenance);
  }
  return { changes: [change], skipped: [] };
}

/**
 * The AI tooling targets the last install set up that are gone now: a
 * recorded cngx server entry or agent block the user removed. An editor
 * passed explicitly with `--ai-tools` is asked for again and never counts as
 * removed; a preset or prompt default does not tell a choice apart, so it
 * respects the removal.
 */
export function withdrawnAiTargets(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  installed: readonly string[],
  explicit: readonly AiTool[],
): ReadonlySet<string> {
  const recorded = new Set(installed);
  const asked = (readers: readonly AiTool[]): boolean => readers.some((tool) => explicit.includes(tool));
  const servers = answers.aiTools
    .filter((tool) => !asked([tool]))
    .filter((tool) => facts.mcpConfigs[tool] === 'absent' || facts.mcpConfigs[tool] === 'present')
    .map(aiToolId);
  const blocks = instructionTargets(facts, answers)
    .filter((target) => target.state !== 'wired' && !asked(target.readers))
    .map((target) => target.id);
  return new Set([...servers, ...blocks].filter((id) => recorded.has(id)));
}

/**
 * Registers the pinned `@cngx/mcp` server in each chosen editor's
 * project-local config, next to any server already there, and appends a
 * marked cngx block to each instruction file those editors read. Nothing
 * outside the project is written; an existing `cngx` server entry and an
 * existing block are left as they are, and a `withdrawn` one (see
 * `withdrawnAiTargets`) stays out.
 */
export function planAiTools(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  withdrawn: ReadonlySet<string> = new Set(),
): StepResult {
  if (answers.aiTools.length === 0) {
    return { changes: [], skipped: [] };
  }
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  const results = [
    ...answers.aiTools.map((tool) => mcpConfig(tool, facts, versions, provenance, withdrawn)),
    ...instructionTargets(facts, answers).map((target) => instructionBlock(target, provenance, withdrawn)),
  ];
  return {
    changes: results.flatMap((result) => result.changes),
    skipped: results.flatMap((result) => result.skipped),
  };
}
