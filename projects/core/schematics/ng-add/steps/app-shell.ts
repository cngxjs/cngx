import {
  addToArrayLiteral,
  appendElements,
  type Change,
  createNote,
  createProvenance,
  ensureArrayProperty,
  hasArrayLiteral,
  insertAfterImports,
  insertBeforeElement,
  newlineOf,
  promoteTypeOnlyImport,
  type Provenance,
  skipChange,
  type SkippedStep,
  type StepResult,
  topLevelBindings,
} from '../../engine';
import {
  type AppShell,
  type AppShellOutlets,
  appShellSpecOf,
  FEEDBACK_MODULE,
  FEEDBACK_OUTLETS,
  FEEDBACK_SPEC_IMPORT,
  FEEDBACK_SPEC_PROVIDERS,
  inlineTemplateOf,
  type ProjectFacts,
} from '../detect/detect';
import { selectedLibs } from './dependencies';
import { type OnboardingAnswers, type Versions } from './model';

export const OUTLETS_ID = 'app-shell:outlets';
export const SPEC_ID = 'app-shell:spec';

const BANNER = FEEDBACK_OUTLETS[0];
const TOAST = FEEDBACK_OUTLETS[1];
const OUTLET_REASON = 'CngxToaster and CngxBanner render nowhere without them';
const WITHDRAWN_REASON = 'the outlets were removed after cngx placed them; pass --feedback to place them again';
const UNFOLLOWED_REASON = 'cngx could not follow main.ts to the root component';
const RECORDED_REASON = 'an earlier install placed them, so cngx does not ask for them again; pass --feedback to see how to place them';
const SNIPPET_LABEL = 'Place the toast and banner outlets in the root component';
const TESTBED = { kind: 'testbed-providers' } as const;

/** What to paste when cngx cannot place the outlets itself. */
export const OUTLETS_SNIPPET =
  `place <${BANNER.element} /> right above <router-outlet> (else at the end) and <${TOAST.element} /> at the end of the root template, ` +
  `and add ${BANNER.className} and ${TOAST.className} from '${FEEDBACK_MODULE}' to the root component's imports`;

const NOTHING: StepResult = { changes: [], skipped: [] };

type EditableOutlets = Extract<AppShellOutlets, { readonly kind: 'editable' }>;

function markup(element: string): string {
  return `<${element} />`;
}

// Places the outlets detection found missing: the banner right above the
// router outlet when detection found one, else at the end; the toast outlet
// at the end. Both land after the CLI's placeholder block, which ends before
// `<router-outlet />` in the stock template. A template that no longer
// parses is left as it is.
function placeOutlets(template: string, outlets: EditableOutlets, newline = newlineOf(template)): string {
  const missing = (element: string): boolean => !outlets.elements.includes(element);
  const aboveRouter = missing(BANNER.element) && outlets.routerOutlet;
  try {
    const withBanner = aboveRouter ? insertBeforeElement(template, 'router-outlet', markup(BANNER.element), newline) : template;
    const appended = [
      ...(missing(BANNER.element) && !aboveRouter ? [markup(BANNER.element)] : []),
      ...(missing(TOAST.element) ? [markup(TOAST.element)] : []),
    ];
    return appended.length === 0 ? withBanner : appendElements(withBanner, appended, newline);
  } catch {
    return template;
  }
}

// Only a backtick template takes the outlets on lines of their own, with the
// host file's newline; a quoted one is reported in detection and left as it
// is here, also when it turned quoted between detection and apply.
function placeInlineOutlets(content: string, className: string, outlets: EditableOutlets): string {
  const inline = inlineTemplateOf(content, className);
  if (inline === undefined || inline.quoted) {
    return content;
  }
  return `${content.slice(0, inline.start)}${placeOutlets(inline.text, outlets, newlineOf(content))}${content.slice(inline.end)}`;
}

// Lists both outlet classes in the decorator `imports` (adding the property
// when it is missing) and imports the ones the file does not bind yet as values.
export function importOutlets(content: string, className: string): string {
  const selector = { kind: 'decorator-imports', className } as const;
  const withProperty = ensureArrayProperty(content, selector);
  if (!hasArrayLiteral(withProperty, selector)) {
    return content;
  }
  const listed = FEEDBACK_OUTLETS.reduce((text, outlet) => addToArrayLiteral(text, selector, outlet.className), withProperty);
  // A class listed in `imports` is a value, so a type-only import of it becomes a value import.
  const promoted = FEEDBACK_OUTLETS.reduce(
    (text, outlet) => promoteTypeOnlyImport(text, outlet.className, FEEDBACK_MODULE),
    listed,
  );
  const bindings = topLevelBindings(promoted);
  const unbound = FEEDBACK_OUTLETS.map((outlet) => outlet.className).filter((name) => !bindings.has(name));
  return unbound.length === 0 ? promoted : insertAfterImports(promoted, `import { ${unbound.join(', ')} } from '${FEEDBACK_MODULE}';`);
}

// The stock spec with the feedback providers; anything else stays as it is,
// so a spec edited between detection and apply is never rewritten.
export function provideFeedbackInSpec(content: string, project: string): string {
  if (appShellSpecOf(content, project) !== 'stock') {
    return content;
  }
  const withProviders = addToArrayLiteral(ensureArrayProperty(content, TESTBED), TESTBED, FEEDBACK_SPEC_PROVIDERS);
  return insertAfterImports(withProviders, FEEDBACK_SPEC_IMPORT);
}

interface OutletTarget {
  readonly change: Change;
  readonly done: boolean;
}

function templatePath(shell: AppShell): string {
  return shell.template.kind === 'file' ? shell.template.path : shell.componentFile;
}

// One change per file: the template file and the imports host, or one
// change when the inline template sits in the host itself. Every file keeps
// the outlets id, so a re-run records the same entries whether it places,
// skips or withdraws them.
function outletTargets(shell: AppShell, provenance: Provenance): readonly OutletTarget[] {
  const outlets = shell.outlets;
  if (outlets.kind === 'blocked') {
    return [];
  }
  const placed = outlets.elements.length === FEEDBACK_OUTLETS.length;
  const imported = outlets.classes.length === FEEDBACK_OUTLETS.length;
  const host = shell.importsHost;
  const path = templatePath(shell);
  const base = { kind: 'edit-file', id: OUTLETS_ID, reason: OUTLET_REASON, provenance } as const;
  const placeEdit =
    shell.template.kind === 'file'
      ? (content: string) => placeOutlets(content, outlets)
      : (content: string) => placeInlineOutlets(content, shell.className, outlets);
  if (path === host.file) {
    return [
      {
        change: {
          ...base,
          label: `Place the toast and banner outlets in ${path}`,
          path,
          edit: (content) => importOutlets(placeEdit(content), host.className),
        },
        done: placed && imported,
      },
    ];
  }
  return [
    { change: { ...base, label: `Place the toast and banner outlets in ${path}`, path, edit: placeEdit }, done: placed },
    {
      change: {
        ...base,
        label: `Import the toast and banner outlets in ${host.file}`,
        path: host.file,
        edit: (content) => importOutlets(content, host.className),
      },
      done: imported,
    },
  ];
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

// The spec goes with the outlets: the stock spec is provided once, and a
// custom one is named only on the run that places an outlet, so a placed
// shell plans nothing more.
function specChange(facts: ProjectFacts, shell: AppShell, provenance: Provenance, placing: boolean): StepResult {
  const path = shell.specPath;
  if (path === undefined || shell.spec === 'absent' || (shell.spec === 'custom' && !placing)) {
    return NOTHING;
  }
  const change: Change = {
    kind: 'edit-file',
    id: SPEC_ID,
    label: `Provide the feedback services in ${path}`,
    reason: 'the outlets inject CngxToaster and CngxBanner, which the stock spec does not provide',
    provenance,
    path,
    edit: (content) => provideFeedbackInSpec(content, facts.project),
  };
  if (shell.spec === 'provided') {
    return { changes: [], skipped: [skipChange(change, 'already provided')] };
  }
  if (shell.spec === 'custom') {
    return {
      changes: [
        createNote({
          id: SPEC_ID,
          label: `Provide the feedback services in ${path}`,
          reason: `the outlets inject CngxToaster and CngxBanner; a TestBed that renders ${shell.className} needs \`providers: [${FEEDBACK_SPEC_PROVIDERS}]\` with ${FEEDBACK_SPEC_IMPORT.replace(/;$/, '')}`,
          provenance,
        }),
      ],
      skipped: [],
    };
  }
  return { changes: [change], skipped: [] };
}

/**
 * Places `<cngx-banner-outlet />` and `<cngx-toast-outlet />` in the root
 * component once feedback is on, so `CngxToaster` and `CngxBanner` have a
 * render target: the banner right above `<router-outlet>` (else at the end),
 * the toast at the end, both after the CLI's placeholder block; both classes
 * go into the component `imports` (standalone) or the root NgModule
 * `imports`. An outlet or class already there is not added again. An
 * unedited stock `app.spec.ts` gets the feedback providers, any other spec a
 * note with the snippet. A shell cngx cannot edit safely gets a note with the
 * snippet instead of a guess. `recorded` holds the step ids of this
 * project's previous record: outlets it placed that are gone now were
 * removed on purpose and stay out, unless `explicitFeedback` (`--feedback`)
 * asks for them again. Without `@cngx/ui` selected there is nothing to place;
 * the providers step already says why feedback is skipped.
 */
export function planAppShell(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  recorded: readonly string[],
  explicitFeedback: boolean,
): StepResult {
  if (!answers.feedback || !selectedLibs(answers.libs).includes('ui')) {
    return NOTHING;
  }
  const provenance = createProvenance('ng-add', versions.cngx);
  const shell = facts.appShell;
  const withdrawable = recorded.includes(OUTLETS_ID) && !explicitFeedback;
  // The record is checked before the shell: outlets an earlier install placed
  // are never asked for again, also where cngx can no longer edit the shell.
  // The skip keeps the step id in the record.
  if (withdrawable && (shell === undefined || shell.outlets.kind === 'blocked')) {
    return { changes: [], skipped: [{ id: OUTLETS_ID, label: SNIPPET_LABEL, reason: RECORDED_REASON }] };
  }
  if (shell === undefined) {
    return snippetNote(UNFOLLOWED_REASON, provenance);
  }
  if (shell.outlets.kind === 'blocked') {
    return snippetNote(shell.outlets.reason, provenance);
  }
  const targets = outletTargets(shell, provenance);
  const removed = shell.outlets.elements.length < FEEDBACK_OUTLETS.length;
  if (removed && withdrawable) {
    return {
      changes: [
        createNote({
          id: OUTLETS_ID,
          label: `Leave out the toast and banner outlets in ${templatePath(shell)}`,
          reason: WITHDRAWN_REASON,
          provenance,
        }),
      ],
      skipped: targets.map(({ change }) => skipChange(change, WITHDRAWN_REASON)),
    };
  }
  const changes = targets.filter(({ done }) => !done).map(({ change }) => change);
  const skipped: readonly SkippedStep[] = targets
    .filter(({ done }) => done)
    .map(({ change }) => skipChange(change, 'already placed'));
  const spec = specChange(facts, shell, provenance, changes.length > 0);
  return { changes: [...changes, ...spec.changes], skipped: [...skipped, ...spec.skipped] };
}

// Why `ng update` reports the outlets: the shell cannot be followed or
// edited, or an outlet is missing, and this project's record never placed
// them. Outlets the record placed are there or were withdrawn (A11), so they
// are not asked for again, whatever the shell looks like now.
function missingOutletsReason(shell: AppShell | undefined, recorded: readonly string[]): string | undefined {
  if (recorded.includes(OUTLETS_ID)) {
    return undefined;
  }
  if (shell === undefined) {
    return UNFOLLOWED_REASON;
  }
  if (shell.outlets.kind === 'blocked') {
    return shell.outlets.reason;
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
