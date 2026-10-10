import { chain, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import {
  applyChangePlan,
  canPrompt,
  type ChangePlan,
  createChangePlan,
  createPalette,
  createPromptFlow,
  createRenderer,
  createReport,
  declaredRange,
  type NgAddOptions,
  type PackageManifest,
  parseManifest,
  type PromptAnswers,
  readOwnVersion,
  type StepResult,
} from '../engine';
import { createSummary } from './steps/finish';

interface Facts {
  readonly manifest: PackageManifest;
}

interface Versions {
  readonly cngx: string;
}

type Step = (facts: Facts, answers: PromptAnswers, versions: Versions) => StepResult;

const UTILS = '@cngx/utils';

function planUtilsDependency(
  facts: Facts,
  _answers: PromptAnswers,
  versions: Versions,
): StepResult {
  const change = {
    kind: 'add-dependency',
    id: `dependency:${UTILS}`,
    label: `Add ${UTILS}@${versions.cngx}`,
    reason: 'every @cngx package stays on one version',
    provenance: { source: 'ng-add', version: versions.cngx },
    name: UTILS,
    version: versions.cngx,
  } as const;
  if (declaredRange(facts.manifest, UTILS) === versions.cngx) {
    return {
      changes: [],
      skipped: [{ id: change.id, label: change.label, reason: 'already pinned' }],
    };
  }
  return { changes: [change], skipped: [] };
}

const STEPS: readonly Step[] = [planUtilsDependency];

// `CI=false` and `CI=0` are how some runners say "not CI".
function isCi(env: NodeJS.ProcessEnv): boolean {
  const ci = env['CI'];
  return ci !== undefined && ci !== '' && ci !== 'false' && ci !== '0';
}

function scheduleInstall(plan: ChangePlan): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    if (plan.changes.some((change) => change.kind === 'add-dependency')) {
      context.addTask(new NodePackageInstallTask());
    }
  };
}

/**
 * The whole onboarding in one stage: detect, ask, plan, print the plan,
 * apply it, summarise, and install once at the end. Nothing in here needs
 * the installed packages: the engine and prompts are bundled and
 * `@schematics/angular` comes from the CLI. Under `--dry-run` the same rule
 * runs and the CLI drops the writes and the task.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const version = readOwnVersion(__dirname);
    const isTTY = process.stdout.isTTY === true && !isCi(process.env);
    const renderer = createRenderer({
      isTTY,
      color: createPalette(process.env, isTTY),
      verbosity: options.quiet === true ? 'quiet' : 'normal',
      logger: context.logger,
    });
    const prompts = createPromptFlow({ canPrompt: canPrompt(isTTY, options.prompts) });

    const facts: Facts = { manifest: parseManifest(tree.readText('package.json')) };
    const answers = prompts.answers();
    const plan = createChangePlan(STEPS.map((step) => step(facts, answers, { cngx: version })));

    await renderer.todo(plan);

    return chain([
      applyChangePlan(plan),
      () => renderer.summary(createSummary(createReport(plan), options.quiet !== true)),
      scheduleInstall(plan),
    ]);
  };
}
