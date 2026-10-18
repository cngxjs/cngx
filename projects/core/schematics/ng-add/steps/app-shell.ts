import {
  addToArrayLiteral,
  appendElements,
  type Change,
  createNote,
  ensureArrayProperty,
  hasArrayLiteral,
  hasElement,
  insertAfterImports,
  insertBeforeElement,
  newlineOf,
  type Provenance,
  skipChange,
  type SkippedStep,
  type StepResult,
  topLevelBindings,
} from '../../engine';
import {
  type AppShell,
  appShellSpecOf,
  FEEDBACK_MODULE,
  FEEDBACK_OUTLETS,
  FEEDBACK_SPEC_IMPORT,
  FEEDBACK_SPEC_PROVIDERS,
  inlineTemplateOf,
  type ProjectFacts,
} from '../detect/detect';
import { selectedLibs } from './dependencies';
import { type OnboardingAnswers } from './model';

export const OUTLETS_ID = 'app-shell:outlets';
export const SPEC_ID = 'app-shell:spec';

const BANNER = FEEDBACK_OUTLETS[0];
const TOAST = FEEDBACK_OUTLETS[1];
const OUTLET_REASON = 'CngxToaster and CngxBanner render nowhere without them';
const WITHDRAWN_REASON = 'the outlets were removed after cngx placed them; pass --feedback to place them again';
const TESTBED = { kind: 'testbed-providers' } as const;

/** What to paste when cngx cannot place the outlets itself. */
export const OUTLETS_SNIPPET =
  `place <${BANNER.element} /> right above <router-outlet> (else at the end) and <${TOAST.element} /> at the end of the root template, ` +
  `and add ${BANNER.className} and ${TOAST.className} from '${FEEDBACK_MODULE}' to the root component's imports`;

const NOTHING: StepResult = { changes: [], skipped: [] };

function markup(element: string): string {
  return `<${element} />`;
}

// The banner goes right above the router outlet, else at the end; the toast
// outlet at the end. Both land after the CLI's placeholder block, which ends
// before `<router-outlet />` in the stock template. A template that no longer
// parses is left as it is.
export function placeOutlets(template: string, newline = newlineOf(template)): string {
  try {
    const hasBanner = hasElement(template, BANNER.element);
    const aboveRouter = !hasBanner && hasElement(template, 'router-outlet');
    const withBanner = aboveRouter ? insertBeforeElement(template, 'router-outlet', markup(BANNER.element), newline) : template;
    const appended = [
      ...(hasBanner || aboveRouter ? [] : [markup(BANNER.element)]),
      ...(hasElement(template, TOAST.element) ? [] : [markup(TOAST.element)]),
    ];
    return appended.length === 0 ? withBanner : appendElements(withBanner, appended, newline);
  } catch {
    return template;
  }
}

// Only a backtick template takes the outlets on lines of their own, with the
// host file's newline; a quoted one is reported in detection and left as it
// is here, also when it turned quoted between detection and apply.
function placeInlineOutlets(content: string, className: string): string {
  const inline = inlineTemplateOf(content, className);
  if (inline === undefined || inline.quoted) {
    return content;
  }
  return `${content.slice(0, inline.start)}${placeOutlets(inline.text, newlineOf(content))}${content.slice(inline.end)}`;
}

// Lists both outlet classes in the decorator `imports` (adding the property
// when it is missing) and imports the ones the file does not bind yet.
export function importOutlets(content: string, className: string): string {
  const selector = { kind: 'decorator-imports', className } as const;
  const withProperty = ensureArrayProperty(content, selector);
  if (!hasArrayLiteral(withProperty, selector)) {
    return content;
  }
  const listed = FEEDBACK_OUTLETS.reduce((text, outlet) => addToArrayLiteral(text, selector, outlet.className), withProperty);
  const bindings = topLevelBindings(listed);
  const unbound = FEEDBACK_OUTLETS.map((outlet) => outlet.className).filter((name) => !bindings.has(name));
  return unbound.length === 0 ? listed : insertAfterImports(listed, `import { ${unbound.join(', ')} } from '${FEEDBACK_MODULE}';`);
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
    shell.template.kind === 'file' ? placeOutlets : (content: string) => placeInlineOutlets(content, shell.className);
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
        label: 'Place the toast and banner outlets in the root component',
        reason: `${reason}; ${OUTLETS_SNIPPET}`,
        provenance,
      }),
    ],
    skipped: [],
  };
}

function specChange(facts: ProjectFacts, shell: AppShell, provenance: Provenance): StepResult {
  const path = shell.specPath;
  if (path === undefined || shell.spec === 'absent') {
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
  provenance: Provenance,
  recorded: readonly string[],
  explicitFeedback: boolean,
): StepResult {
  if (!answers.feedback || !selectedLibs(answers.libs).includes('ui')) {
    return NOTHING;
  }
  const shell = facts.appShell;
  if (shell === undefined) {
    return snippetNote('cngx could not follow main.ts to the root component', provenance);
  }
  if (shell.outlets.kind === 'blocked') {
    return snippetNote(shell.outlets.reason, provenance);
  }
  const targets = outletTargets(shell, provenance);
  const removed = shell.outlets.elements.length < FEEDBACK_OUTLETS.length;
  if (removed && recorded.includes(OUTLETS_ID) && !explicitFeedback) {
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
  const spec = specChange(facts, shell, provenance);
  return { changes: [...changes, ...spec.changes], skipped: [...skipped, ...spec.skipped] };
}

/**
 * What `ng update` does with the outlets of a recorded feedback install: a
 * note with the snippet when one is missing, never a write, the same policy
 * as every other step it re-checks.
 */
export function planAppShellCheck(facts: ProjectFacts, answers: OnboardingAnswers, provenance: Provenance): StepResult {
  const outlets = facts.appShell?.outlets;
  if (!answers.feedback || !selectedLibs(answers.libs).includes('ui') || outlets === undefined) {
    return NOTHING;
  }
  const missing = outlets.kind === 'blocked' || outlets.elements.length < FEEDBACK_OUTLETS.length;
  if (!missing) {
    return NOTHING;
  }
  return {
    changes: [
      createNote({
        id: OUTLETS_ID,
        label: 'Place the toast and banner outlets (not in place)',
        reason: `the recorded install provides feedback but the root template lacks an outlet; ${OUTLETS_SNIPPET}`,
        provenance,
      }),
    ],
    skipped: [],
  };
}
