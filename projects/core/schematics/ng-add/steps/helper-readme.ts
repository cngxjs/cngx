import {
  type AiTool,
  type Change,
  contentFingerprint,
  createProvenanceStamp,
  type Provenance,
  skipChange,
  type StepResult,
} from '../../engine';
import { HELPER_README_PATH, MCP_CONFIGS, type ProjectFacts } from '../detect/detect';
// Sheriff resolves TypeScript modules only; the template is text, bundled by
// the esbuild text loader, so there is no module boundary to check.
// eslint-disable-next-line @softarc/sheriff/dependency-rule, @softarc/sheriff/encapsulation
import TEMPLATE from '../templates/helper-readme.md.tpl';
import { cngxPackages } from './dependencies';
import { MCP_PROMPTS, MCP_RESOURCES, MCP_TOOLS } from './mcp-capabilities.generated';
import { type OnboardingAnswers, type Versions } from './model';

const SOURCE = 'ng-add';

const VERIFY: Readonly<Record<AiTool, string>> = {
  claude: 'Claude Code: run `claude mcp list` in this folder; `cngx` is listed once you approve the project server.',
  cursor: 'Cursor: open Cursor Settings, MCP; `cngx` is listed under the project servers. Enable it there.',
  vscode: 'VS Code: run `MCP: List Servers` from the command palette and start `cngx`.',
};

// The plugin starts its own MCP server, pinned by the plugin release; with the
// project entry next to it Claude Code would run two cngx servers.
const CLAUDE_PLUGIN = [
  '## Claude Code plugin',
  '',
  'The cngx plugin adds cngx skills and edit checks to Claude Code and starts',
  'its own copy of the MCP server. To use it, run `/plugin marketplace add',
  'cngxjs/cngx`, then `/plugin install cngx@cngxjs` in Claude Code, and delete',
  'the `cngx` entry from `.mcp.json`, so Claude Code runs one cngx server, not two.',
  '',
  '',
].join('\n');

// A config the AI tooling step could not edit is listed with what to do,
// never as configured.
function configLine(tool: AiTool, facts: ProjectFacts): string {
  const { path, key } = MCP_CONFIGS[tool];
  return facts.mcpConfigs[tool] === 'invalid'
    ? `- \`${path}\`: not a JSON object cngx can edit; add \`${key}.cngx\` by hand`
    : `- \`${path}\``;
}

const cell = (text: string): string => text.replace(/\|/g, '\\|');

function row(cells: readonly string[]): string {
  return `| ${cells.map(cell).join(' | ')} |`;
}

/** Fills every `{{name}}`; a placeholder without a value is a template bug, not output. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = values[name];
    if (value === undefined) {
      throw new Error(`helper-readme.md.tpl uses {{${name}}}, which has no value.`);
    }
    return value;
  });
}

export function renderHelperReadme(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): string {
  const body = fillTemplate(TEMPLATE, {
    version: versions.cngx,
    mcpVersion: versions.mcp,
    packages: cngxPackages(answers)
      .map((name) => `- \`${name}@${versions.cngx}\``)
      .join('\n'),
    configs: answers.aiTools.map((tool) => configLine(tool, facts)).join('\n'),
    instructions: '`AGENTS.md`',
    tools: MCP_TOOLS.map((tool) => row([`\`${tool.name}\``, tool.title, tool.example])).join('\n'),
    resources: MCP_RESOURCES.map((resource) => row([`\`${resource.uri}\``, resource.description])).join('\n'),
    prompts: MCP_PROMPTS.map((prompt) => row([`\`${prompt.name}\``, prompt.description])).join('\n'),
    verify: answers.aiTools.map((tool) => `- ${VERIFY[tool]}`).join('\n'),
    plugin: answers.aiTools.includes('claude') ? CLAUDE_PLUGIN : '',
  });
  return `${createProvenanceStamp(SOURCE, versions.cngx, 'html')}\n${body}`;
}

/**
 * `.cngx/README.md`: what was installed, where the MCP server is configured,
 * what it answers and how to check or remove it. Written with the AI tooling,
 * regenerated when its inputs change, and never written over a file cngx did
 * not generate.
 */
export function planHelperReadme(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  if (answers.aiTools.length === 0) {
    return { changes: [], skipped: [] };
  }
  const provenance: Provenance = { source: SOURCE, version: versions.cngx };
  const content = renderHelperReadme(facts, answers, versions);
  const existing = facts.helperReadme;
  const base = {
    id: 'helper-readme:file',
    reason: 'what cngx installed and what the MCP server answers',
    provenance,
  };
  if (existing === undefined) {
    return {
      changes: [{ ...base, kind: 'create-file', label: `Create ${HELPER_README_PATH}`, path: HELPER_README_PATH, content }],
      skipped: [],
    };
  }
  if (!existing.generated) {
    return {
      changes: [
        {
          ...base,
          kind: 'note',
          label: `Skip ${HELPER_README_PATH}`,
          reason: `${HELPER_README_PATH} exists and cngx did not write it; it is left as it is`,
        },
      ],
      skipped: [],
    };
  }
  const update: Change = {
    ...base,
    kind: 'edit-file',
    label: `Update ${HELPER_README_PATH}`,
    path: HELPER_README_PATH,
    edit: () => content,
  };
  return existing.fingerprint === contentFingerprint(content)
    ? { changes: [], skipped: [skipChange(update, 'already up to date')] }
    : { changes: [update], skipped: [] };
}
