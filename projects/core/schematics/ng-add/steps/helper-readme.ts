import {
  AI_TOOLS,
  type AiTool,
  type Change,
  contentFingerprint,
  createNote,
  createProvenance,
  createProvenanceStamp,
  joinNames,
  type ProvenanceSource,
  skipChange,
  type StepResult,
} from '../../engine';
import { HELPER_README_PATH, helperReadmeFingerprintLine, MCP_CONFIGS, type ProjectFacts } from '../detect/detect';
// Sheriff resolves TypeScript modules only; the template is text, bundled by
// the esbuild text loader, so there is no module boundary to check.
// eslint-disable-next-line @softarc/sheriff/dependency-rule, @softarc/sheriff/encapsulation
import TEMPLATE from '../templates/helper-readme.md.tpl';
import { aiToolId, instructionTargets } from './ai-tools';
import { cngxPackages, selectedLibs } from './dependencies';
import { MCP_PROMPTS, MCP_RESOURCES, MCP_TOOLS } from './mcp-capabilities.generated';
import { type OnboardingAnswers, type Versions } from './model';

const SOURCE: ProvenanceSource = 'ng-add';

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

// Every editor the README describes: the ones this run sets up and the ones
// whose config already declares a cngx server, so a re-run with a different
// editor choice never drops a server that is still configured. A server the
// user removed (`withdrawn`) is not described as set up.
function documentedTools(facts: ProjectFacts, answers: OnboardingAnswers, withdrawn: ReadonlySet<string>): readonly AiTool[] {
  return AI_TOOLS.filter(
    (tool) =>
      facts.mcpConfigs[tool] === 'wired' ||
      (answers.aiTools.includes(tool) && !withdrawn.has(aiToolId(tool))),
  );
}

// A config the AI tooling step could not edit is listed with what to do,
// never as configured; an existing entry with another pin is named as such.
function configLine(tool: AiTool, facts: ProjectFacts, mcpVersion: string): string {
  const { path, key } = MCP_CONFIGS[tool];
  const pin = facts.mcpPins[tool];
  if (facts.mcpConfigs[tool] === 'invalid') {
    return `- \`${path}\`: no \`${key}\` object cngx can add to; add \`${key}.cngx\` by hand`;
  }
  if (facts.mcpConfigs[tool] === 'wired' && pin !== mcpVersion) {
    const runs = pin === undefined ? 'no `@cngx/mcp` version cngx can read' : `\`@cngx/mcp@${pin}\``;
    return `- \`${path}\`: its own cngx entry, running ${runs}`;
  }
  return `- \`${path}\``;
}

const cell = (text: string): string => text.replace(/\|/g, '\\|');

function row(cells: readonly string[]): string {
  return `|${cells.map(cell).join('|')}|`;
}

/**
 * Fills every `{{name}}`; a placeholder without a value is a template bug,
 * not output. `file` names the template in that error.
 */
export function fillTemplate(
  template: string,
  values: Readonly<Record<string, string>>,
  file = 'helper-readme.md.tpl',
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = values[name];
    if (value === undefined) {
      throw new Error(`${file} uses {{${name}}}, which has no value.`);
    }
    return value;
  });
}

function renderBody(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions, withdrawn: ReadonlySet<string>): string {
  const tools = documentedTools(facts, answers, withdrawn);
  const body = fillTemplate(TEMPLATE, {
    version: versions.cngx,
    mcpVersion: versions.mcp,
    packages: cngxPackages(selectedLibs(answers.libs), answers.theme)
      .map((name) => `- \`${name}@${versions.cngx}\``)
      .join('\n'),
    configs: tools.map((tool) => configLine(tool, facts, versions.mcp)).join('\n'),
    instructions: joinNames(
      instructionTargets(facts, { ...answers, aiTools: tools })
        .filter((target) => !withdrawn.has(target.id))
        .map((target) => `\`${target.path}\``),
    ),
    tools: MCP_TOOLS.map((tool) => row([`\`${tool.name}\``, tool.title, tool.example])).join('\n'),
    resources: MCP_RESOURCES.map((resource) => row([`\`${resource.uri}\``, resource.description])).join('\n'),
    prompts: MCP_PROMPTS.map((prompt) => row([`\`${prompt.name}\``, prompt.description])).join('\n'),
    verify: tools.map((tool) => `- ${VERIFY[tool]}`).join('\n'),
    plugin: tools.includes('claude') ? CLAUDE_PLUGIN : '',
  });
  return body;
}

/** The README with its stamp and the fingerprint of its body, which a later run compares against. */
export function renderHelperReadme(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  withdrawn: ReadonlySet<string> = new Set(),
): string {
  const body = renderBody(facts, answers, versions, withdrawn);
  const stamp = createProvenanceStamp(SOURCE, versions.cngx, 'html');
  return `${stamp}${helperReadmeFingerprintLine(contentFingerprint(body))}\n\n${body}`;
}

/**
 * `.cngx/README.md`: what was installed, where the MCP server is configured,
 * what it answers and how to check or remove it. Written with the AI tooling,
 * regenerated when its inputs change, and never written over a file cngx did
 * not generate.
 */
export function planHelperReadme(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  withdrawn: ReadonlySet<string> = new Set(),
): StepResult {
  if (documentedTools(facts, answers, withdrawn).length === 0) {
    return { changes: [], skipped: [] };
  }
  const provenance = createProvenance(SOURCE, versions.cngx);
  const fingerprint = contentFingerprint(renderBody(facts, answers, versions, withdrawn));
  const content = renderHelperReadme(facts, answers, versions, withdrawn);
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
        createNote({
          id: base.id,
          label: `Skip ${HELPER_README_PATH}`,
          reason: `${HELPER_README_PATH} exists and cngx did not write it; it is left as it is`,
          provenance,
        }),
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
  return existing.fingerprint === fingerprint
    ? { changes: [], skipped: [skipChange(update, 'already up to date')] }
    : { changes: [update], skipped: [] };
}
