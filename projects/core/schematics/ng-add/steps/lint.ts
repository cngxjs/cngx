import {
  addToArrayLiteral,
  type Change,
  type Provenance,
  skipChange,
  type StepResult,
  withProvenanceMarker,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';

const PLUGIN = '@cngx/eslint-plugin';
const ENTRY = '...cngx.configs.recommended';
const MARKER = 'lint:import';

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

/**
 * Adds `@cngx/eslint-plugin` as a devDependency and its recommended blocks to
 * the flat config's exported array (bare, or inside `defineConfig([...])`).
 * The plugin keeps its own version line, pinned from `versions.json` like
 * `@cngx/mcp`. A config cngx cannot edit safely gets a note instead.
 */
export function planLint(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  if (!answers.lint) {
    return { changes: [], skipped: [] };
  }
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  const config = facts.eslintConfig;
  if (config?.editable !== true) {
    const reason =
      config === undefined
        ? 'no eslint flat config (eslint.config.js, .mjs or .cjs) found'
        : `${config.path} exports no array cngx can extend; add ${ENTRY} by hand`;
    return {
      changes: [{ kind: 'note', id: 'lint:config', label: 'Skip the eslint entry', reason, provenance }],
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
  const declared = facts.manifest.devDependencies[PLUGIN] ?? facts.manifest.dependencies[PLUGIN];
  return {
    changes: [...(declared === undefined ? [dependency] : []), ...(config.wired ? [] : [entry])],
    skipped: [
      ...(declared === undefined ? [] : [skipChange(dependency, `already declared as ${declared}`)]),
      ...(config.wired ? [skipChange(entry, `already loaded in ${config.path}`)] : []),
    ],
  };
}
