import {
  addToArrayLiteral,
  type Change,
  createNote,
  createProvenance,
  declaredRange,
  insertAfterImports,
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
// The plugin's `@angular-eslint/template-parser` peer range is `>=19`.
const TEMPLATE_PARSER_MIN_MAJOR = 19;

// The plugin is CommonJS with `export =`, so both module systems take it as
// the default export.
function importStatement(module: 'esm' | 'cjs'): string {
  const statement = module === 'esm' ? `import cngx from '${PLUGIN}';` : `const cngx = require('${PLUGIN}');`;
  return withProvenanceMarker(statement, MARKER);
}

// `ng update angular-eslint` moves the angular-eslint packages, not
// necessarily eslint itself, so the note names it only as the way in.
function eslintUpdate(facts: ProjectFacts): string {
  return facts.eslintStack.angularEslint === undefined
    ? 'raise eslint to `^9` in devDependencies and reinstall, or run `ng add angular-eslint`'
    : 'raise eslint to `^9` in devDependencies and reinstall (with angular-eslint: `ng update angular-eslint`)';
}

// `ng update angular-eslint` moves a parser angular-eslint manages; a parser
// declared on its own moves by hand.
function templateParserUpdate(facts: ProjectFacts): string {
  return facts.eslintStack.angularEslint === undefined
    ? `raise ${TEMPLATE_PARSER} to \`^${TEMPLATE_PARSER_MIN_MAJOR}\` in devDependencies and reinstall`
    : 'run `ng update angular-eslint`';
}

// The flat config the plugin can run in, or why there is none and what to run next.
function compatibleConfig(facts: ProjectFacts): EslintConfigFacts | { readonly reason: string } {
  const { eslintConfig: config, legacyEslintConfig: legacy, eslintStack: stack } = facts;
  const then = 'then run `ng add @cngx/core` again';
  if (stack.eslintMajor !== undefined && stack.eslintMajor < 9) {
    const declared = declaredRange(facts.manifest, 'eslint') ?? '';
    return { reason: `${PLUGIN} needs ESLint 9 or later and this app declares eslint ${declared}; ${eslintUpdate(facts)}, ${then}` };
  }
  if (config === undefined && legacy !== undefined) {
    return { reason: `${legacy.path} is a legacy config; migrate with \`npx @eslint/migrate-config ${legacy.path}\`, ${then}` };
  }
  if (config === undefined) {
    return { reason: `no eslint flat config (eslint.config.js, .mjs, .cjs, .ts, .mts or .cts) found; set one up with \`ng add angular-eslint\`, ${then}` };
  }
  if (!stack.typescriptParser) {
    return {
      reason: `the cngx rules lint TypeScript through your typescript-eslint setup; add typescript-eslint or run \`ng add angular-eslint\`, ${then}`,
    };
  }
  // Below the peer floor the plugin install fails with a peer conflict, both
  // for a declared parser and for one pinned on the angular-eslint line.
  if (stack.templateParserMajor !== undefined && stack.templateParserMajor < TEMPLATE_PARSER_MIN_MAJOR) {
    return {
      reason: `${PLUGIN} needs ${TEMPLATE_PARSER} ${TEMPLATE_PARSER_MIN_MAJOR} or later and this app is on the ${stack.templateParserMajor} line; ${templateParserUpdate(facts)}, ${then}`,
    };
  }
  // The plugin imports the template parser when it loads; without it ESLint
  // fails before linting a file. With angular-eslint declared it is added below.
  if (!stack.templateParser && stack.angularEslint === undefined) {
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
  const range = facts.eslintStack.angularEslint;
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
  const provenance = createProvenance('ng-add', versions.cngx);
  const config = compatibleConfig(facts);
  if ('reason' in config) {
    return {
      changes: [
        createNote({
          id: 'lint:config',
          label: 'Skip the eslint entry',
          reason: config.reason,
          provenance,
        }),
      ],
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
    edit: (content) =>
      addToArrayLiteral(
        content.includes(PLUGIN) ? content : insertAfterImports(content, importStatement(config.module)),
        { kind: 'default-export' },
        ENTRY,
      ),
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
