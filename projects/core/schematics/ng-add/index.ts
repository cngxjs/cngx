import { chain, noop, type Rule, type SchematicContext, SchematicsException, type Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { readWorkspace } from '@schematics/angular/utility';

import {
  applyChangePlan,
  canPrompt,
  type ChangePlan,
  createChangePlan,
  createPromptFlow,
  createProvenance,
  createRenderer,
  createReport,
  createShellRendererOptions,
  createSummary,
  isCi,
  type NgAddFlags,
  parseNgAddOptions,
  resolveVersions,
} from '../engine';
import { detectProject, type ProjectFacts } from './detect/detect';
import { readGitState } from './shell/git-state';
import { angularSupport, preflightItems } from './shell/preflight';
import { askOnboarding, givenAnswers, presetChangeNote, presetDefaults } from './shell/questions';
import { planAiTools, withdrawnAiTargets } from './steps/ai-tools';
import { planDependencies } from './steps/dependencies';
import { planHelperReadme } from './steps/helper-readme';
import { planLint } from './steps/lint';
import { readInstallManifest } from './shell/install-manifest';
import { planManifest } from './steps/manifest';
import { type Step } from './steps/model';
import { planProviders } from './steps/providers';
import { readRecordedAnswers } from './steps/reruns';
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

// The floor is the `@angular/core` range @cngx/core peers on, stamped into
// versions.json at publish time. The preflight line shows the refusal first.
function assertSupportedAngular(facts: ProjectFacts, peerRange: string): void {
  const { supported, floor, declared } = angularSupport(facts, peerRange);
  if (!supported) {
    throw new SchematicsException(
      `cngx needs Angular ${floor} or newer; this app declares ${declared}.`,
    );
  }
}

/** Why the run cannot ask before it applies to an existing app. */
interface ConfirmContext {
  readonly isTTY: boolean;
  readonly ci: boolean;
  readonly prompts: boolean | undefined;
}

// The line an existing app sees when the plan applies without a confirm;
// `undefined` when the terminal asks. CI comes first: it also hides the
// terminal.
function unconfirmedApplyLine({ isTTY, ci, prompts }: ConfirmContext): string | undefined {
  const pass = 'Pass --yes to apply without this line.';
  if (ci) {
    return `Running under CI; applying the plan without a confirm. ${pass}`;
  }
  if (!isTTY) {
    return `No terminal to confirm in; applying the plan. ${pass}`;
  }
  if (prompts === false) {
    return `Prompts are off (--no-prompts); applying the plan without a confirm. ${pass}`;
  }
  return undefined;
}

function scheduleInstall(plan: ChangePlan): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    if (plan.changes.some((change) => change.kind === 'add-dependency')) {
      context.addTask(new NodePackageInstallTask());
    }
  };
}

/**
 * The whole onboarding in one stage: detect, print the preflight checklist,
 * ask, plan, print the plan, confirm on an existing app, apply, summarise,
 * and install once at the end. Nothing in here needs the installed packages:
 * the engine and prompts are bundled and `@schematics/angular` comes from the
 * CLI. Under `--dry-run` the same rule runs and the CLI drops the writes and
 * the task. `flags` are parsed once here; everything below reads the typed
 * options.
 */
export function ngAdd(flags: NgAddFlags): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const options = parseNgAddOptions(flags);
    const { versions, warning } = resolveVersions(__dirname);
    const rendererOptions = createShellRendererOptions(process.env, process.stdout, context.logger, options.quiet === true);
    const interactive = canPrompt(rendererOptions.isTTY, options.prompts);
    const renderer = createRenderer(rendererOptions);

    const facts = detectProject(tree, await readWorkspace(tree), options.project);
    renderer.preflight(
      preflightItems({ facts, peerRange: versions.angular, git: readGitState(process.cwd()) }),
    );
    assertSupportedAngular(facts, versions.angular);

    const flow = createPromptFlow({
      canPrompt: interactive && options.preset !== 'minimal',
      answers: givenAnswers(options),
    });
    const previous = readInstallManifest(tree);
    const installed = previous?.steps.map((step) => step.id) ?? [];
    const recorded =
      previous === undefined
        ? undefined
        : readRecordedAnswers(previous, (preset) => presetDefaults(preset, facts));
    const { answers, explicitAiTools } = await askOnboarding(
      facts,
      options,
      flow,
      installed,
      recorded,
    );
    const withdrawn = withdrawnAiTargets(facts, answers, installed, explicitAiTools);
    const provenance = createProvenance('ng-add', versions.cngx);
    const steps = createChangePlan(
      [
        ...planSteps(withdrawn).map((step) => step(facts, answers, versions)),
        presetChangeNote(options, recorded, provenance),
      ],
      warning === undefined ? [] : [warning],
    );
    const manifest = planManifest(facts, answers, versions, steps, previous, new Date().toISOString());
    const plan = createChangePlan([steps, manifest], steps.warnings);

    await renderer.todo(plan);

    const changesFiles = plan.changes.some((change) => change.kind !== 'note');
    if (facts.maturity === 'existing' && changesFiles && options.yes !== true) {
      const unconfirmed = unconfirmedApplyLine({
        isTTY: rendererOptions.isTTY,
        ci: isCi(process.env),
        prompts: options.prompts,
      });
      if (unconfirmed !== undefined) {
        renderer.note(unconfirmed);
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
