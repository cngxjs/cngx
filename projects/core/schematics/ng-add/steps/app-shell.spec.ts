import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { createProvenance, type StepResult } from '../../engine';
import { createAnswers, createFacts, VERSIONS } from '../../testing/onboarding';
import { createFixtureTree, type FixtureName, readFixture } from '../../testing/run-schematic';
import { type AppShell, appShellSpecOf, type AppShellUnfollowed, detectProject, type ProjectFacts } from '../detect/detect';
import { OUTLETS_ID, OUTLETS_SNIPPET, planAppShell, planAppShellRerun, provideFeedbackInSpec, SPEC_ID } from './app-shell';

const FEEDBACK = createAnswers({ feedback: true });

type Files = Record<string, string>;

async function factsOf(name: FixtureName, overrides: Readonly<Files> = {}): Promise<{ facts: ProjectFacts; files: Files }> {
  const tree = createFixtureTree(name, overrides);
  return { facts: detectProject(tree, await readWorkspace(tree)), files: { ...readFixture(name), ...overrides } };
}

// Runs every planned edit over the files, as apply does.
function applied(result: StepResult, files: Readonly<Files>): Files {
  const next = { ...files };
  for (const change of result.changes) {
    if (change.kind === 'edit-file') {
      next[change.path] = change.edit(next[change.path]);
    }
  }
  return next;
}

// The syntax errors TypeScript reports for a file, as messages.
function syntaxErrors(content: string): readonly string[] {
  const { diagnostics = [] } = ts.transpileModule(content, { reportDiagnostics: true, fileName: 'app.ts' });
  return diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

const UNFOLLOWED: AppShellUnfollowed = { kind: 'unfollowed', reason: 'no-bootstrap-call', subject: '', file: 'src/main.ts' };
const UNFOLLOWED_TEXT = 'src/main.ts has no bootstrapApplication(<Component>) or bootstrapModule(<NgModule>) call cngx can read';

function followed(facts: ProjectFacts): AppShell {
  if (facts.appShell.kind !== 'followed') {
    throw new Error('main.ts not followed');
  }
  return facts.appShell;
}

function plan(facts: ProjectFacts, recorded: readonly string[] = [], explicit = false): StepResult {
  return planAppShell(facts, FEEDBACK, VERSIONS, recorded, explicit);
}

const INLINE_APP = `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: \`
    <main>
      <router-outlet />
    </main>
  \`,
})
export class App {}
`;

const NGMODULE_MAIN = `import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;

const NGMODULE = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule
  ],
  bootstrap: [App]
})
export class AppModule { }
`;

const NGMODULE_APP = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
})
export class App {}
`;

describe('planAppShell', () => {
  it('places both outlets in the standalone template file and imports them into the component', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const result = plan(facts);
    const next = applied(result, files);

    expect(result.changes.map((change) => [change.id, change.label])).toEqual([
      [OUTLETS_ID, 'Place the toast and banner outlets in src/app/app.html'],
      [OUTLETS_ID, 'Import the toast and banner outlets in src/app/app.ts'],
      [SPEC_ID, 'Provide the feedback services in src/app/app.spec.ts'],
    ]);
    expect(result.changes[0].reason).toBe('CngxToaster and CngxBanner render nowhere without them');
    expect(next['src/app/app.html'].endsWith('\n<cngx-banner-outlet />\n<router-outlet />\n<cngx-toast-outlet />\n')).toBe(true);
    expect(next['src/app/app.ts']).toContain('imports: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet],');
    expect(next['src/app/app.ts']).toContain(
      "import { RouterOutlet } from '@angular/router';\nimport { CngxBannerOutlet, CngxToastOutlet } from '@cngx/ui/feedback';\n",
    );
  });

  it('appends both outlets after the placeholder when there is no router outlet', async () => {
    const { facts, files } = await factsOf('scaffold-21-routing-off');
    const next = applied(plan(facts), files);

    expect(next['src/app/app.html'].startsWith(files['src/app/app.html'])).toBe(true);
    expect(next['src/app/app.html'].endsWith('\n<cngx-banner-outlet />\n<cngx-toast-outlet />\n')).toBe(true);
    expect(next['src/app/app.ts']).toContain('imports: [CngxBannerOutlet, CngxToastOutlet],');
  });

  it('edits an inline template in place, in one change with the imports', async () => {
    const { facts, files } = await factsOf('standalone-app', { 'src/app/app.ts': INLINE_APP });
    const result = plan(facts);
    const next = applied(result, files);

    expect(result.changes.map((change) => change.label)).toEqual(['Place the toast and banner outlets in src/app/app.ts']);
    expect(next['src/app/app.ts']).toContain('      <cngx-banner-outlet />\n      <router-outlet />\n');
    expect(next['src/app/app.ts']).toContain('    </main>\n    <cngx-toast-outlet />\n  `,');
    expect(next['src/app/app.ts']).toContain('imports: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet],');
  });

  it('names the snippet instead of writing into a single- or double-quoted inline template', async () => {
    for (const quoted of ["'<main><router-outlet /></main>'", '"<main><router-outlet /></main>"']) {
      const app = INLINE_APP.replace(/`\n    <main>\n      <router-outlet \/>\n    <\/main>\n  `/, quoted);
      const { facts, files } = await factsOf('standalone-app', { 'src/app/app.ts': app });
      const result = plan(facts);

      expect(result.changes).toMatchObject([
        {
          kind: 'note',
          id: OUTLETS_ID,
          reason: `the inline template of App in src/app/app.ts is a quoted string, which cngx does not rewrite into a multi-line template; ${OUTLETS_SNIPPET}`,
        },
      ]);
      expect(applied(result, files)['src/app/app.ts']).toBe(app);
    }
  });

  it('only imports the outlets of a quoted inline template that already holds both, and the file still parses', async () => {
    const app = INLINE_APP.replace(
      /`\n    <main>\n      <router-outlet \/>\n    <\/main>\n  `/,
      "'<cngx-banner-outlet /><router-outlet /><cngx-toast-outlet />'",
    );
    const { facts, files } = await factsOf('standalone-app', { 'src/app/app.ts': app });
    const next = applied(plan(facts), files)['src/app/app.ts'];

    expect(next).toContain("template: '<cngx-banner-outlet /><router-outlet /><cngx-toast-outlet />',");
    expect(next).toContain('imports: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet],');
    expect(syntaxErrors(next)).toEqual([]);
  });

  it('writes the newline of a CRLF host file into a one-line inline template', async () => {
    const app = INLINE_APP.replace(/`\n    <main>\n      <router-outlet \/>\n    <\/main>\n  `/, '`<router-outlet />`').replace(
      /\n/g,
      '\r\n',
    );
    const { facts, files } = await factsOf('standalone-app', { 'src/app/app.ts': app });
    const next = applied(plan(facts), files)['src/app/app.ts'];

    expect(next).toContain('template: `<cngx-banner-outlet />\r\n<router-outlet />\r\n<cngx-toast-outlet />\r\n`,');
    expect(next).not.toMatch(/[^\r]\n/);
    expect(syntaxErrors(next)).toEqual([]);
  });

  it('places the banner from the detected router outlet fact, not from a second read of the template', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const shell = followed(facts);
    const outlets = shell.outlets.kind === 'editable' ? { ...shell.outlets, routerOutlet: false } : shell.outlets;
    const next = applied(plan({ ...facts, appShell: { ...shell, outlets } }), files);

    expect(next['src/app/app.html'].endsWith('\n<router-outlet />\n<cngx-banner-outlet />\n<cngx-toast-outlet />\n')).toBe(true);
  });

  it('stamps the cngx version of the run on every change', async () => {
    const { facts } = await factsOf('scaffold-21');

    expect(plan(facts).changes.every((change) => change.provenance.source === 'ng-add' && change.provenance.version === VERSIONS.cngx)).toBe(
      true,
    );
  });

  it('imports the outlets into the root NgModule of an NgModule app', async () => {
    const { facts, files } = await factsOf('standalone-app', {
      'src/main.ts': NGMODULE_MAIN,
      'src/app/app-module.ts': NGMODULE,
      'src/app/app.ts': NGMODULE_APP,
    });
    const result = plan(facts);
    const next = applied(result, files);

    expect(result.changes.map((change) => change.label)).toEqual([
      'Place the toast and banner outlets in src/app/app.html',
      'Import the toast and banner outlets in src/app/app-module.ts',
    ]);
    expect(next['src/app/app.html']).toBe('<cngx-banner-outlet />\n<router-outlet />\n<cngx-toast-outlet />\n');
    expect(next['src/app/app-module.ts']).toContain('  imports: [\n    BrowserModule,\n    CngxBannerOutlet,\n    CngxToastOutlet\n  ],');
    expect(next['src/app/app.ts']).toBe(NGMODULE_APP);
  });

  it('skips what is already placed and plans nothing new on a re-run', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const once = applied(plan(facts), files);
    const { facts: again } = await factsOf('scaffold-21', once);
    const result = plan(again, [OUTLETS_ID, OUTLETS_ID, SPEC_ID]);

    expect(result.changes).toEqual([]);
    expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
      [OUTLETS_ID, 'already placed'],
      [OUTLETS_ID, 'already placed'],
      [SPEC_ID, 'already provided'],
    ]);
  });

  it('completes a half placed shell: the import when the outlets are there, the outlet when the import is', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const once = applied(plan(facts), files);

    const withoutImport = await factsOf('scaffold-21', { ...once, 'src/app/app.ts': files['src/app/app.ts'] });
    expect(plan(withoutImport.facts).changes.filter((change) => change.id === OUTLETS_ID).map((change) => change.label)).toEqual([
      'Import the toast and banner outlets in src/app/app.ts',
    ]);

    const withoutToast = await factsOf('scaffold-21', {
      ...once,
      'src/app/app.html': once['src/app/app.html'].replace('<cngx-toast-outlet />\n', ''),
    });
    const toastOnly = plan(withoutToast.facts);
    const next = applied(toastOnly, withoutToast.files);
    expect(toastOnly.changes.filter((change) => change.id === OUTLETS_ID).map((change) => change.label)).toEqual([
      'Place the toast and banner outlets in src/app/app.html',
    ]);
    expect(next['src/app/app.html'].match(/<cngx-banner-outlet \/>/g)).toHaveLength(1);
    expect(next['src/app/app.html'].endsWith('<router-outlet />\n<cngx-toast-outlet />\n')).toBe(true);
  });

  it('adds the outlet classes next to other classes and only the one that is missing', async () => {
    const app = readFixture('scaffold-21')['src/app/app.ts']
      .replace("import { RouterOutlet } from '@angular/router';", "import { RouterOutlet } from '@angular/router';\nimport { CngxToastOutlet } from '@cngx/ui/feedback';")
      .replace('imports: [RouterOutlet],', 'imports: [RouterOutlet, CngxToastOutlet],');
    const { facts, files } = await factsOf('scaffold-21', { 'src/app/app.ts': app });
    const next = applied(plan(facts), files);

    expect(followed(facts).outlets).toMatchObject({ kind: 'editable', classes: ['CngxToastOutlet'] });
    expect(next['src/app/app.ts']).toContain('imports: [RouterOutlet, CngxToastOutlet, CngxBannerOutlet],');
    expect(next['src/app/app.ts']).toContain("import { CngxBannerOutlet } from '@cngx/ui/feedback';");
  });

  it.each(["'imports'", '"imports"'])('fills a %s key of the component and the NgModule instead of adding a second imports', async (key) => {
    const component = await factsOf('scaffold-21', {
      'src/app/app.ts': readFixture('scaffold-21')['src/app/app.ts'].replace('imports:', `${key}:`),
    });
    const ngModule = await factsOf('scaffold-21', {
      'src/main.ts': NGMODULE_MAIN,
      'src/app/app-module.ts': NGMODULE.replace('imports:', `${key}:`),
      'src/app/app.ts': NGMODULE_APP,
    });
    const app = applied(plan(component.facts), component.files)['src/app/app.ts'];
    const module = applied(plan(ngModule.facts), ngModule.files)['src/app/app-module.ts'];

    expect(app).toContain(`${key}: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet],`);
    expect(app.match(/imports/g)).toHaveLength(1);
    expect(module).toContain(`${key}: [\n    BrowserModule,\n    CngxBannerOutlet,\n    CngxToastOutlet\n  ],`);
    expect(syntaxErrors(app)).toEqual([]);
    expect(syntaxErrors(module)).toEqual([]);
  });

  it('names the snippet and writes nothing for a decorator with a spread, a computed key or imports written twice', async () => {
    for (const imports of ['  ...BASE,\n', "  ['imports']: [RouterOutlet],\n", '  imports: [RouterOutlet],\n  imports: [],\n', '  imports,\n']) {
      const { facts } = await factsOf('scaffold-21', {
        'src/app/app.ts': readFixture('scaffold-21')['src/app/app.ts'].replace('  imports: [RouterOutlet],\n', imports),
      });
      const result = plan(facts);

      expect(result.changes.map((change) => change.kind)).toEqual(['note']);
      expect(result.changes[0].reason).toContain(OUTLETS_SNIPPET);
    }
  });

  it('turns a type-only import of an outlet class into a value import', async () => {
    const app = readFixture('scaffold-21')['src/app/app.ts'].replace(
      "import { RouterOutlet } from '@angular/router';",
      "import { RouterOutlet } from '@angular/router';\nimport type { CngxToastOutlet } from '@cngx/ui/feedback';",
    );
    const { facts, files } = await factsOf('scaffold-21', { 'src/app/app.ts': app });
    const next = applied(plan(facts), files)['src/app/app.ts'];

    expect(next).toContain("import { CngxToastOutlet } from '@cngx/ui/feedback';");
    expect(next).toContain("import { CngxBannerOutlet } from '@cngx/ui/feedback';");
    expect(next).not.toContain('import type');
  });

  it('names the snippet instead of editing a template that does not parse or imports that are not a literal', async () => {
    const broken = await factsOf('scaffold-21', { 'src/app/app.html': '<div>@if (</div>\n' });
    const shared = await factsOf('scaffold-21', {
      'src/app/app.ts': readFixture('scaffold-21')['src/app/app.ts'].replace('imports: [RouterOutlet],', 'imports: SHARED,'),
    });

    for (const { facts } of [broken, shared]) {
      const result = plan(facts);
      expect(result.changes.filter((change) => change.id === OUTLETS_ID).map((change) => change.kind)).toEqual(['note']);
      expect(result.changes.some((change) => change.kind === 'edit-file')).toBe(false);
      expect(result.changes[0].reason).toContain(OUTLETS_SNIPPET);
    }
    expect(plan(broken.facts).changes[0].reason).toMatch(/^the template of App in src\/app\/app\.html does not parse as an Angular template; /);
    expect(plan(shared.facts).changes[0].reason).toMatch(/^the imports of App in src\/app\/app\.ts are not a plain array literal; /);
  });

  it('names the snippet when main.ts cannot be followed to the root component', () => {
    const result = plan(createFacts({ appShell: UNFOLLOWED }));

    expect(result.changes).toMatchObject([
      { kind: 'note', id: OUTLETS_ID, reason: `${UNFOLLOWED_TEXT}; ${OUTLETS_SNIPPET}` },
    ]);
  });

  it('provides feedback in the stock zoneless and zone spec once', async () => {
    for (const name of ['scaffold-21', 'scaffold-21-zone'] as const) {
      const stock = readFixture(name)['src/app/app.spec.ts'];
      const provided = provideFeedbackInSpec(stock, 'fixture-app');

      expect(appShellSpecOf(provided, 'fixture-app')).toBe('provided');
      expect(provideFeedbackInSpec(provided, 'fixture-app')).toBe(provided);
      expect(provided).toContain("toContain('Hello, fixture-app')");
    }
  });

  it('leaves a provided spec alone and names the providers for a custom one', async () => {
    const provided = await factsOf('scaffold-21', {
      'src/app/app.spec.ts': provideFeedbackInSpec(readFixture('scaffold-21')['src/app/app.spec.ts'], 'fixture-app'),
    });
    const custom = await factsOf('scaffold-21', {
      'src/app/app.spec.ts': readFixture('scaffold-21')['src/app/app.spec.ts'].replace('should create', 'creates'),
    });

    expect(plan(provided.facts).skipped.filter((step) => step.id === SPEC_ID).map((step) => step.reason)).toEqual(['already provided']);
    expect(plan(provided.facts).changes.some((change) => change.id === SPEC_ID)).toBe(false);
    expect(plan(custom.facts).changes.filter((change) => change.id === SPEC_ID)).toMatchObject([
      {
        kind: 'note',
        reason:
          "the outlets inject CngxToaster and CngxBanner; a TestBed that renders App needs `providers: [provideFeedback(withToasts(), withBanners())]` with import { provideFeedback, withBanners, withToasts } from '@cngx/ui/feedback'",
      },
    ]);
  });

  it('never edits a spec that changed between detection and apply', () => {
    const custom = "describe('App', () => {});\n";

    expect(provideFeedbackInSpec(custom, 'fixture-app')).toBe(custom);
  });

  it('leaves outlets removed after a recorded install out, unless --feedback asks for them again', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const once = applied(plan(facts), files);
    const removed = await factsOf('scaffold-21', {
      ...once,
      'src/app/app.html': once['src/app/app.html'].replace('<cngx-banner-outlet />\n', ''),
    });

    const withdrawn = plan(removed.facts, [OUTLETS_ID, OUTLETS_ID, SPEC_ID]);
    expect(withdrawn.changes).toMatchObject([
      {
        kind: 'note',
        id: OUTLETS_ID,
        reason: 'the outlets were removed after cngx placed them; pass --feedback to place them again',
      },
    ]);
    expect(withdrawn.skipped.map((step) => step.id)).toEqual([OUTLETS_ID, OUTLETS_ID]);

    const explicit = plan(removed.facts, [OUTLETS_ID, OUTLETS_ID, SPEC_ID], true);
    expect(applied(explicit, removed.files)['src/app/app.html']).toContain('<cngx-banner-outlet />');
  });

  it('asks for no outlet a recorded install placed once the shell is blocked or cannot be followed, unless --feedback asks', async () => {
    const { facts, files } = await factsOf('scaffold-21', { 'src/app/app.ts': INLINE_APP });
    const once = applied(plan(facts), files);
    const quoted = await factsOf('scaffold-21', {
      'src/app/app.ts': once['src/app/app.ts'].replace(/template: `[\s\S]*?`/, "template: '<router-outlet />'"),
    });
    const recorded = [OUTLETS_ID, SPEC_ID];

    expect(followed(quoted.facts).outlets.kind).toBe('blocked');
    for (const shellFacts of [quoted.facts, createFacts({ appShell: UNFOLLOWED })]) {
      const result = plan(shellFacts, recorded);
      expect(result.changes).toEqual([]);
      expect(result.skipped.map((step) => step.id)).toEqual([OUTLETS_ID]);
    }
    expect(plan(quoted.facts, recorded, true).changes).toMatchObject([{ kind: 'note', id: OUTLETS_ID }]);
    expect(plan(quoted.facts, recorded, true).changes[0].reason).toContain(OUTLETS_SNIPPET);
  });

  it('names a custom spec only on the run that places an outlet', async () => {
    const custom = readFixture('scaffold-21')['src/app/app.spec.ts'].replace('should create', 'creates');
    const { facts, files } = await factsOf('scaffold-21', { 'src/app/app.spec.ts': custom });
    const { facts: placed } = await factsOf('scaffold-21', applied(plan(facts), files));

    expect(plan(facts).changes.map((change) => change.id)).toContain(SPEC_ID);
    expect(plan(placed, [OUTLETS_ID]).changes).toEqual([]);
  });

  it('places the outlets of a project whose own record holds no outlets step', async () => {
    const { facts } = await factsOf('scaffold-21');

    expect(plan(facts, []).changes.filter((change) => change.kind === 'edit-file' && change.id === OUTLETS_ID)).toHaveLength(2);
  });

  it('plans nothing with feedback off or without @cngx/ui', async () => {
    const { facts } = await factsOf('scaffold-21');

    expect(planAppShell(facts, createAnswers({ feedback: false }), VERSIONS, [], false)).toEqual({ changes: [], skipped: [] });
    expect(planAppShell(facts, createAnswers({ feedback: true, libs: ['core'] }), VERSIONS, [], false)).toEqual({
      changes: [],
      skipped: [],
    });
  });
});

describe('planAppShellRerun', () => {
  const UPDATE = createProvenance('ng-update', '0.1.0');

  it('notes a missing outlet of a recorded feedback install and writes nothing', async () => {
    const { facts } = await factsOf('scaffold-21');
    const result = planAppShellRerun(facts, FEEDBACK, [], UPDATE);

    expect(result.changes).toMatchObject([
      {
        kind: 'note',
        id: OUTLETS_ID,
        label: 'Place the toast and banner outlets (not in place)',
        reason: `the recorded install provides feedback but the root template lacks an outlet; ${OUTLETS_SNIPPET}`,
      },
    ]);
  });

  it('names why the shell cannot be followed or edited', async () => {
    const shared = await factsOf('scaffold-21', {
      'src/app/app.ts': readFixture('scaffold-21')['src/app/app.ts'].replace('imports: [RouterOutlet],', 'imports: SHARED,'),
    });

    expect(planAppShellRerun(createFacts({ appShell: UNFOLLOWED }), FEEDBACK, [], UPDATE).changes).toMatchObject([
      { kind: 'note', id: OUTLETS_ID, reason: `${UNFOLLOWED_TEXT}; ${OUTLETS_SNIPPET}` },
    ]);
    expect(planAppShellRerun(shared.facts, FEEDBACK, [], UPDATE).changes).toMatchObject([
      { kind: 'note', id: OUTLETS_ID, reason: `the imports of App in src/app/app.ts are not a plain array literal; ${OUTLETS_SNIPPET}` },
    ]);
  });

  it('asks for no outlet this project placed and the user removed since', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const once = applied(plan(facts), files);
    const removed = await factsOf('scaffold-21', {
      ...once,
      'src/app/app.html': once['src/app/app.html'].replace('<cngx-toast-outlet />\n', ''),
    });

    expect(planAppShellRerun(removed.facts, FEEDBACK, [OUTLETS_ID, OUTLETS_ID, SPEC_ID], UPDATE)).toEqual({ changes: [], skipped: [] });
    expect(planAppShellRerun(removed.facts, FEEDBACK, [SPEC_ID], UPDATE).changes).toHaveLength(1);
  });

  it('asks for no outlet the record placed, also when the shell is blocked now or cannot be followed', async () => {
    const quoted = await factsOf('scaffold-21', {
      'src/app/app.ts': INLINE_APP.replace(/template: `[\s\S]*?`/, "template: '<router-outlet />'"),
    });

    expect(followed(quoted.facts).outlets.kind).toBe('blocked');
    expect(planAppShellRerun(quoted.facts, FEEDBACK, [OUTLETS_ID], UPDATE)).toEqual({ changes: [], skipped: [] });
    expect(planAppShellRerun(createFacts({ appShell: UNFOLLOWED }), FEEDBACK, [OUTLETS_ID], UPDATE)).toEqual({ changes: [], skipped: [] });
  });

  it('plans nothing when both outlets are there or feedback is off', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const { facts: placed } = await factsOf('scaffold-21', applied(plan(facts), files));

    expect(planAppShellRerun(placed, FEEDBACK, [], UPDATE)).toEqual({ changes: [], skipped: [] });
    expect(planAppShellRerun(facts, createAnswers(), [], UPDATE)).toEqual({ changes: [], skipped: [] });
    expect(planAppShellRerun(createFacts({ appShell: UNFOLLOWED }), createAnswers(), [], UPDATE)).toEqual({ changes: [], skipped: [] });
  });
});
