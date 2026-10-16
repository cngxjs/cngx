import { chain, noop, type Rule, type SchematicContext, SchematicsException, type Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { readWorkspace } from '@schematics/angular/utility';

import {
  applyChangePlan,
  canPrompt,
  type ChangePlan,
  type CngxLib,
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
  readDryRunFlag,
  readPromptFlags,
  resolveVersions,
} from '../engine';
import { detectProject, type ProjectFacts } from './detect/detect';
import { readGitState } from './shell/git-state';
import { angularReading, angularSupport, preflightItems } from './shell/preflight';
import { askOnboarding, givenAnswers, libsFloorNote, presetChangeNote, presetDefaults } from './shell/questions';
import { planAiTools, withdrawnAiTargets } from './steps/ai-tools';
import { planDependencies } from './steps/dependencies';
import { planHelperReadme } from './steps/helper-readme';
import { planLint } from './steps/lint';
import { readInstallManifest, manifestOf, unreadableCopyPath } from './shell/install-manifest';
import { planManifest, planUnreadableManifest, recordedLibs, recordedStepIds, unionLibs } from './steps/manifest';
import { type Step } from './steps/model';
import { planProviders } from './steps/providers';
import { readRecordedAnswers } from './steps/reruns';
import { planTheme } from './steps/theme';

/**
 * The plan steps in apply order; the install manifest follows them. The AI
 * tooling steps leave out what the user removed since the last install. The
 * helper README is workspace-wide, so it lists the libs of every project's
 * record, not only this run's.
 */
function planSteps(withdrawn: ReadonlySet<string>, workspaceLibs: readonly CngxLib[]): readonly Step[] {
  return [
    planDependencies,
    planTheme,
    planProviders,
    planLint,
    (facts, answers, versions) => planAiTools(facts, answers, versions, withdrawn),
    (facts, answers, versions) =>
      planHelperReadme(facts, { ...answers, libs: unionLibs(answers.libs, workspaceLibs) }, versions, withdrawn),
  ];
}

// The floor is the `@angular/core` range @cngx/core peers on, stamped into
// versions.json at publish time. The preflight line shows the refusal first.
// Only a version read below the floor refuses; one cngx cannot read is the
// preflight's warn line.
function assertSupportedAngular(facts: ProjectFacts, peerRange: string): void {
  const { supported, floor } = angularSupport(facts, peerRange);
  if (supported === false) {
    throw new SchematicsException(
      `cngx needs Angular ${floor} or newer; this app ${angularReading(facts)}.`,
    );
  }
}

// The build target carries the styles and the main file every step plans
// against; `addStyleEntry` in apply stays the last guard.
function assertBuildTarget(facts: ProjectFacts): void {
  if (!facts.hasBuildTarget) {
    throw new SchematicsException(
      `Project "${facts.project}" has no build target in angular.json; cngx wires styles and providers through it.`,
    );
  }
}

/** Why the run cannot ask before it applies to an existing app. */
interface ConfirmContext {
  readonly isTTY: boolean;
  readonly ci: boolean;
  readonly prompts: boolean | undefined;
  /** What else turned prompts off: a CLI flag, or a programmatic `interactive: false`. */
  readonly promptsOff: string | undefined;
}

// The line an existing app sees when the plan applies without a confirm;
// `undefined` when the terminal asks. CI comes first: it also hides the
// terminal.
function unconfirmedApplyLine({ isTTY, ci, prompts, promptsOff }: ConfirmContext): string | undefined {
  const pass = 'Pass --yes to apply without this line.';
  if (ci) {
    return `Running under CI; applying the plan without a confirm. ${pass}`;
  }
  if (!isTTY) {
    return `No terminal to confirm in; applying the plan. ${pass}`;
  }
  const off = prompts === false ? '--no-prompts' : promptsOff;
  if (off !== undefined) {
    return `Prompts are off (${off}); applying the plan without a confirm. ${pass}`;
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
    const promptsOff = readPromptFlags(process.argv) ?? (context.interactive === false ? 'interactive: false' : undefined);
    const interactive = canPrompt(rendererOptions.isTTY, options.prompts) && promptsOff === undefined;
    const renderer = createRenderer(rendererOptions);

    const facts = detectProject(tree, await readWorkspace(tree), options.project);
    renderer.preflight(
      preflightItems({ facts, peerRange: versions.angular, git: readGitState(process.cwd()), projectFlag: options.project }),
    );
    assertSupportedAngular(facts, versions.angular);
    assertBuildTarget(facts);

    const flow = createPromptFlow({
      canPrompt: interactive && options.preset !== 'minimal',
      answers: givenAnswers(options),
    });
    const stored = readInstallManifest(tree);
    const manifest = manifestOf(stored);
    const previous = manifest?.projects[facts.project];
    const installed = recordedStepIds(manifest);
    const recorded =
      previous === undefined
        ? undefined
        : readRecordedAnswers(previous, (preset) => presetDefaults(preset, facts));
    const { answers, answeredLibs, explicitAiTools } = await askOnboarding(
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
        ...planSteps(withdrawn, recordedLibs(manifest)).map((step) => step(facts, answers, versions)),
        presetChangeNote(options, recorded, provenance),
        libsFloorNote(answeredLibs, answers.libs, facts.project, provenance),
      ],
      warning === undefined ? [] : [warning],
    );
    const unreadable =
      stored.state === 'unreadable'
        ? planUnreadableManifest(facts.project, versions, stored.content, unreadableCopyPath((path) => tree.exists(path)))
        : { changes: [], skipped: [] };
    const record = planManifest(facts, answers, versions, steps, previous, new Date().toISOString());
    const plan = createChangePlan([steps, unreadable, record], steps.warnings);

    const changesFiles = plan.changes.some((change) => change.kind !== 'note');
    const confirmAhead = facts.maturity === 'existing' && changesFiles && options.yes !== true;
    await renderer.todo(plan, { pending: readDryRunFlag(process.argv) || (confirmAhead && interactive) });

    if (confirmAhead) {
      const unconfirmed = unconfirmedApplyLine({
        isTTY: rendererOptions.isTTY,
        ci: isCi(process.env),
        prompts: options.prompts,
        promptsOff,
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
