import {
  addToArrayLiteral,
  type Change,
  declaredRange,
  type Provenance,
  skipChange,
  type StepResult,
  withProvenanceMarker,
} from '../../engine';
import { type EslintConfigFacts, type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';

const PLUGIN = '@cngx/eslint-plugin';
const ENTRY = '...cngx.configs.recommended';
const MARKER = 'lint:import';
const TEMPLATE_PARSER = '@angular-eslint/template-parser';
const ANGULAR_ESLINT = 'angular-eslint';

// The plugin is CommonJS with `export =`, so both module systems take it as
// the default export.
function importStatement(module: 'esm' | 'cjs'): string {
  const statement = module === 'esm' ? `import cngx from '${PLUGIN}';` : `const cngx = require('${PLUGIN}');`;
  return withProvenanceMarker(statement, MARKER);
}

const IMPORT_LINE = /^(?:import\s[^\n]*|(?:const|let|var)\s[^\n]*=\s*require\([^\n]*\)[^\n]*)$/gm;

// After the last top-level import or require line; at the top when there is none.
function addImport(content: string, statement: string): string {
  if (content.includes(PLUGIN)) {
    return content;
  }
  const last = [...content.matchAll(IMPORT_LINE)].pop();
  if (last === undefined) {
    return `${statement}\n${content}`;
  }
  const at = last.index + last[0].length;
  return `${content.slice(0, at)}\n${statement}${content.slice(at)}`;
}

// `ng update angular-eslint` moves the angular-eslint packages, not
// necessarily eslint itself, so the note names it only as the way in.
function eslintUpdate(facts: ProjectFacts): string {
  return declaredRange(facts.manifest, ANGULAR_ESLINT) === undefined
    ? 'update eslint to 9 or later or run `ng add angular-eslint`'
    : 'update eslint to 9 or later (with angular-eslint: `ng update angular-eslint`)';
}

// The flat config the plugin can run in, or why there is none and what to run next.
function compatibleConfig(facts: ProjectFacts): EslintConfigFacts | { readonly reason: string } {
  const { eslintConfig: config, legacyEslintConfig: legacy, eslintStack: stack } = facts;
  const then = 'then run ng add again';
  if (stack.eslintMajor !== undefined && stack.eslintMajor < 9) {
    const declared = declaredRange(facts.manifest, 'eslint') ?? '';
    return { reason: `${PLUGIN} needs ESLint 9 or later and this app declares eslint ${declared}; ${eslintUpdate(facts)}, ${then}` };
  }
  if (config === undefined && legacy !== undefined) {
    return { reason: `${legacy} is a legacy config; migrate with \`npx @eslint/migrate-config ${legacy}\`, ${then}` };
  }
  if (config === undefined) {
    return { reason: `no eslint flat config (eslint.config.js, .mjs, .cjs, .ts, .mts or .cts) found; set one up with \`ng add angular-eslint\`, ${then}` };
  }
  if (!stack.typescriptParser) {
    return {
      reason: `the cngx rules lint TypeScript through your typescript-eslint setup; add typescript-eslint or run \`ng add angular-eslint\`, ${then}`,
    };
  }
  // The plugin imports the template parser when it loads; without it ESLint
  // fails before linting a file. With angular-eslint declared it is added below.
  if (!stack.templateParser && declaredRange(facts.manifest, ANGULAR_ESLINT) === undefined) {
    return { reason: `${PLUGIN} loads ${TEMPLATE_PARSER}; add it as a devDependency or run \`ng add angular-eslint\`, ${then}` };
  }
  if (!config.editable) {
    return { reason: `${config.path} exports no array cngx can extend; add ${ENTRY} by hand` };
  }
  return config;
}

// Pinned on the angular-eslint version line; `compatibleConfig` already
// stopped an app that declares neither, so that case plans nothing here.
function templateParser(facts: ProjectFacts, provenance: Provenance): StepResult {
  const id = `dependency:${TEMPLATE_PARSER}`;
  const declared = declaredRange(facts.manifest, TEMPLATE_PARSER);
  if (declared !== undefined) {
    return { changes: [], skipped: [{ id, label: `Add ${TEMPLATE_PARSER}`, reason: `already declared as ${declared}` }] };
  }
  const range = declaredRange(facts.manifest, ANGULAR_ESLINT);
  if (range === undefined) {
    return { changes: [], skipped: [] };
  }
  const dependency: Change = {
    kind: 'add-dependency',
    id,
    label: `Add ${TEMPLATE_PARSER}@${range}`,
    reason: `${PLUGIN} parses templates with it; same version line as ${ANGULAR_ESLINT}`,
    provenance,
    name: TEMPLATE_PARSER,
    version: range,
    dev: true,
  };
  return { changes: [dependency], skipped: [] };
}

/**
 * Adds `@cngx/eslint-plugin` as a devDependency and its recommended blocks to
 * the flat config's exported array (bare, or inside `defineConfig([...])`).
 * The plugin keeps its own version line, pinned from `versions.json` like
 * `@cngx/mcp`. An ESLint setup the plugin cannot run in, or a config cngx
 * cannot edit safely, gets one note naming the reason and the next step, and
 * no edit or dependency.
 */
export function planLint(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  if (!answers.lint) {
    return { changes: [], skipped: [] };
  }
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  const config = compatibleConfig(facts);
  if ('reason' in config) {
    return {
      changes: [{ kind: 'note', id: 'lint:config', label: 'Skip the eslint entry', reason: config.reason, provenance }],
      skipped: [],
    };
  }

  const dependency: Change = {
    kind: 'add-dependency',
    id: `dependency:${PLUGIN}`,
    label: `Add ${PLUGIN}@${versions.eslintPlugin}`,
    reason: 'lint rules for the cngx signal idioms and wiring contracts',
    provenance,
    name: PLUGIN,
    version: versions.eslintPlugin,
    dev: true,
  };
  const entry: Change = {
    kind: 'edit-file',
    id: 'lint:config',
    label: `Add ${ENTRY} to ${config.path}`,
    reason: 'the recommended cngx rules for TypeScript and templates',
    provenance,
    path: config.path,
    edit: (content) => addToArrayLiteral(addImport(content, importStatement(config.module)), { kind: 'default-export' }, ENTRY),
  };
  const declared = declaredRange(facts.manifest, PLUGIN);
  const parser = templateParser(facts, provenance);
  return {
    changes: [...(declared === undefined ? [dependency] : []), ...parser.changes, ...(config.wired ? [] : [entry])],
    skipped: [
      ...(declared === undefined ? [] : [skipChange(dependency, `already declared as ${declared}`)]),
      ...parser.skipped,
      ...(config.wired ? [skipChange(entry, `already loaded in ${config.path}`)] : []),
    ],
  };
}
