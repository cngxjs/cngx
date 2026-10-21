import {
  addToArrayLiteral,
  type Change,
  createNote,
  createProvenance,
  ensureArrayProperty,
  insertAfterImports,
  type Provenance,
  skipChange,
  type SkippedStep,
  type StepResult,
} from '../../engine';
import {
  type AppShell,
  appShellBlockedText,
  appShellSpecOf,
  type AppShellUnfollowed,
  FEEDBACK_MODULE,
  FEEDBACK_OUTLETS,
  FEEDBACK_SPEC_IMPORT,
  FEEDBACK_SPEC_OUTLETS_IMPORT,
  FEEDBACK_SPEC_PROVIDERS,
  outletEdits,
  type ProjectFacts,
  provideFeedbackInModuleSpec,
} from '../detect/detect';
import { selectedLibs } from './dependencies';
import { type OnboardingAnswers, type Versions } from './model';

export const OUTLETS_ID = 'app-shell:outlets';
export const SPEC_ID = 'app-shell:spec';

const BANNER = FEEDBACK_OUTLETS[0];
const TOAST = FEEDBACK_OUTLETS[1];
const OUTLET_REASON = 'CngxToaster and CngxBanner render nowhere without them';
const WITHDRAWN_REASON = 'the outlets were removed after cngx placed them; pass --feedback to place them again';
const STARTER_REASON = 'provided by the starter';
const SNIPPET_LABEL = 'Place the toast and banner outlets in the root component';
const TESTBED = { kind: 'testbed-providers' } as const;

/** What to paste when cngx cannot place the outlets itself. */
export const OUTLETS_SNIPPET =
  `place <${BANNER.element} /> above the ng new placeholder block (else right above <router-outlet>, else at the end) and <${TOAST.element} /> at the end of the root template, ` +
  `and add ${BANNER.className} and ${TOAST.className} from '${FEEDBACK_MODULE}' to the root component's imports`;

const NOTHING: StepResult = { changes: [], skipped: [] };

// The stock spec with the feedback providers; anything else stays as it is,
// so a spec edited between detection and apply is never rewritten.
export function provideFeedbackInSpec(content: string, project: string): string {
  if (appShellSpecOf(content, project) !== 'stock') {
    return content;
  }
  const withProviders = addToArrayLiteral(ensureArrayProperty(content, TESTBED), TESTBED, FEEDBACK_SPEC_PROVIDERS);
  return insertAfterImports(withProviders, FEEDBACK_SPEC_IMPORT);
}

// The stock NgModule spec with the outlet classes and the providers; the
// same re-check, so an NgModule spec edited since detection stays as it is.
export function provideFeedbackInNgModuleSpec(content: string, project: string): string {
  return appShellSpecOf(content, project, 'ng-module') === 'module-stock' ? provideFeedbackInModuleSpec(content) : content;
}

interface OutletTarget {
  readonly change: Change;
  readonly done: boolean;
}

function templatePath(shell: AppShell): string {
  return shell.template.kind === 'file' ? shell.template.path : shell.componentFile;
}

// One change per file `outletEdits` names, the edits detection ran before it
// called the shell editable. Every file keeps the outlets id, so a re-run
// records the same entries whether it places, skips or withdraws them.
function outletTargets(shell: AppShell, provenance: Provenance): readonly OutletTarget[] {
  const outlets = shell.outlets;
  if (outlets.kind === 'blocked') {
    return [];
  }
  const placed = outlets.elements.length === FEEDBACK_OUTLETS.length;
  const imported = outlets.classes.length === FEEDBACK_OUTLETS.length;
  return outletEdits(shell, outlets).map(({ path, places, imports, edit }) => ({
    change: {
      kind: 'edit-file',
      id: OUTLETS_ID,
      label: places ? `Place the toast and banner outlets in ${path}` : `Import the toast and banner outlets in ${path}`,
      reason: OUTLET_REASON,
      provenance,
      path,
      edit,
    },
    done: (!places || placed) && (!imports || imported),
  }));
}

function snippetNote(reason: string, provenance: Provenance): StepResult {
  return {
    changes: [
      createNote({
        id: OUTLETS_ID,
        label: SNIPPET_LABEL,
        reason: `${reason}; ${OUTLETS_SNIPPET}`,
        provenance,
      }),
    ],
    skipped: [],
  };
}

/**
 * Why cngx places no outlet next to a spec it cannot keep green; `<file>`
 * stands for the spec. Only an untouched `ng new` spec gets what the outlets
 * need, the providers (standalone) or the outlet classes and the providers
 * (NgModule): any other spec may render the root component without them.
 * `core-concepts/install.md` lists the text (a spec guards it).
 */
export function specCustomReason(file: string): string {
  return `${file} is not an untouched ng new spec, so cngx places no outlet a TestBed there may lack`;
}

/**
 * Why cngx places no outlet next to the untouched NgModule spec when
 * @angular/build is not on major 21; `<file>` stands for the spec.
 * `core-concepts/install.md` lists the text (a spec guards it).
 */
export function specUnscopedReason(file: string): string {
  return (
    `${file} is the ng new NgModule spec and @angular/build is not on major 21; from 22.2 its unit-test builder ` +
    'compiles the root component there without its NgModule (angular/angular-cli#34231), so cngx places no outlet'
  );
}

/** The note for the NgModule spec the test build cannot run with the outlets: the reason, the snippet and what the spec needs. */
export function specUnscopedText(path: string, className: string, moduleFile: string): string {
  return (
    `${specUnscopedReason(path)}; ${OUTLETS_SNIPPET}, give the TestBed that declares ${className} ` +
    `${BANNER.className} and ${TOAST.className} in its imports with ${FEEDBACK_SPEC_OUTLETS_IMPORT.replace(/;$/, '')} ` +
    `and \`providers: [${FEEDBACK_SPEC_PROVIDERS}]\` with ${FEEDBACK_SPEC_IMPORT.replace(/;$/, '')}, ` +
    `and import ${moduleFile} in ${path} so the test build compiles ${className} with its NgModule`
  );
}

// The note for a spec the outlets would turn red, or `undefined` when the
// spec is stock, provided or missing.
function heldSpecText(shell: AppShell): string | undefined {
  const path = shell.specPath;
  if (path === undefined) {
    return undefined;
  }
  if (shell.spec === 'custom') {
    return specCustomText(path, shell.className);
  }
  return shell.spec === 'module-unscoped' ? specUnscopedText(path, shell.className, shell.importsHost.file) : undefined;
}

/** The note for a spec cngx cannot keep green: the reason, the outlets snippet and what the spec needs. */
export function specCustomText(path: string, className: string): string {
  return (
    `${specCustomReason(path)}; ${OUTLETS_SNIPPET}, and give a TestBed that renders ${className} ` +
    `\`providers: [${FEEDBACK_SPEC_PROVIDERS}]\` with ${FEEDBACK_SPEC_IMPORT.replace(/;$/, '')} ` +
    `(a TestBed that declares ${className} also imports ${BANNER.className} and ${TOAST.className})`
  );
}

const STANDALONE_SPEC_REASON = 'the outlets inject CngxToaster and CngxBanner, which the stock spec does not provide';
const MODULE_SPEC_REASON =
  'the stock spec declares the root component in a TestBed without the outlet classes or the CngxToaster and CngxBanner they inject';

// The spec goes with the outlets: the stock spec is provided once on the
// run that places them; a spec the outlets would turn red never gets here
// with an outlet to place (the outlets stay out, see `planAppShell`), so a
// placed shell plans nothing more.
function specChange(facts: ProjectFacts, shell: AppShell, provenance: Provenance): StepResult {
  const path = shell.specPath;
  if (path === undefined || shell.spec === 'absent' || shell.spec === 'custom' || shell.spec === 'module-unscoped') {
    return NOTHING;
  }
  const module = shell.spec === 'module-stock' || shell.spec === 'module-provided';
  const change: Change = {
    kind: 'edit-file',
    id: SPEC_ID,
    label: `Provide the feedback services in ${path}`,
    reason: module ? MODULE_SPEC_REASON : STANDALONE_SPEC_REASON,
    provenance,
    path,
    edit: module
      ? (content) => provideFeedbackInNgModuleSpec(content, facts.project)
      : (content) => provideFeedbackInSpec(content, facts.project),
  };
  if (shell.spec === 'provided' || shell.spec === 'module-provided') {
    return { changes: [], skipped: [skipChange(change, 'already provided')] };
  }
  return { changes: [change], skipped: [] };
}

/**
 * Places `<cngx-banner-outlet />` and `<cngx-toast-outlet />` in the root
 * component once feedback is on, so `CngxToaster` and `CngxBanner` have a
 * render target: the banner above the CLI's placeholder block, else right
 * above `<router-outlet>`, else at the end; the toast at the end; both classes
 * go into the component `imports` (standalone) or the root NgModule
 * `imports`. An outlet or class already there is not added again. An
 * unedited stock standalone `app.spec.ts` gets the feedback providers, the
 * unedited `ng new --standalone=false` spec also the outlet classes in its
 * TestBed `imports`; next to any other spec, and next to that NgModule spec
 * where @angular/build is not on major 21, cngx places no outlet at all
 * (fail-closed: a red `ng test` is never the result) and one note names the
 * outlets and what the spec needs. The starter is never
 * written next to such a spec (`writesStarter`), so its branch here only
 * sees a stock, provided or missing one. A shell cngx cannot edit safely gets a note with the
 * snippet instead of a guess. `recorded` holds the step ids of this
 * project's previous record: outlets it placed that are gone now were
 * removed on purpose and stay out, unless `explicitFeedback` (`--feedback`)
 * asks for them again. Without `@cngx/ui` selected there is nothing to place;
 * the providers step already says why feedback is skipped. When this run
 * writes the starter (`starter`), the starter template carries both outlets,
 * so the outlet edits are skipped and only the spec is provided.
 */
export function planAppShell(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  recorded: readonly string[],
  explicitFeedback: boolean,
  starter = false,
): StepResult {
  if (!answers.feedback || !selectedLibs(answers.libs).includes('ui')) {
    return NOTHING;
  }
  const provenance = createProvenance('ng-add', versions.cngx);
  const shell = facts.appShell;
  if (starter && shell.kind === 'followed' && shell.outlets.kind === 'editable') {
    const spec = specChange(facts, shell, provenance);
    const skipped = outletTargets(shell, provenance).map(({ change }) => skipChange(change, STARTER_REASON));
    return { changes: spec.changes, skipped: [...skipped, ...spec.skipped] };
  }
  const withdrawable = recorded.includes(OUTLETS_ID) && !explicitFeedback;
  // The record is checked before the shell: outlets an earlier install placed
  // are never asked for again, also where cngx can no longer edit the shell.
  if (withdrawable && (shell.kind === 'unfollowed' || shell.outlets.kind === 'blocked')) {
    return recordedOnBlockedShell(shell, provenance);
  }
  if (shell.kind === 'unfollowed') {
    return snippetNote(appShellBlockedText(shell), provenance);
  }
  if (shell.outlets.kind === 'blocked') {
    return snippetNote(appShellBlockedText(shell.outlets), provenance);
  }
  const targets = outletTargets(shell, provenance);
  const removed = shell.outlets.elements.length < FEEDBACK_OUTLETS.length;
  if (removed && withdrawable) {
    return withdrawnNote(templatePath(shell), WITHDRAWN_REASON, provenance, targets.map(({ change }) => skipChange(change, WITHDRAWN_REASON)));
  }
  const changes = targets.filter(({ done }) => !done).map(({ change }) => change);
  const heldSpec = heldSpecText(shell);
  if (changes.length > 0 && heldSpec !== undefined) {
    return {
      changes: [createNote({ id: OUTLETS_ID, label: SNIPPET_LABEL, reason: heldSpec, provenance })],
      skipped: [],
    };
  }
  const skipped: readonly SkippedStep[] = targets
    .filter(({ done }) => done)
    .map(({ change }) => skipChange(change, 'already placed'));
  const spec = specChange(facts, shell, provenance);
  return { changes: [...changes, ...spec.changes], skipped: [...skipped, ...spec.skipped] };
}

// Outlets the record placed and the user removed, or that cngx cannot see
// any more: a note that says so, and skips with the same reason that keep
// the step id in the record, so later runs still know the outlets were
// placed once. A note is not a write, so the run stays idempotent.
function withdrawnNote(where: string, reason: string, provenance: Provenance, skipped: readonly SkippedStep[]): StepResult {
  return {
    changes: [createNote({ id: OUTLETS_ID, label: `Leave out the toast and banner outlets in ${where}`, reason, provenance })],
    skipped,
  };
}

// A recorded install on a shell cngx cannot edit now: outlets still in the
// template are in place; outlets that are gone are withdrawn, exactly as on
// an editable shell; outlets in a template cngx did not read are named with
// the reason it stopped.
function recordedOnBlockedShell(shell: AppShell | AppShellUnfollowed, provenance: Provenance): StepResult {
  const at = shell.kind === 'unfollowed' ? shell : shell.outlets;
  const elements = at.kind === 'blocked' ? at.elements : undefined;
  const where = shell.kind === 'followed' ? templatePath(shell) : 'the root component';
  const label = `Place the toast and banner outlets in ${where}`;
  if (elements?.length === FEEDBACK_OUTLETS.length) {
    return { changes: [], skipped: [{ id: OUTLETS_ID, label, reason: 'already placed' }] };
  }
  const reason =
    elements === undefined && at.kind !== 'editable'
      ? `an earlier install placed the outlets and ${appShellBlockedText(at)}, so cngx cannot tell whether they are still there; pass --feedback to see how to place them`
      : WITHDRAWN_REASON;
  return withdrawnNote(where, reason, provenance, [{ id: OUTLETS_ID, label, reason }]);
}

// Why `ng update` reports the outlets: the shell cannot be followed or
// edited, or an outlet is missing, and this project's record never placed
// them. Outlets the record placed are there or were withdrawn (A11), so they
// are not asked for again, whatever the shell looks like now.
function missingOutletsReason(shell: AppShell | AppShellUnfollowed, recorded: readonly string[]): string | undefined {
  if (recorded.includes(OUTLETS_ID)) {
    return undefined;
  }
  if (shell.kind === 'unfollowed') {
    return appShellBlockedText(shell);
  }
  if (shell.outlets.kind === 'blocked') {
    return appShellBlockedText(shell.outlets);
  }
  if (shell.outlets.elements.length === FEEDBACK_OUTLETS.length) {
    return undefined;
  }
  return 'the recorded install provides feedback but the root template lacks an outlet';
}

/**
 * What `ng update` does with the outlets of a recorded feedback install: a
 * note with the snippet and the reason when an outlet is missing or the
 * shell cannot be edited, never a write, the same policy as every other step
 * it re-checks. `recorded` holds the step ids of this project's record; an
 * outlet it placed that is gone now was removed on purpose and gets no note.
 */
export function planAppShellRerun(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  recorded: readonly string[],
  provenance: Provenance,
): StepResult {
  if (!answers.feedback || !selectedLibs(answers.libs).includes('ui')) {
    return NOTHING;
  }
  const reason = missingOutletsReason(facts.appShell, recorded);
  if (reason === undefined) {
    return NOTHING;
  }
  return {
    changes: [
      createNote({
        id: OUTLETS_ID,
        label: 'Place the toast and banner outlets (not in place)',
        reason: `${reason}; ${OUTLETS_SNIPPET}`,
        provenance,
      }),
    ],
    skipped: [],
  };
}
