import { chain, noop, type Rule, type SchematicContext, SchematicsException, type Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { readWorkspace } from '@schematics/angular/utility';

import {
  applyChangePlan,
  canPrompt,
  type ChangePlan,
  createChangePlan,
  createPalette,
  createPromptFlow,
  createRenderer,
  createReport,
  type NgAddOptions,
  resolveVersions,
} from '../engine';
import { detectProject, type ProjectFacts } from './detect/detect';
import { type GitState, readGitState } from './shell/git-state';
import { askOnboarding, givenAnswers } from './shell/questions';
import { planAiTools, withdrawnAiTargets } from './steps/ai-tools';
import { planDependencies } from './steps/dependencies';
import { createSummary } from './steps/finish';
import { planHelperReadme } from './steps/helper-readme';
import { planLint } from './steps/lint';
import { readInstallManifest } from './shell/install-manifest';
import { planManifest } from './steps/manifest';
import { type Step } from './steps/model';
import { planProviders } from './steps/providers';
import { planTheme } from './steps/theme';

/**
 * The plan steps in apply order; the install manifest follows them. The AI
 * tooling steps leave out what the user removed since the last install.
 */
function planSteps(withdrawn: ReadonlySet<string>): readonly Step[] {
  return [
    planDependencies,
    planTheme,
    planProviders,
    planLint,
    (facts, answers, versions) => planAiTools(facts, answers, versions, withdrawn),
    (facts, answers, versions) => planHelperReadme(facts, answers, versions, withdrawn),
  ];
}

// `CI=false` and `CI=0` are how some runners say "not CI".
function isCi(env: NodeJS.ProcessEnv): boolean {
  const ci = env['CI'];
  return ci !== undefined && ci !== '' && ci !== 'false' && ci !== '0';
}

function majorMinor(version: string | undefined): readonly [number, number] | undefined {
  const match = /(\d+)\.(\d+)/.exec(version ?? '');
  return match === null ? undefined : [Number(match[1]), Number(match[2])];
}

// The floor is the `@angular/core` range @cngx/core peers on, stamped into
// versions.json at publish time.
function assertSupportedAngular(facts: ProjectFacts, peerRange: string): void {
  const [minMajor, minMinor] = majorMinor(peerRange) ?? [0, 0];
  const app = majorMinor(facts.angularVersion);
  const supported = app !== undefined && (app[0] > minMajor || (app[0] === minMajor && app[1] >= minMinor));
  if (!supported) {
    const declared = facts.manifest.dependencies['@angular/core'] ?? 'no @angular/core dependency';
    throw new SchematicsException(`cngx needs Angular ${minMajor}.${minMinor} or newer; this app declares ${declared}.`);
  }
}

const GIT_LINES: Readonly<Record<GitState, string>> = {
  clean: 'Git: working tree clean; review the cngx changes with git diff afterwards.',
  dirty: 'Git: uncommitted changes; the cngx changes will mix with them in git diff.',
  unknown: 'Git: no repository found; there is no diff to review the cngx changes against.',
};

function scheduleInstall(plan: ChangePlan): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    if (plan.changes.some((change) => change.kind === 'add-dependency')) {
      context.addTask(new NodePackageInstallTask());
    }
  };
}

/**
 * The whole onboarding in one stage: detect, ask, plan, print the plan,
 * confirm on an existing app, apply, summarise, and install once at the
 * end. Nothing in here needs the installed packages: the engine and prompts
 * are bundled and `@schematics/angular` comes from the CLI. Under
 * `--dry-run` the same rule runs and the CLI drops the writes and the task.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const { versions, warning } = resolveVersions(__dirname);
    const isTTY = process.stdout.isTTY === true && !isCi(process.env);
    const interactive = canPrompt(isTTY, options.prompts);
    const renderer = createRenderer({
      isTTY,
      color: createPalette(process.env, isTTY),
      verbosity: options.quiet === true ? 'quiet' : 'normal',
      logger: context.logger,
    });

    const facts = detectProject(tree, await readWorkspace(tree), options.project);
    assertSupportedAngular(facts, versions.angular);

    const flow = createPromptFlow({
      canPrompt: interactive && options.preset !== 'minimal',
      answers: givenAnswers(options),
    });
    const answers = await askOnboarding(facts, options, flow);
    const previous = readInstallManifest(tree);
    const installed = previous?.steps.map((step) => step.id) ?? [];
    const withdrawn = withdrawnAiTargets(facts, answers, installed, options.aiTools ?? []);
    const steps = createChangePlan(
      planSteps(withdrawn).map((step) => step(facts, answers, versions)),
      warning === undefined ? [] : [warning],
    );
    const manifest = planManifest(facts, answers, versions, steps, previous, new Date().toISOString());
    const plan = createChangePlan([steps, manifest], steps.warnings);

    await renderer.todo(plan);

    const changesFiles = plan.changes.some((change) => change.kind !== 'note');
    if (facts.maturity === 'existing' && changesFiles && options.yes !== true) {
      renderer.note(GIT_LINES[readGitState(process.cwd())]);
      if (!interactive) {
        renderer.note('No terminal to confirm in; applying the plan. Pass --yes to apply without this line.');
      }
      const confirm = createPromptFlow({ canPrompt: interactive });
      const proceed = await confirm.confirm({ key: 'apply', message: 'Apply these changes?', default: true });
      if (!proceed) {
        renderer.note('Nothing changed.');
        return noop();
      }
    }

    return chain([
      applyChangePlan(plan),
      () => renderer.summary(createSummary(createReport(plan), options.quiet !== true)),
      scheduleInstall(plan),
    ]);
  };
}
