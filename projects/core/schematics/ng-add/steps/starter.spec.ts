import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { readWorkspace } from '@schematics/angular/utility';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { describe, expect, it } from 'vitest';

import { contentFingerprint, type EditFile, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { createFixtureTree, type FixtureName, readFixture } from '../../testing/run-schematic';
import { type AppScaffold, detectProject, type ProjectFacts, starterFingerprintOf } from '../detect/detect';
import { type OnboardingAnswers } from './model';
import {
  planStarter,
  renderSections,
  renderStarter,
  renderStarterBodies,
  STARTER_BODY_RULE,
  STARTER_FAVICON,
  STARTER_ID,
  STARTER_LEFT_OUT_REASONS,
  type StarterBlocks,
  starterFingerprints,
  starterLeftOutText,
  withStarterBodyRule,
  writesStarter,
} from './starter';

const FILES = { component: 'src/app/app.ts', template: 'src/app/app.html', stylesheet: 'src/app/app.css' };
const TARGET = { project: 'fixture-app', selector: 'app-root', files: FILES, rootProvidersFile: 'src/app/app.config.ts' };
const NAMES = { project: 'fixture-app', selector: 'app-root' };
const STOCK = readFixture('scaffold-21');

const UNTOUCHED: AppScaffold = { kind: 'untouched', files: FILES, routing: true, variant: 'routing-css', names: NAMES };

const FULL = createAnswers({ preset: 'full', feedback: true, floatingFallback: true, starter: true });

function untouchedFacts(overrides: Partial<ProjectFacts> = {}): ProjectFacts {
  return createFacts({ scaffold: UNTOUCHED, favicon: { path: 'public/favicon.svg', fingerprint: undefined }, ...overrides });
}

async function factsOf(fixture: FixtureName, files: Readonly<Record<string, string>> = {}): Promise<ProjectFacts> {
  const tree = createFixtureTree(fixture, files);
  return detectProject(tree, await readWorkspace(tree));
}

function edits(result: StepResult): readonly EditFile[] {
  return result.changes.filter((change): change is EditFile => change.kind === 'edit-file');
}

function edited(result: StepResult, path: string, content: string): string {
  const change = edits(result).find((candidate) => candidate.path === path);
  if (change === undefined) {
    throw new Error(`no edit of ${path} planned`);
  }
  return change.edit(content);
}

const ALL_BLOCKS: readonly StarterBlocks[] = [0, 1].flatMap((routing) =>
  [0, 1].flatMap((theme) =>
    [0, 1].flatMap((a11y) =>
      [0, 1].flatMap((feedback) =>
        [0, 1].map((language) => ({
          routing: routing === 1,
          theme: theme === 1,
          a11y: a11y === 1,
          feedback: feedback === 1,
          language: language === 1,
        })),
      ),
    ),
  ),
);

// The class each template selector needs in `imports`.
const SELECTORS: Readonly<Record<string, string>> = {
  '<router-outlet': 'RouterOutlet',
  '<cngx-card ': 'CngxCard',
  cngxCardBody: 'CngxCardBody',
  '<cngx-button-toggle-group': 'CngxButtonToggleGroup',
  cngxButtonToggle: 'CngxButtonToggle',
  '<cngx-a11y-panel': 'CngxA11yPanel',
  '<cngx-alert-stack': 'CngxAlertStack',
  '<cngx-banner-outlet': 'CngxBannerOutlet',
  '<cngx-toast-outlet': 'CngxToastOutlet',
};

function importedNames(source: ts.SourceFile): readonly string[] {
  return source.statements.filter(ts.isImportDeclaration).flatMap((statement) => {
    const bindings = statement.importClause?.namedBindings;
    return bindings !== undefined && ts.isNamedImports(bindings) ? bindings.elements.map((element) => element.name.text) : [];
  });
}

function decoratorImports(component: string): readonly string[] {
  const match = /imports: \[([^\]]*)\]/.exec(component);
  return (match?.[1] ?? '').split(',').map((name) => name.trim()).filter((name) => name !== '');
}

function blocksName(blocks: StarterBlocks): string {
  return Object.entries(blocks).map(([key, on]) => `${on ? '+' : '-'}${key}`).join(' ');
}

describe('renderStarterBodies', () => {
  it.each(ALL_BLOCKS.map((blocks) => [blocksName(blocks), blocks] as const))('%s imports exactly what it uses', (_name, blocks) => {
    const { component, template } = renderStarterBodies(blocks, TARGET);
    const source = ts.createSourceFile('app.ts', component, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const listed = decoratorImports(component);

    expect(ts.transpileModule(component, { reportDiagnostics: true }).diagnostics ?? []).toEqual([]);
    // Every imported name is used again in the file: no import without its block.
    for (const name of importedNames(source)) {
      const uses = component.split(new RegExp(`\\b${name}\\b`)).length - 1;
      expect({ name, used: uses >= 2 }).toEqual({ name, used: true });
    }
    // Every selector in the template has its class listed, and no class is listed without one.
    for (const [selector, className] of Object.entries(SELECTORS)) {
      expect({ className, listed: listed.includes(className) }).toEqual({ className, listed: template.includes(selector) });
    }
    // Every handler the template calls is a member, and the other way round.
    for (const handler of ['showToast', 'showBanner', 'showAlert', 'setLanguage', 'language']) {
      expect({ handler, member: component.includes(`protected ${handler}(`) || component.includes(`protected readonly ${handler} `) }).toEqual({
        handler,
        member: template.includes(`${handler}(`),
      });
    }
    expect({ template: /\{\{[#/]\w+\}\}/.test(template), component: /\{\{\w+\}\}/.test(component) }).toEqual({
      template: false,
      component: false,
    });
  });

  it('keeps the heading and the title signal the stock spec asserts', () => {
    for (const blocks of ALL_BLOCKS) {
      const { component, template } = renderStarterBodies(blocks, TARGET);

      expect(component).toContain("protected readonly title = signal('fixture-app');");
      expect(template).toContain('<h1 id="hero-title">Hello, <span class="hero__name">{{ title() }}</span>.</h1>');
    }
  });

  it('places the outlets with feedback only: the banner first, the toast last', () => {
    const on = renderStarterBodies({ ...ALL_BLOCKS[0], feedback: true }, TARGET).template;
    const off = renderStarterBodies({ ...ALL_BLOCKS[0], feedback: false }, TARGET).template;

    expect(on.startsWith('<cngx-banner-outlet />\n')).toBe(true);
    expect(on.endsWith('<cngx-toast-outlet />\n')).toBe(true);
    expect(off).not.toMatch(/outlet/);
  });

  it('renders the router outlet only with routing', () => {
    expect(renderStarterBodies({ ...ALL_BLOCKS[0], routing: true }, TARGET).template).toContain('<router-outlet />');
    expect(renderStarterBodies({ ...ALL_BLOCKS[0], routing: false }, TARGET).template).not.toContain('router-outlet');
  });

  it('labels the language toggle and marks the German choice as German', () => {
    const { template, component } = renderStarterBodies({ ...ALL_BLOCKS[0], language: true }, TARGET);

    expect(template).toContain('<cngx-button-toggle-group label="Language"');
    expect(template).toContain('<button cngxButtonToggle value="de" lang="de">Deutsch</button>');
    expect(component).toContain("from './cngx-language';");
  });

  it('imports the language file relative to the component', () => {
    const { component } = renderStarterBodies(
      { ...ALL_BLOCKS[0], language: true },
      { ...TARGET, files: { ...FILES, component: 'src/app/shell/app.ts' } },
    );

    expect(component).toContain("from '../cngx-language';");
  });

  it('names the template the user edits and keeps the doctor command out of Angular interpolation', () => {
    const { template } = renderStarterBodies(ALL_BLOCKS[0], TARGET);

    expect(template).toContain('This page lives in <code>src/app/app.html</code>.');
    expect(template).toContain('<code>npx &#64;cngx/doctor</code>');
  });

  it('shows the toast button as the solid call to action with feedback, the docs link without it', () => {
    const on = renderStarterBodies({ ...ALL_BLOCKS[0], feedback: true }, TARGET).template;
    const off = renderStarterBodies({ ...ALL_BLOCKS[0], feedback: false }, TARGET).template;

    expect(on).toContain('<button type="button" class="cta cta--solid" (click)="showToast()">Show a toast');
    expect(on).toContain('<a class="cta cta--ghost" href="https://cngxjs.github.io/cngx/"');
    expect(off).toContain('<a class="cta cta--solid" href="https://cngxjs.github.io/cngx/"');
  });

  it('drops the chips, the try section and its nav link when nothing was installed to try', () => {
    const { template } = renderStarterBodies(ALL_BLOCKS[0], TARGET);

    expect(template).not.toContain('class="chips"');
    expect(template).not.toContain('id="try"');
    expect(template).not.toContain('href="#try"');
  });

  it('reads the brand gradient token with a local fallback', () => {
    expect(renderStarterBodies(ALL_BLOCKS[0], TARGET).stylesheet).toContain(
      '--brand: var(--cngx-gradient-brand, linear-gradient(100deg, var(--accent), var(--accent-2)));',
    );
  });
});

describe('renderStarter', () => {
  it('records the fingerprint of each body on its first line, stable across renders', () => {
    const bodies = renderStarterBodies(ALL_BLOCKS[31], TARGET);
    const written = renderStarter(bodies);

    expect(renderStarter(renderStarterBodies(ALL_BLOCKS[31], TARGET))).toEqual(written);
    expect(starterFingerprintOf(written.component)).toBe(contentFingerprint(bodies.component));
    expect(written.component.split('\n')[0]).toBe(`/* cngx:fingerprint ${contentFingerprint(bodies.component)} */`);
    expect(written.template.split('\n')[0]).toBe(`<!-- cngx:fingerprint ${contentFingerprint(bodies.template)} -->`);
    expect(starterFingerprintOf(written.stylesheet)).toBe(contentFingerprint(bodies.stylesheet));
  });
});

describe('renderSections', () => {
  it('keeps or drops nested blocks', () => {
    expect(renderSections('a\n{{#x}}\nb\n{{#y}}\nc\n{{/y}}\n{{/x}}\nd\n', { x: true, y: false }, 't')).toBe('a\nb\nd\n');
  });

  it('names a block without a value and a tag without its pair', () => {
    expect(() => renderSections('{{#x}}\n{{/x}}\n', {}, 'starter.tpl')).toThrow('starter.tpl uses {{#x}}, which has no value.');
    expect(() => renderSections('{{#x}}\n', { x: true }, 'starter.tpl')).toThrow('starter.tpl leaves {{#x}} without its pair.');
  });
});

describe('withStarterBodyRule', () => {
  it('appends the rule once, after a blank line, in the file newline', () => {
    const once = withStarterBodyRule("@import 'a.css';\n");

    expect(once).toBe(`@import 'a.css';\n\n${STARTER_BODY_RULE}`);
    expect(withStarterBodyRule(once)).toBe(once);
    expect(withStarterBodyRule('a {}\r\n')).toBe('a {}\r\n\r\nbody {\r\n  margin: 0;\r\n}\r\n');
    expect(withStarterBodyRule('')).toBe(STARTER_BODY_RULE);
  });
});

describe('planStarter', () => {
  it('writes the three files, the body rule, the favicon and the icon link over the untouched scaffold', () => {
    const result = planStarter(untouchedFacts(), FULL, VERSIONS, []);

    expect(result.changes.map((change) => [change.kind, change.id, 'path' in change ? change.path : ''])).toEqual([
      ['edit-file', STARTER_ID, 'src/app/app.ts'],
      ['edit-file', STARTER_ID, 'src/app/app.html'],
      ['edit-file', STARTER_ID, 'src/app/app.css'],
      ['edit-file', STARTER_ID, 'src/styles.css'],
      ['create-file', STARTER_ID, 'public/favicon.svg'],
      ['edit-file', STARTER_ID, 'src/index.html'],
    ]);
    expect(result.changes.find((change) => change.kind === 'create-file')).toMatchObject({ content: STARTER_FAVICON });
    expect(writesStarter(untouchedFacts(), FULL)).toBe(true);
  });

  it('re-checks each file at apply time and leaves one that changed since detection as it is', () => {
    const result = planStarter(untouchedFacts(), FULL, VERSIONS, []);
    const changedApp = `${STOCK['src/app/app.ts']}// mine\n`;

    expect(edited(result, 'src/app/app.ts', STOCK['src/app/app.ts'])).toContain('/* cngx:fingerprint ');
    expect(edited(result, 'src/app/app.ts', changedApp)).toBe(changedApp);
    expect(edited(result, 'src/app/app.html', `${STOCK['src/app/app.html']} `)).toBe(`${STOCK['src/app/app.html']} `);
    expect(edited(result, 'src/app/app.css', 'p {}\n')).toBe('p {}\n');
    expect(edited(result, 'src/index.html', `${STOCK['src/index.html']}\n`)).toBe(`${STOCK['src/index.html']}\n`);
    expect(edited(result, 'src/index.html', STOCK['src/index.html'])).toContain('href="favicon.svg"');
  });

  it('plans nothing without the starter answer, for an NgModule root or a root cngx cannot follow', () => {
    const ngModule = createFacts({
      scaffold: { kind: 'custom' },
      appShell: { ...untouchedFacts().appShell, importsHost: { file: 'src/app/app-module.ts', kind: 'ng-module', className: 'AppModule' } } as ProjectFacts['appShell'],
    });
    const unfollowed = createFacts({ appShell: { kind: 'unfollowed', reason: 'main-missing', subject: '', file: 'src/main.ts' } });

    expect(planStarter(untouchedFacts(), { ...FULL, starter: false }, VERSIONS, [])).toEqual({ changes: [], skipped: [] });
    expect(planStarter(ngModule, FULL, VERSIONS, [])).toEqual({ changes: [], skipped: [] });
    expect(planStarter(unfollowed, FULL, VERSIONS, [])).toEqual({ changes: [], skipped: [] });
    expect(writesStarter(ngModule, FULL)).toBe(false);
  });

  it('names a component that is not the untouched scaffold instead of writing over it', () => {
    const result = planStarter(createFacts({ scaffold: { kind: 'custom' } }), FULL, VERSIONS, []);

    expect(result.changes).toEqual([
      expect.objectContaining({ kind: 'note', id: STARTER_ID, reason: starterLeftOutText('not-untouched', 'src/app/app.ts') }),
    ]);
  });

  it('skips a starter its record wrote that was replaced since, without a note', () => {
    const result = planStarter(createFacts({ scaffold: { kind: 'custom' } }), FULL, VERSIONS, [STARTER_ID]);

    expect(result).toEqual({
      changes: [],
      skipped: [expect.objectContaining({ id: STARTER_ID, reason: 'the starter was replaced after cngx wrote it' })],
    });
  });

  it('names the libs the starter composes when one is not selected', () => {
    const result = planStarter(untouchedFacts(), { ...FULL, libs: ['forms'] }, VERSIONS, []);

    expect(result.changes).toEqual([expect.objectContaining({ kind: 'note', reason: starterLeftOutText('libs-missing') })]);
    expect(writesStarter(untouchedFacts(), { ...FULL, libs: ['forms'] })).toBe(false);
  });

  it.each([
    ['an index.html that is not untouched', { indexHtml: { path: 'src/index.html', state: 'custom' } }, starterLeftOutText('index-custom', 'src/index.html')],
    ['a favicon.svg that is already there', { favicon: { path: 'public/favicon.svg', fingerprint: '00000000' } }, starterLeftOutText('favicon-taken', 'public/favicon.svg')],
    ['no public folder', { favicon: undefined }, starterLeftOutText('no-public-folder')],
  ] as const)('writes the starter but leaves the icon to %s with a note', (_name, overrides, reason) => {
    const result = planStarter(untouchedFacts(overrides as Partial<ProjectFacts>), FULL, VERSIONS, []);

    expect(edits(result).map((change) => change.path)).toEqual(['src/app/app.ts', 'src/app/app.html', 'src/app/app.css', 'src/styles.css']);
    expect(result.changes.filter((change) => change.kind === 'note')).toEqual([expect.objectContaining({ reason })]);
  });

  it('leaves the icon alone without a word when there is no index.html', () => {
    const result = planStarter(untouchedFacts({ indexHtml: { path: 'src/index.html', state: 'absent' } }), FULL, VERSIONS, []);

    expect(result.changes.filter((change) => change.kind !== 'edit-file')).toEqual([]);
  });

  it('skips a starter cngx wrote for these answers, once per change the writing run planned', () => {
    const bodies = renderStarterBodies(
      { routing: true, theme: true, a11y: true, feedback: true, language: false },
      TARGET,
    );
    const facts = untouchedFacts({
      scaffold: { kind: 'starter', files: FILES, fingerprints: starterFingerprints(bodies), selector: 'app-root' },
      indexHtml: { path: 'src/index.html', state: 'starter' },
      favicon: { path: 'public/favicon.svg', fingerprint: contentFingerprint(STARTER_FAVICON) },
    });
    const first = planStarter(untouchedFacts(), FULL, VERSIONS, []);
    const again = planStarter(facts, FULL, VERSIONS, [STARTER_ID]);

    expect(again.changes).toEqual([]);
    expect(again.skipped.map((step) => step.label)).toEqual(first.changes.map((change) => change.label));
    expect(again.skipped.every((step) => step.id === STARTER_ID && step.reason === 'already generated')).toBe(true);
  });

  it('recognises a starter written without routing as current too', () => {
    const bodies = renderStarterBodies({ routing: false, theme: true, a11y: true, feedback: true, language: false }, TARGET);
    const facts = untouchedFacts({
      scaffold: { kind: 'starter', files: FILES, fingerprints: starterFingerprints(bodies), selector: 'app-root' },
    });

    expect(planStarter(facts, FULL, VERSIONS, []).changes).toEqual([]);
  });

  it('names a starter cngx wrote for other answers and leaves it as it is', () => {
    const bodies = renderStarterBodies({ routing: true, theme: true, a11y: false, feedback: false, language: false }, TARGET);
    const facts = untouchedFacts({
      scaffold: { kind: 'starter', files: FILES, fingerprints: starterFingerprints(bodies), selector: 'app-root' },
    });

    expect(planStarter(facts, FULL, VERSIONS, [STARTER_ID])).toEqual({
      changes: [expect.objectContaining({ kind: 'note', reason: starterLeftOutText('other-answers', 'src/app/app.ts') })],
      skipped: [],
    });
  });

  it.each([
    ['scaffold-21', 'src/app/app.css', true],
    ['scaffold-21-routing-off', 'src/app/app.css', false],
    ['scaffold-21-zone', 'src/app/app.css', true],
    ['scaffold-21-scss', 'src/app/app.scss', true],
  ] as const)('writes the starter over %s', async (fixture, stylesheet, routing) => {
    const facts = await factsOf(fixture);
    const result = planStarter(facts, FULL, VERSIONS, []);
    const files = readFixture(fixture);
    const component = edited(result, 'src/app/app.ts', files['src/app/app.ts']);

    expect(edits(result).map((change) => change.path)).toEqual([
      'src/app/app.ts',
      'src/app/app.html',
      stylesheet,
      fixture === 'scaffold-21-scss' ? 'src/styles.scss' : 'src/styles.css',
      'src/index.html',
    ]);
    expect(component).toContain(`styleUrl: './${stylesheet.split('/').pop() ?? ''}'`);
    expect(component.includes('RouterOutlet')).toBe(routing);
    expect(edited(result, stylesheet, files[stylesheet])).toContain('--cngx-gradient-brand');
  });

  it('renders the language toggle only when the runtime switch is wired through cngx-language.ts', () => {
    const german = { ...FULL, i18n: 'de', runtimeSwitch: true } as const;
    const component = (facts: ProjectFacts, answers: OnboardingAnswers) =>
      edited(planStarter(facts, answers, VERSIONS, []), 'src/app/app.ts', STOCK['src/app/app.ts']);

    expect(component(untouchedFacts(), german)).toContain('cngxLanguagePack.set(');
    expect(component(untouchedFacts(), FULL)).not.toContain('cngxLanguagePack');
    expect(component(untouchedFacts({ languageFile: 'foreign' }), german)).not.toContain('cngxLanguagePack');
    expect(
      component(untouchedFacts({ rootProviders: ['provideCngxI18n'], languagePack: { name: 'CNGX_LANGUAGE_DE', module: '@cngx/core/i18n/de', text: 'CNGX_LANGUAGE_DE' } }), german),
    ).not.toContain('cngxLanguagePack');
  });

  it('does not mutate its inputs', () => {
    expect(() => planStarter(deepFreeze(untouchedFacts()), deepFreeze(FULL), VERSIONS, deepFreeze([]))).not.toThrow();
  });
});

describe('STARTER_LEFT_OUT_REASONS', () => {
  const install = readFileSync(join(__dirname, '../../../../../core-concepts/install.md'), 'utf8');

  it.each(Object.keys(STARTER_LEFT_OUT_REASONS) as (keyof typeof STARTER_LEFT_OUT_REASONS)[])(
    'core-concepts/install.md lists the %s text',
    (reason) => {
      expect(install).toContain(starterLeftOutText(reason, '<file>'));
    },
  );
});
