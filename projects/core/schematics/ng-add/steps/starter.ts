import { posix } from 'node:path';

import {
  type Change,
  contentFingerprint,
  createNote,
  createProvenance,
  type Provenance,
  type SkippedStep,
  type StepResult,
} from '../../engine';
import {
  type AppScaffold,
  CNGX_LANGUAGE_FILE,
  type IndexHtmlFacts,
  matchesScaffoldEntry,
  type ProjectFacts,
  scaffoldEntries,
  type ScaffoldFiles,
  starterFingerprintLine,
  withStarterFavicon,
} from '../detect/detect';
// Sheriff resolves TypeScript modules only; the templates are text, bundled
// by the esbuild text loader, so there is no module boundary to check.
// eslint-disable-next-line @softarc/sheriff/dependency-rule, @softarc/sheriff/encapsulation
import STYLESHEET from '../templates/starter-app.css.tpl';
// eslint-disable-next-line @softarc/sheriff/dependency-rule, @softarc/sheriff/encapsulation
import TEMPLATE from '../templates/starter-app.html.tpl';
// eslint-disable-next-line @softarc/sheriff/dependency-rule, @softarc/sheriff/encapsulation
import COMPONENT from '../templates/starter-app.ts.tpl';
// eslint-disable-next-line @softarc/sheriff/dependency-rule, @softarc/sheriff/encapsulation
import FAVICON from '../templates/starter-favicon.svg.tpl';
import { canInstallTheme, selectedLibs } from './dependencies';
import { fillTemplate } from './helper-readme';
import { type OnboardingAnswers, type Versions } from './model';
import { switchesLanguageAtRuntime } from './providers';

export const STARTER_ID = 'app-shell:starter';

/** The rule the starter adds to the global stylesheet, so the page meets the window edge. */
export const STARTER_BODY_RULE = 'body {\n  margin: 0;\n}\n';

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
  'other-answers': ({ file }: StarterAt) =>
    `${file} holds the cngx starter of an earlier run with other answers; cngx does not rewrite it`,
  'index-custom': ({ file }: StarterAt) =>
    `${file} is not the untouched ng new file, so the starter leaves its icon link and favicon.svg alone`,
  'favicon-taken': ({ file }: StarterAt) =>
    `${file} exists and is not the cngx favicon, so the starter leaves it and the icon link alone`,
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

// The cngx mark, one line: three arcs in the brand colours and the ring in
// the text colour, so it follows the theme.
const MARK =
  '<svg class="brand__mark" viewBox="12 12 76 76" aria-hidden="true" focusable="false"><path d="M66.32 32.60A26 26 0 0 0 38.97 25.27" stroke="#ff8a1f" stroke-width="12" fill="none"/><path d="M30.99 29.51A26 26 0 0 0 30.99 70.49" stroke="#f2546b" stroke-width="12" fill="none"/><path d="M38.97 74.73A26 26 0 0 0 66.32 67.40" stroke="#d9429a" stroke-width="12" fill="none"/><circle cx="73" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="6.5"/></svg>';

const ICONS = [
  '        <a class="icon-btn" href="https://github.com/cngxjs/cngx" target="_blank" rel="noopener" aria-label="cngx on GitHub">',
  '          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
  '        </a>',
  '        <a class="icon-btn" href="https://www.npmjs.com/package/@cngx/core" target="_blank" rel="noopener" aria-label="@cngx/core on npm">',
  '          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>',
  '        </a>',
].join('\n');

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

/** The three rendered bodies, without their fingerprint lines. */
export type StarterBodies = Readonly<Record<keyof ScaffoldFiles, string>>;

/** What a render needs beyond the blocks: the project, the selector and where the files sit. */
export interface StarterTarget {
  readonly project: string;
  readonly selector: string;
  readonly files: ScaffoldFiles;
  readonly rootProvidersFile: string;
}

/** The starter's `app.ts`, `app.html` and stylesheet for `blocks`, before their fingerprint lines. */
export function renderStarterBodies(blocks: StarterBlocks, target: StarterTarget): StarterBodies {
  const on = sections(blocks);
  const { files } = target;
  const component = fillTemplate(
    renderSections(COMPONENT, on, 'starter-app.ts.tpl'),
    {
      imports: importLines(blocks, languageModule(files.component, target.rootProvidersFile)).join('\n'),
      selector: quoted(target.selector),
      componentImports: componentImports(blocks).join(', '),
      templateFile: posix.relative(posix.dirname(files.component), files.template),
      stylesheetFile: posix.relative(posix.dirname(files.component), files.stylesheet),
      project: quoted(target.project),
    },
    'starter-app.ts.tpl',
  );
  const template = fillTemplate(
    renderSections(TEMPLATE, on, 'starter-app.html.tpl'),
    { mark: MARK, icons: ICONS, templatePath: files.template },
    'starter-app.html.tpl',
  );
  return { component, template, stylesheet: STYLESHEET };
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

/** The favicon the starter writes, the cngx mark whose ring follows the colour scheme. */
export const STARTER_FAVICON = FAVICON;

/** The stylesheet with the body rule appended once. */
export function withStarterBodyRule(content: string): string {
  if (content.replace(/\r\n/g, '\n').includes(STARTER_BODY_RULE)) {
    return content;
  }
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const ended = content === '' || content.endsWith('\n') ? content : `${content}${newline}`;
  const gap = ended === '' ? '' : newline;
  return `${ended}${gap}${STARTER_BODY_RULE.replace(/\n/g, newline)}`;
}

function note(label: string, reason: string, provenance: Provenance): Change {
  return createNote({ id: STARTER_ID, label, reason, provenance });
}

type Untouched = Extract<AppScaffold, { kind: 'untouched' }>;

const FILE_KEYS = ['component', 'template', 'stylesheet'] as const;

function fileLabel(path: string): string {
  return `Replace ${path} with the cngx starter`;
}

function bodyRuleLabel(path: string): string {
  return `Let the starter page meet the window edge in ${path}`;
}

function faviconLabel(path: string): string {
  return `Create ${path}`;
}

// The whole-file writes: each re-checks its file against the catalog entry
// detection matched at apply time and leaves anything else as it is.
function fileWrites(scaffold: Untouched, written: StarterBodies, provenance: Provenance): readonly Change[] {
  const entries = scaffoldEntries(scaffold);
  return FILE_KEYS.map((key) => ({
    kind: 'edit-file',
    id: STARTER_ID,
    label: fileLabel(scaffold.files[key]),
    reason: 'the first screen shows what cngx installed, working',
    provenance,
    path: scaffold.files[key],
    edit: (content: string) => (matchesScaffoldEntry(content, entries[key], scaffold.names) ? written[key] : content),
  }));
}

function bodyRule(facts: ProjectFacts, provenance: Provenance): readonly Change[] {
  const path = facts.stylesPath;
  return path === undefined
    ? []
    : [
        {
          kind: 'edit-file',
          id: STARTER_ID,
          label: bodyRuleLabel(path),
          reason: 'body { margin: 0 } in the global styles',
          provenance,
          path,
          edit: withStarterBodyRule,
        },
      ];
}

function iconLabel(index: IndexHtmlFacts): string {
  return `Point the icon link in ${index.path} at the cngx favicon`;
}

// The favicon and the icon link go together: both when `index.html` is the
// untouched file and no `favicon.svg` is there, neither otherwise.
function favicon(facts: ProjectFacts, scaffold: Untouched, provenance: Provenance): StepResult {
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
        content: STARTER_FAVICON,
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

/** Whether this run writes the starter: asked for, the libs it composes selected, the untouched scaffold. */
export function writesStarter(facts: ProjectFacts, answers: OnboardingAnswers): boolean {
  const libs = selectedLibs(answers.libs);
  return answers.starter && libs.includes('common') && libs.includes('ui') && facts.scaffold.kind === 'untouched';
}

function target(facts: ProjectFacts, files: ScaffoldFiles, selector: string): StarterTarget {
  return { project: facts.project, selector, files, rootProvidersFile: facts.rootProvidersFile };
}

function rendered(facts: ProjectFacts, answers: OnboardingAnswers, files: ScaffoldFiles, routing: boolean, selector: string): StarterBodies {
  return renderStarterBodies(starterBlocks(facts, answers, routing), target(facts, files, selector));
}

// A starter cngx wrote: in place when its fingerprints match this run's
// render (with routing on or off, which the starter itself does not record),
// else written for other answers and left as it is.
function planWrittenStarter(
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
    const fingerprints = starterFingerprints(rendered(facts, answers, scaffold.files, routing, selector));
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
    ...(facts.stylesPath === undefined ? [] : [bodyRuleLabel(facts.stylesPath)]),
    ...(facts.indexHtml.state === 'starter' && icon !== undefined ? [faviconLabel(icon.path), iconLabel(facts.indexHtml)] : []),
  ];
  const skipped: readonly SkippedStep[] = labels.map((text) => ({ id: STARTER_ID, label: text, reason: 'already generated' }));
  return { changes: [], skipped };
}

/**
 * Replaces the App component of an untouched `ng new` standalone app with
 * the cngx starter when the `starter` answer is on (`--preset=full`): three
 * whole files, each re-checked against the scaffold at apply time, the body
 * rule in the global styles, and, when `index.html` is untouched too and the
 * public folder holds no `favicon.svg`, the cngx favicon and the icon link.
 * A starter cngx wrote is skipped; one rendered for other answers, and a
 * component that is not the untouched scaffold, get a note and no write. A
 * starter this project's record wrote that is gone now was replaced on
 * purpose and is skipped. NgModule apps and a root cngx cannot follow get
 * nothing; the outlets step covers them.
 */
export function planStarter(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  recorded: readonly string[],
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
    return planWrittenStarter(facts, answers, scaffold, provenance);
  }
  if (scaffold.kind === 'custom') {
    return recorded.includes(STARTER_ID)
      ? { changes: [], skipped: [{ id: STARTER_ID, label, reason: 'the starter was replaced after cngx wrote it' }] }
      : { changes: [note(label, starterLeftOutText('not-untouched', shell.componentFile), provenance)], skipped: [] };
  }
  const written = renderStarter(rendered(facts, answers, scaffold.files, scaffold.routing, scaffold.names.selector));
  const icon = favicon(facts, scaffold, provenance);
  return {
    changes: [...fileWrites(scaffold, written, provenance), ...bodyRule(facts, provenance), ...icon.changes],
    skipped: icon.skipped,
  };
}
