import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { createProvenance, type StepResult } from '../../engine';
import { createAnswers, createFacts } from '../../testing/onboarding';
import { createFixtureTree, type FixtureName, readFixture } from '../../testing/run-schematic';
import { appShellSpecOf, detectProject, type ProjectFacts } from '../detect/detect';
import { OUTLETS_ID, OUTLETS_SNIPPET, planAppShell, planAppShellCheck, provideFeedbackInSpec, SPEC_ID } from './app-shell';

const PROVENANCE = createProvenance('ng-add', '0.1.0');
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

function plan(facts: ProjectFacts, recorded: readonly string[] = [], explicit = false): StepResult {
  return planAppShell(facts, FEEDBACK, PROVENANCE, recorded, explicit);
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
    expect(next['src/app/app.ts']).toContain('<cngx-toast-outlet />\n`,');
    expect(next['src/app/app.ts']).toContain('imports: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet],');
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

    expect(facts.appShell?.outlets).toMatchObject({ kind: 'editable', classes: ['CngxToastOutlet'] });
    expect(next['src/app/app.ts']).toContain('imports: [RouterOutlet, CngxToastOutlet, CngxBannerOutlet],');
    expect(next['src/app/app.ts']).toContain("import { CngxBannerOutlet } from '@cngx/ui/feedback';");
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
    expect(plan(broken.facts).changes[0].reason).toMatch(/^src\/app\/app\.html does not parse as an Angular template; /);
    expect(plan(shared.facts).changes[0].reason).toMatch(/^the imports of App in src\/app\/app\.ts are not an array literal; /);
  });

  it('names the snippet when main.ts cannot be followed to the root component', () => {
    const result = plan(createFacts({ appShell: undefined }));

    expect(result.changes).toMatchObject([
      { kind: 'note', id: OUTLETS_ID, reason: `cngx could not follow main.ts to the root component; ${OUTLETS_SNIPPET}` },
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

  it('places the outlets of a project whose own record holds no outlets step', async () => {
    const { facts } = await factsOf('scaffold-21');

    expect(plan(facts, []).changes.filter((change) => change.kind === 'edit-file' && change.id === OUTLETS_ID)).toHaveLength(2);
  });

  it('plans nothing with feedback off or without @cngx/ui', async () => {
    const { facts } = await factsOf('scaffold-21');

    expect(planAppShell(facts, createAnswers({ feedback: false }), PROVENANCE, [], false)).toEqual({ changes: [], skipped: [] });
    expect(planAppShell(facts, createAnswers({ feedback: true, libs: ['core'] }), PROVENANCE, [], false)).toEqual({
      changes: [],
      skipped: [],
    });
  });
});

describe('planAppShellCheck', () => {
  it('notes a missing outlet of a recorded feedback install and writes nothing', async () => {
    const { facts } = await factsOf('scaffold-21');
    const result = planAppShellCheck(facts, FEEDBACK, createProvenance('ng-update', '0.1.0'));

    expect(result.changes).toMatchObject([{ kind: 'note', id: OUTLETS_ID, label: 'Place the toast and banner outlets (not in place)' }]);
  });

  it('plans nothing when both outlets are there or feedback is off', async () => {
    const { facts, files } = await factsOf('scaffold-21');
    const { facts: placed } = await factsOf('scaffold-21', applied(plan(facts), files));

    expect(planAppShellCheck(placed, FEEDBACK, PROVENANCE)).toEqual({ changes: [], skipped: [] });
    expect(planAppShellCheck(facts, createAnswers(), PROVENANCE)).toEqual({ changes: [], skipped: [] });
  });
});
