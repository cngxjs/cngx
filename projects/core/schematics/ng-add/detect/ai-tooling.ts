import { JSONFile } from '@schematics/angular/utility/json-file';

import { type AiTool, hasProvenanceStamp, isRecord, type Tree } from '../../engine';
import { type Read } from './workspace';

export interface EditorFacts {
  readonly claude: boolean;
  readonly cursor: boolean;
  readonly vscode: boolean;
}

/** Where each editor reads a project-local MCP server, and under which key. */
export const MCP_CONFIGS: Readonly<Record<AiTool, { readonly path: string; readonly key: string }>> = {
  claude: { path: '.mcp.json', key: 'mcpServers' },
  cursor: { path: '.cursor/mcp.json', key: 'mcpServers' },
  vscode: { path: '.vscode/mcp.json', key: 'servers' },
};

/**
 * An editor's MCP config: missing, present without a `cngx` server, already
 * declaring one, or not JSON cngx can edit.
 */
export type McpConfigState = 'absent' | 'present' | 'wired' | 'invalid';

/** The helper README the AI tooling step writes. */
export const HELPER_README_PATH = '.cngx/README.md';

export interface HelperReadmeFacts {
  /** It starts with a cngx provenance stamp; otherwise someone else wrote it. */
  readonly generated: boolean;
  /** The fingerprint of the render cngx wrote; `undefined` when the file carries none. */
  readonly fingerprint: string | undefined;
}

/**
 * Records the fingerprint of the rendered README in the file itself. The CLI
 * may run the app's Prettier over generated files, so hashing what is on disk
 * would read a formatted current README as stale; the comment line survives.
 */
export function helperReadmeFingerprintLine(fingerprint: string): string {
  return `<!-- cngx:fingerprint ${fingerprint} -->`;
}

const FINGERPRINT_LINE = /<!-- cngx:fingerprint ([0-9a-f]{8}) -->/;

/** An agent instruction file: missing, present, or already carrying the cngx block. */
export type InstructionState = 'absent' | 'present' | 'wired';

export interface ClaudeInstructions {
  readonly path: 'CLAUDE.md' | '.claude/CLAUDE.md';
  readonly state: Exclude<InstructionState, 'absent'>;
}

/** Opens the block cngx writes into agent instruction files; a later run finds it. */
export const AGENTS_MARKER = '<!-- cngx:agents -->';

export interface McpConfigFacts {
  readonly state: McpConfigState;
  readonly pin: string | undefined;
}

const MCP_PACKAGE = /^@cngx\/mcp@(.+)$/;

// The version an existing cngx entry runs, read from `npx -y @cngx/mcp@<v>`.
function mcpPinOf(entry: unknown): string | undefined {
  const args = isRecord(entry) ? entry['args'] : undefined;
  if (!Array.isArray(args)) {
    return undefined;
  }
  const match = args.map((arg) => (typeof arg === 'string' ? MCP_PACKAGE.exec(arg) : null)).find((found) => found !== null);
  return match?.[1];
}

// JSONFile reads JSONC, so a commented `.vscode/mcp.json` still counts as editable.
function mcpConfigOf(tree: Tree, path: string, key: string): McpConfigFacts {
  if (!tree.exists(path)) {
    return { state: 'absent', pin: undefined };
  }
  let root: unknown;
  try {
    root = new JSONFile(tree, path).get([]);
  } catch {
    return { state: 'invalid', pin: undefined };
  }
  const servers = isRecord(root) ? root[key] : undefined;
  if (!isRecord(root) || (servers !== undefined && !isRecord(servers))) {
    // Not an object cngx can add an entry to: the JSON write would throw at apply time.
    return { state: 'invalid', pin: undefined };
  }
  const entry = servers?.['cngx'];
  return entry === undefined ? { state: 'present', pin: undefined } : { state: 'wired', pin: mcpPinOf(entry) };
}

export function mcpConfigsOf(tree: Tree): Readonly<Record<AiTool, McpConfigFacts>> {
  return {
    claude: mcpConfigOf(tree, MCP_CONFIGS.claude.path, MCP_CONFIGS.claude.key),
    cursor: mcpConfigOf(tree, MCP_CONFIGS.cursor.path, MCP_CONFIGS.cursor.key),
    vscode: mcpConfigOf(tree, MCP_CONFIGS.vscode.path, MCP_CONFIGS.vscode.key),
  };
}

export function instructionState(read: Read, path: string): InstructionState {
  const content = read(path);
  if (content === undefined) {
    return 'absent';
  }
  return content.includes(AGENTS_MARKER) ? 'wired' : 'present';
}

export function claudeInstructionsOf(read: Read): ClaudeInstructions | undefined {
  for (const path of ['CLAUDE.md', '.claude/CLAUDE.md'] as const) {
    const state = instructionState(read, path);
    if (state !== 'absent') {
      return { path, state };
    }
  }
  return undefined;
}

export function helperReadmeOf(read: Read): HelperReadmeFacts | undefined {
  const content = read(HELPER_README_PATH);
  return content === undefined
    ? undefined
    : { generated: hasProvenanceStamp(content), fingerprint: FINGERPRINT_LINE.exec(content)?.[1] };
}

export function hasEntries(tree: Tree, dir: string): boolean {
  const entry = tree.getDir(dir);
  return entry.subfiles.length > 0 || entry.subdirs.length > 0;
}
