import { posix } from 'node:path';

import {
  type Change,
  contentFingerprint,
  createNote,
  createProvenance,
  newlineOf,
  type Provenance,
  type SkippedStep,
  type StepResult,
} from '../../engine';
import {
  type AppScaffold,
  CNGX_LANGUAGE_FILE,
  type IndexHtmlFacts,
  isUntouchedGlobalStyles,
  matchesScaffoldEntry,
  type ProjectFacts,
  scaffoldEntries,
  type ScaffoldFiles,
  starterFingerprintLine,
  withStarterFavicon,
} from '../detect/detect';
import { canInstallTheme, selectedLibs } from './dependencies';
import { fillTemplate } from './helper-readme';
import { type OnboardingAnswers, type Versions } from './model';
import { switchesLanguageAtRuntime } from './providers';

export const STARTER_ID = 'app-shell:starter';

interface StarterAt {
  /** The file the reason names. */
  readonly file: string;
}

/**
 * Every reason cngx leaves the starter (or a part of it) out, with its text;
 * `core-concepts/install.md` lists each text with `<file>` for the file (a
 * spec guards it).
 */
export const STARTER_LEFT_OUT_REASONS = {
  'libs-missing': () => 'the starter composes @cngx/common and @cngx/ui; select both to get it',
  'not-untouched': ({ file }: StarterAt) =>
    `${file}, its template or its stylesheet is not the untouched ng new scaffold, so the starter is not written over it`,
  'spec-custom': ({ file }: StarterAt) =>
    `${file} is not the untouched ng new spec, so the starter, which replaces the page that spec renders, is not written`,
  'other-answers': ({ file }: StarterAt) =>
    `${file} holds the cngx starter of an earlier run with other answers; cngx does not rewrite it`,
  'index-custom': ({ file }: StarterAt) =>
    `${file} is not the untouched ng new file, so the starter leaves its icon link and favicon.svg alone`,
  'favicon-taken': ({ file }: StarterAt) =>
    `${file} exists and is not the cngx favicon, so the starter leaves it and the icon link alone`,
  'styles-custom': ({ file }: StarterAt) =>
    `${file} is not the untouched ng new global stylesheet, so the starter, whose page styles go there, is not written`,
  'no-global-styles': () =>
    'the build lists no global stylesheet, so the starter, whose page styles go there, is not written',
  'no-public-folder': () =>
    'the build copies no public folder, so the starter leaves the icon link and favicon.svg alone',
} as const;

/** Why cngx leaves the starter or a part of it out: a key of `STARTER_LEFT_OUT_REASONS`. */
export type StarterLeftOutReason = keyof typeof STARTER_LEFT_OUT_REASONS;

/** The text a note gives for a starter cngx leaves out. */
export function starterLeftOutText(reason: StarterLeftOutReason, file = ''): string {
  return STARTER_LEFT_OUT_REASONS[reason]({ file });
}

const NOTHING: StepResult = { changes: [], skipped: [] };

/** What the starter shows: one block per answer that installed something to try. */
export interface StarterBlocks {
  readonly routing: boolean;
  readonly theme: boolean;
  readonly a11y: boolean;
  readonly feedback: boolean;
  readonly language: boolean;
}

/** The blocks the answers enable on this app; the same on a first run and a re-run. */
export function starterBlocks(facts: ProjectFacts, answers: OnboardingAnswers, routing: boolean): StarterBlocks {
  const libs = selectedLibs(answers.libs);
  return {
    routing,
    theme: canInstallTheme(libs, answers.theme),
    a11y: answers.a11yPreferences && libs.includes('core') && libs.includes('ui'),
    feedback: answers.feedback && libs.includes('ui'),
    language: switchesLanguageAtRuntime(facts, answers) && libs.includes('common'),
  };
}

const SECTION = /^\{\{#(\w+)\}\}\n([\s\S]*?)^\{\{\/\1\}\}\n/gm;

/**
 * Keeps or drops every `{{#name}}` ... `{{/name}}` block, each tag on a line
 * of its own; a block nests other names. A name without a value, or a tag
 * left over, is a template bug, not output.
 */
export function renderSections(template: string, on: Readonly<Record<string, boolean>>, file: string): string {
  const rendered = template.replace(SECTION, (_match, name: string, body: string) => {
    const value = on[name];
    if (value === undefined) {
      throw new Error(`${file} uses {{#${name}}}, which has no value.`);
    }
    return value ? renderSections(body, on, file) : '';
  });
  const stray = /\{\{[#/]\w+\}\}/.exec(rendered);
  if (stray !== null) {
    throw new Error(`${file} leaves ${stray[0]} without its pair.`);
  }
  return rendered;
}

function sections(blocks: StarterBlocks): Readonly<Record<string, boolean>> {
  return {
    ...blocks,
    noFeedback: !blocks.feedback,
    chips: blocks.theme || blocks.a11y || blocks.feedback,
    try: blocks.feedback || blocks.a11y || blocks.language,
  };
}

function quoted(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// `./cngx-language`, relative to the component.
function languageModule(componentFile: string, rootProvidersFile: string): string {
  const relative = posix.relative(posix.dirname(componentFile), posix.dirname(rootProvidersFile));
  const module = posix.join(relative, posix.basename(CNGX_LANGUAGE_FILE, '.ts'));
  return module.startsWith('.') ? module : `./${module}`;
}

// Every import the blocks use, and no other: a block without its import
// does not compile, an import without its block is dead code.
function importLines(blocks: StarterBlocks, languageFrom: string): readonly string[] {
  const core = [
    'Component',
    ...(blocks.language ? ['computed'] : []),
    ...(blocks.feedback ? ['inject'] : []),
    'signal',
    ...(blocks.feedback ? ['viewChild'] : []),
  ];
  const cards = blocks.feedback || blocks.language;
  return [
    `import { ${core.join(', ')} } from '@angular/core';`,
    ...(blocks.routing ? ["import { RouterOutlet } from '@angular/router';"] : []),
    ...(cards ? ["import { CngxCard, CngxCardBody } from '@cngx/common/card';"] : []),
    ...(blocks.language ? ["import { CngxButtonToggle, CngxButtonToggleGroup } from '@cngx/common/interactive';"] : []),
    ...(blocks.a11y ? ["import { CngxA11yPanel } from '@cngx/ui/a11y';"] : []),
    ...(blocks.feedback
      ? ["import { CngxAlertStack, CngxBanner, CngxBannerOutlet, CngxToaster, CngxToastOutlet } from '@cngx/ui/feedback';"]
      : []),
    ...(blocks.language ? [`import { CNGX_LANGUAGE_PACKS, cngxLanguagePack } from '${languageFrom}';`] : []),
  ];
}

function componentImports(blocks: StarterBlocks): readonly string[] {
  const cards = blocks.feedback || blocks.language;
  return [
    ...(blocks.routing ? ['RouterOutlet'] : []),
    ...(cards ? ['CngxCard', 'CngxCardBody'] : []),
    ...(blocks.language ? ['CngxButtonToggleGroup', 'CngxButtonToggle'] : []),
    ...(blocks.a11y ? ['CngxA11yPanel'] : []),
    ...(blocks.feedback ? ['CngxAlertStack', 'CngxBannerOutlet', 'CngxToastOutlet'] : []),
  ];
}

/**
 * The starter's template files, read by the shell from `ng-add/files/starter`
 * next to the ng-add bundle (`readStarterTemplates`), so their text stays out
 * of the bundle.
 */
export interface StarterTemplates {
  readonly component: string;
  readonly template: string;
  readonly stylesheet: string;
  /**
   * The page styles that go into the global stylesheet (body margin,
   * headings, top bar, footer), scoped to the root selector, so the
   * component stylesheet stays inside the `ng new` component style budget.
   */
  readonly globalStyles: string;
  readonly favicon: string;
}

/** The three rendered bodies, without their fingerprint lines. */
export type StarterBodies = Readonly<Record<keyof ScaffoldFiles, string>>;

/** The page styles for the global stylesheet, scoped to `selector`, before their fingerprint line. */
export function renderStarterGlobalStyles(templates: StarterTemplates, selector: string): string {
  return fillTemplate(templates.globalStyles, { selector }, 'styles.css.tpl');
}

/** The page styles with their fingerprint line, as appended to the global stylesheet. */
export function stampedGlobalStyles(body: string): string {
  return `${starterFingerprintLine(contentFingerprint(body), 'block')}\n${body}`;
}

/** What a render needs beyond the blocks: the project, the selector and where the files sit. */
export interface StarterTarget {
  readonly project: string;
  readonly selector: string;
  readonly files: ScaffoldFiles;
  readonly rootProvidersFile: string;
}

/** The starter's `app.ts`, `app.html` and stylesheet for `blocks`, before their fingerprint lines. */
export function renderStarterBodies(templates: StarterTemplates, blocks: StarterBlocks, target: StarterTarget): StarterBodies {
  const on = sections(blocks);
  const { files } = target;
  const component = fillTemplate(
    renderSections(templates.component, on, 'app.ts.tpl'),
    {
      imports: importLines(blocks, languageModule(files.component, target.rootProvidersFile)).join('\n'),
      selector: quoted(target.selector),
      componentImports: componentImports(blocks).join(', '),
      templateFile: posix.relative(posix.dirname(files.component), files.template),
      stylesheetFile: posix.relative(posix.dirname(files.component), files.stylesheet),
      project: quoted(target.project),
    },
    'app.ts.tpl',
  );
  const template = fillTemplate(
    renderSections(templates.template, on, 'app.html.tpl'),
    { templatePath: files.template },
    'app.html.tpl',
  );
  return { component, template, stylesheet: templates.stylesheet };
}

/** Each body with the line recording its fingerprint on top, as written. */
export function renderStarter(bodies: StarterBodies): StarterBodies {
  const stamp = (body: string, comment: 'block' | 'html') => `${starterFingerprintLine(contentFingerprint(body), comment)}\n${body}`;
  return {
    component: stamp(bodies.component, 'block'),
    template: stamp(bodies.template, 'html'),
    stylesheet: stamp(bodies.stylesheet, 'block'),
  };
}

/** The fingerprints a starter written for `bodies` records. */
export function starterFingerprints(bodies: StarterBodies): Readonly<Record<keyof ScaffoldFiles, string>> {
  return {
    component: contentFingerprint(bodies.component),
    template: contentFingerprint(bodies.template),
    stylesheet: contentFingerprint(bodies.stylesheet),
  };
}

/**
 * The global stylesheet with the starter's page styles appended after a
 * blank line, in the file's newline; any other stylesheet as it is (the
 * apply-time re-check of the untouched file, cngx's theme import aside).
 */
export function withStarterGlobalStyles(content: string, path: string, block: string): string {
  if (!isUntouchedGlobalStyles(content, path)) {
    return content;
  }
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const ended = content === '' || content.endsWith('\n') ? content : `${content}${newline}`;
  const gap = ended === '' ? '' : newline;
  return `${ended}${gap}${block.replace(/\n/g, newline)}`;
}

function note(label: string, reason: string, provenance: Provenance): Change {
  return createNote({ id: STARTER_ID, label, reason, provenance });
}

type Untouched = Extract<AppScaffold, { kind: 'untouched' }>;

const FILE_KEYS = ['component', 'template', 'stylesheet'] as const;

function fileLabel(path: string): string {
  return `Replace ${path} with the cngx starter`;
}

function globalStylesLabel(path: string): string {
  return `Add the starter page styles to ${path}`;
}

function faviconLabel(path: string): string {
  return `Create ${path}`;
}

// The whole-file writes: each re-checks its file against the catalog entry
// detection matched at apply time and leaves anything else as it is, and
// takes the line endings of the file it replaces.
function fileWrites(scaffold: Untouched, written: StarterBodies, provenance: Provenance): readonly Change[] {
  const entries = scaffoldEntries(scaffold);
  return FILE_KEYS.map((key) => ({
    kind: 'edit-file',
    id: STARTER_ID,
    label: fileLabel(scaffold.files[key]),
    reason: 'the first screen shows what cngx installed, working',
    provenance,
    path: scaffold.files[key],
    edit: (content: string) =>
      matchesScaffoldEntry(content, entries[key], scaffold.names) ? written[key].replace(/\r?\n/g, newlineOf(content)) : content,
  }));
}

function globalStylesWrite(path: string, block: string, provenance: Provenance): Change {
  return {
    kind: 'edit-file',
    id: STARTER_ID,
    label: globalStylesLabel(path),
    reason: 'body { margin: 0 }, the headings, the top bar and the footer, scoped to the starter',
    provenance,
    path,
    edit: (content) => withStarterGlobalStyles(content, path, block),
  };
}

function iconLabel(index: IndexHtmlFacts): string {
  return `Point the icon link in ${index.path} at the cngx favicon`;
}

// The favicon and the icon link go together: both when `index.html` is the
// untouched file and no `favicon.svg` is there, neither otherwise.
function favicon(facts: ProjectFacts, scaffold: Untouched, svg: string, provenance: Provenance): StepResult {
  const { indexHtml: index, favicon: icon } = facts;
  const label = iconLabel(index);
  if (icon === undefined) {
    return { changes: [note(label, starterLeftOutText('no-public-folder'), provenance)], skipped: [] };
  }
  if (index.state !== 'untouched') {
    return index.state === 'absent'
      ? NOTHING
      : { changes: [note(label, starterLeftOutText('index-custom', index.path), provenance)], skipped: [] };
  }
  if (icon.fingerprint !== undefined) {
    return { changes: [note(label, starterLeftOutText('favicon-taken', icon.path), provenance)], skipped: [] };
  }
  return {
    changes: [
      {
        kind: 'create-file',
        id: STARTER_ID,
        label: faviconLabel(icon.path),
        reason: 'the cngx mark as the app icon',
        provenance,
        path: icon.path,
        content: svg,
      },
      {
        kind: 'edit-file',
        id: STARTER_ID,
        label,
        reason: 'favicon.svg instead of the Angular favicon.ico',
        provenance,
        path: index.path,
        // `withStarterFavicon` keeps a file without exactly one stock link as it is.
        edit: (content) => (indexMatches(content, scaffold) ? withStarterFavicon(content) : content),
      },
    ],
    skipped: [],
  };
}

function indexMatches(content: string, scaffold: Untouched): boolean {
  return matchesScaffoldEntry(content, { file: 'index.html', variant: 'default' }, scaffold.names);
}

// A spec next to the root component that is neither the untouched `ng new`
// spec nor that spec with the feedback providers: it may assert on the
// welcome page or render the outlets unprovided, so the starter stays out.
function customSpecOf(facts: ProjectFacts): string | undefined {
  const shell = facts.appShell;
  return shell.kind === 'followed' && shell.spec === 'custom' ? shell.specPath : undefined;
}

/** Whether this run writes the starter: asked for, the libs it composes selected, the untouched scaffold and no custom spec. */
export function writesStarter(facts: ProjectFacts, answers: OnboardingAnswers): boolean {
  const libs = selectedLibs(answers.libs);
  return (
    answers.starter &&
    libs.includes('common') &&
    libs.includes('ui') &&
    facts.scaffold.kind === 'untouched' &&
    facts.globalStyles?.state === 'untouched' &&
    customSpecOf(facts) === undefined
  );
}

function target(facts: ProjectFacts, files: ScaffoldFiles, selector: string): StarterTarget {
  return { project: facts.project, selector, files, rootProvidersFile: facts.rootProvidersFile };
}

function rendered(
  templates: StarterTemplates,
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  files: ScaffoldFiles,
  routing: boolean,
  selector: string,
): StarterBodies {
  return renderStarterBodies(templates, starterBlocks(facts, answers, routing), target(facts, files, selector));
}

// A starter cngx wrote: in place when its fingerprints match this run's
// render (with routing on or off, which the starter itself does not record),
// else written for other answers and left as it is.
function planWrittenStarter(
  templates: StarterTemplates,
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  scaffold: Extract<AppScaffold, { kind: 'starter' }>,
  provenance: Provenance,
): StepResult {
  const label = `Replace the Angular welcome app with the cngx starter in ${posix.dirname(scaffold.files.component)}`;
  const { selector } = scaffold;
  const current = [true, false].some((routing) => {
    if (selector === undefined) {
      return false;
    }
    const fingerprints = starterFingerprints(rendered(templates, facts, answers, scaffold.files, routing, selector));
    return (Object.keys(fingerprints) as (keyof ScaffoldFiles)[]).every((key) => fingerprints[key] === scaffold.fingerprints[key]);
  });
  if (!current) {
    return { changes: [note(label, starterLeftOutText('other-answers', scaffold.files.component), provenance)], skipped: [] };
  }
  // One skip per change the writing run planned, so the record holds the
  // same entries and a re-run writes no install manifest either.
  const icon = facts.favicon;
  const labels = [
    ...FILE_KEYS.map((key) => fileLabel(scaffold.files[key])),
    ...(facts.globalStyles?.state === 'starter' ? [globalStylesLabel(facts.globalStyles.path)] : []),
    ...(facts.indexHtml.state === 'starter' && icon !== undefined ? [faviconLabel(icon.path), iconLabel(facts.indexHtml)] : []),
  ];
  const skipped: readonly SkippedStep[] = labels.map((text) => ({ id: STARTER_ID, label: text, reason: 'already generated' }));
  return { changes: [], skipped };
}

/**
 * Replaces the App component of an untouched `ng new` standalone app with
 * the cngx starter when the `starter` answer is on (`--preset=full`): three
 * whole files, each re-checked against the scaffold at apply time, the page
 * styles appended to the untouched global stylesheet, and, when `index.html` is untouched too and the
 * public folder holds no `favicon.svg`, the cngx favicon and the icon link.
 * A starter cngx wrote is skipped; one rendered for other answers, and a
 * component that is not the untouched scaffold or sits next to a custom
 * spec, get a note and no write. A
 * starter this project's record wrote that is gone now was replaced on
 * purpose and is skipped. NgModule apps and a root cngx cannot follow get
 * nothing; the outlets step covers them.
 */
export function planStarter(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  recorded: readonly string[],
  templates: StarterTemplates,
): StepResult {
  if (!answers.starter) {
    return NOTHING;
  }
  const provenance = createProvenance('ng-add', versions.cngx);
  const shell = facts.appShell;
  if (shell.kind === 'unfollowed' || shell.importsHost.kind !== 'component') {
    return NOTHING;
  }
  const libs = selectedLibs(answers.libs);
  const label = `Replace the Angular welcome app with the cngx starter in ${posix.dirname(shell.componentFile)}`;
  if (!libs.includes('common') || !libs.includes('ui')) {
    return { changes: [note(label, starterLeftOutText('libs-missing'), provenance)], skipped: [] };
  }
  const scaffold = facts.scaffold;
  if (scaffold.kind === 'starter') {
    return planWrittenStarter(templates, facts, answers, scaffold, provenance);
  }
  if (scaffold.kind === 'custom') {
    return recorded.includes(STARTER_ID)
      ? { changes: [], skipped: [{ id: STARTER_ID, label, reason: 'the starter was replaced after cngx wrote it' }] }
      : { changes: [note(label, starterLeftOutText('not-untouched', shell.componentFile), provenance)], skipped: [] };
  }
  const spec = customSpecOf(facts);
  if (spec !== undefined) {
    return { changes: [note(label, starterLeftOutText('spec-custom', spec), provenance)], skipped: [] };
  }
  const styles = facts.globalStyles;
  if (styles === undefined) {
    return { changes: [note(label, starterLeftOutText('no-global-styles'), provenance)], skipped: [] };
  }
  if (styles.state !== 'untouched') {
    return { changes: [note(label, starterLeftOutText('styles-custom', styles.path), provenance)], skipped: [] };
  }
  const written = renderStarter(rendered(templates, facts, answers, scaffold.files, scaffold.routing, scaffold.names.selector));
  const block = stampedGlobalStyles(renderStarterGlobalStyles(templates, scaffold.names.selector));
  const icon = favicon(facts, scaffold, templates.favicon, provenance);
  return {
    changes: [...fileWrites(scaffold, written, provenance), globalStylesWrite(styles.path, block, provenance), ...icon.changes],
    skipped: icon.skipped,
  };
}
