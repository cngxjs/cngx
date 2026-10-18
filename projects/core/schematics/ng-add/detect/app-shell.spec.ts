import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { format } from 'prettier';
import { describe, expect, it } from 'vitest';

import { createFixtureTree, type FixtureName, readFixture } from '../../testing/run-schematic';
import {
  APP_SHELL_BLOCKED_REASONS,
  type AppShell,
  appShellBlockedText,
  type AppShellBlockedReason,
  appShellOf,
  appShellSpecOf,
  FEEDBACK_SPEC_IMPORT,
  FEEDBACK_SPEC_PROVIDERS,
  inlineTemplateOf,
} from './app-shell';
import { type Read } from './workspace';

function readerOf(name: FixtureName, overrides: Readonly<Record<string, string>> = {}): Read {
  const tree = createFixtureTree(name, overrides);
  return (path) => (tree.exists(path) ? tree.readText(path) : undefined);
}

// The followed shell; fails the spec with the reason when cngx stops on the way.
function shellOf(read: Read, standalone = true, project = 'fixture-app'): AppShell {
  const shell = appShellOf(read, 'src/main.ts', standalone, project);
  if (shell.kind !== 'followed') {
    throw new Error(appShellBlockedText(shell));
  }
  return shell;
}

const NGMODULE_MAIN = `import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;

const NGMODULE = `import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
`;

const NGMODULE_APP = `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fixture-app');
}
`;

const INLINE_APP = `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: \`<router-outlet />\`,
})
export class App {}
`;

const PRETTIERRC = JSON.parse(readFixture('scaffold-21')['.prettierrc']) as Record<string, unknown>;

// The stock spec as the spec step leaves it: the import after the last import,
// the providers right after `imports: [App],`.
function providedSpec(stock: string): string {
  return stock
    .replace("import { App } from './app';\n", `import { App } from './app';\n${FEEDBACK_SPEC_IMPORT}\n`)
    .replace('      imports: [App],\n', `      imports: [App],\n      providers: [${FEEDBACK_SPEC_PROVIDERS}],\n`);
}

describe('appShellOf', () => {
  it('follows bootstrapApplication to the root component of the standalone app', () => {
    expect(appShellOf(readerOf('standalone-app'), 'src/main.ts', true, 'fixture-app')).toEqual({
      kind: 'followed',
      componentFile: 'src/app/app.ts',
      className: 'App',
      template: { kind: 'file', path: 'src/app/app.html' },
      importsHost: { file: 'src/app/app.ts', kind: 'component', className: 'App' },
      specPath: 'src/app/app.spec.ts',
      spec: 'absent',
      outlets: { kind: 'editable', elements: [], classes: [], routerOutlet: true },
    });
  });

  it('follows bootstrapModule to the bootstrap component and takes the NgModule as the imports host', () => {
    const read = readerOf('standalone-app', {
      'src/main.ts': NGMODULE_MAIN,
      'src/app/app-module.ts': NGMODULE,
      'src/app/app.ts': NGMODULE_APP,
    });

    expect(appShellOf(read, 'src/main.ts', false, 'fixture-app')).toMatchObject({
      componentFile: 'src/app/app.ts',
      className: 'App',
      template: { kind: 'file', path: 'src/app/app.html' },
      importsHost: { file: 'src/app/app-module.ts', kind: 'ng-module', className: 'AppModule' },
    });
  });

  it('reads an inline template', () => {
    const read = readerOf('standalone-app', { 'src/app/app.ts': INLINE_APP });

    expect(shellOf(read).template).toEqual({ kind: 'inline' });
  });

  it('resolves a templateUrl relative to the component file', () => {
    const read = readerOf('standalone-app', {
      'src/app/app.ts': readFixture('standalone-app')['src/app/app.ts'].replace("'./app.html'", "'../views/root.html'"),
      'src/views/root.html': '<router-outlet />\n',
    });

    expect(shellOf(read).template).toEqual({
      kind: 'file',
      path: 'src/views/root.html',
    });
  });

  it('picks the bootstrapped App, never the app-shell component it renders', () => {
    const shell = appShellOf(readerOf('existing-tailwind-app'), 'src/main.ts', true, 'tailwind-app');

    expect(shell).toMatchObject({ componentFile: 'src/app/app.ts', className: 'App' });
  });

  it('follows a re-exported class to the file declaring it', () => {
    const read = readerOf('standalone-app', {
      'src/main.ts': readFixture('standalone-app')['src/main.ts'].replace("'./app/app'", "'./app'"),
      'src/app/index.ts': "export { App } from './app';\n",
    });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      componentFile: 'src/app/app.ts',
      template: { kind: 'file', path: 'src/app/app.html' },
    });
  });

  it('follows a re-export through the AST when a comment names the class', () => {
    const read = readerOf('standalone-app', {
      'src/main.ts': readFixture('standalone-app')['src/main.ts'].replace("'./app/app'", "'./app'"),
      'src/app/index.ts': "// export class App lived here before the split\n// export { App } from './old';\nexport * from './app';\n",
    });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      componentFile: 'src/app/app.ts',
      template: { kind: 'file', path: 'src/app/app.html' },
    });
  });

  it('gives up on a bootstrap it cannot follow', () => {
    const viaAlias = readerOf('standalone-app', {
      'src/main.ts': "import { bootstrapApplication } from '@angular/platform-browser';\nimport { App } from '@app/root';\n\nbootstrapApplication(App);\n",
    });
    const viaCall = readerOf('standalone-app', {
      'src/main.ts': "import { bootstrapApplication } from '@angular/platform-browser';\n\nbootstrapApplication(rootComponent());\n",
    });

    expect(appShellOf(viaAlias, 'src/main.ts', true, 'fixture-app')).toEqual({
      kind: 'unfollowed',
      reason: 'class-not-followed',
      subject: 'App',
      file: 'src/main.ts',
    });
    expect(appShellOf(viaCall, 'src/main.ts', true, 'fixture-app')).toMatchObject({ kind: 'unfollowed', reason: 'no-bootstrap-call' });
  });

  it('reads the bootstrap call through the AST, so a commented-out call never counts', () => {
    const main = readFixture('standalone-app')['src/main.ts'];
    const commentedFirst = readerOf('standalone-app', {
      'src/main.ts': `// bootstrapApplication(Other, otherConfig);\n/* platformBrowser().bootstrapModule(OtherModule) */\n${main}`,
    });
    const commentedOnly = readerOf('standalone-app', { 'src/main.ts': main.replace('bootstrapApplication(App', '// bootstrapApplication(App') });

    expect(shellOf(commentedFirst)).toMatchObject({ componentFile: 'src/app/app.ts', className: 'App' });
    expect(appShellOf(commentedOnly, 'src/main.ts', true, 'fixture-app')).toEqual({
      kind: 'unfollowed',
      reason: 'no-bootstrap-call',
      subject: '',
      file: 'src/main.ts',
    });
  });

  it('blocks the outlets of a missing template file and of a component without a template', () => {
    const missing = readerOf('standalone-app', {
      'src/app/app.ts': readFixture('standalone-app')['src/app/app.ts'].replace("'./app.html'", "'./gone.html'"),
    });
    const none = readerOf('standalone-app', {
      'src/app/app.ts': "import { Component } from '@angular/core';\n\n@Component({ selector: 'app-root' })\nexport class App {}\n",
    });

    expect(shellOf(missing).outlets).toEqual({ kind: 'blocked', reason: 'template-file-missing', subject: 'App', file: 'src/app/gone.html' });
    expect(shellOf(none).outlets).toEqual({ kind: 'blocked', reason: 'no-template', subject: 'App', file: 'src/app/app.ts' });
  });

  it('finds the decorator through the AST when a template or a comment says class', () => {
    const inTemplate = readerOf('standalone-app', {
      'src/app/app.ts': INLINE_APP.replace('`<router-outlet />`', '`<p>The class list</p><router-outlet />`'),
    });
    const inComment = readerOf('standalone-app', {
      'src/app/app.ts': INLINE_APP.replace('export class App {}', '// the class App below is the root\nexport class App {}'),
    });

    expect(appShellOf(inTemplate, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      template: { kind: 'inline' },
      outlets: { kind: 'editable', routerOutlet: true },
    });
    expect(appShellOf(inComment, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      template: { kind: 'inline' },
      outlets: { kind: 'editable', routerOutlet: true },
    });
  });

  it('blocks the outlets of a component decorator that takes no object literal', () => {
    const read = readerOf('standalone-app', {
      'src/app/app.ts': "import { Component } from '@angular/core';\nimport { ROOT } from './root';\n\n@Component(ROOT)\nexport class App {}\n",
    });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      template: { kind: 'unread' },
      outlets: { kind: 'blocked', reason: 'decorator-not-object', subject: 'App', file: 'src/app/app.ts' },
    });
  });

  it('reads the stock spec of the zoneless and the zone scaffold', () => {
    for (const name of ['scaffold-21', 'scaffold-21-zone'] as const) {
      expect(shellOf(readerOf(name)).spec).toBe('stock');
    }
  });
});

describe('appShellOf outlets', () => {
  function outletsOf(overrides: Readonly<Record<string, string>>) {
    return shellOf(readerOf('scaffold-21', overrides)).outlets;
  }

  it('reads the outlets in the template and the outlet classes imported into the component', () => {
    const app = readFixture('scaffold-21')['src/app/app.ts']
      .replace("import { RouterOutlet } from '@angular/router';", "import { RouterOutlet } from '@angular/router';\nimport { CngxToastOutlet } from '@cngx/ui/feedback';")
      .replace('imports: [RouterOutlet],', 'imports: [RouterOutlet, CngxToastOutlet, CngxBannerOutlet],');

    expect(outletsOf({ 'src/app/app.ts': app, 'src/app/app.html': '@if (on) { <cngx-banner-outlet /> }\n<router-outlet />\n' })).toEqual({
      kind: 'editable',
      elements: ['cngx-banner-outlet'],
      classes: ['CngxToastOutlet'],
      routerOutlet: true,
    });
  });

  it('reads a component without an imports property as editable', () => {
    const app = readFixture('scaffold-21')['src/app/app.ts'].replace('  imports: [RouterOutlet],\n', '');

    expect(outletsOf({ 'src/app/app.ts': app })).toMatchObject({ kind: 'editable', classes: [] });
  });

  it('blocks a template that does not parse, imports that are not a literal and an outlet name bound elsewhere', () => {
    const stock = readFixture('scaffold-21')['src/app/app.ts'];

    expect(outletsOf({ 'src/app/app.html': '<div>@if (</div>\n' })).toEqual({
      kind: 'blocked',
      reason: 'template-parse-error',
      subject: 'App',
      file: 'src/app/app.html',
    });
    expect(outletsOf({ 'src/app/app.ts': stock.replace('imports: [RouterOutlet],', 'imports: SHARED,') })).toEqual({
      kind: 'blocked',
      reason: 'imports-not-array',
      subject: 'App',
      file: 'src/app/app.ts',
    });
    expect(
      outletsOf({ 'src/app/app.ts': `import { CngxToastOutlet } from './toasts';\n${stock}` }),
    ).toEqual({ kind: 'blocked', reason: 'outlet-name-bound', subject: 'CngxToastOutlet', file: 'src/app/app.ts' });
  });

  it.each(["'imports'", '"imports"'])('reads a %s key of the component and the NgModule as their imports', (key) => {
    const app = readFixture('scaffold-21')['src/app/app.ts']
      .replace("import { RouterOutlet } from '@angular/router';", "import { RouterOutlet } from '@angular/router';\nimport { CngxToastOutlet } from '@cngx/ui/feedback';")
      .replace('imports: [RouterOutlet],', `${key}: [RouterOutlet, CngxToastOutlet],`);
    const ngModule = readerOf('scaffold-21', {
      'src/main.ts': NGMODULE_MAIN,
      'src/app/app-module.ts': NGMODULE.replace('imports:', `${key}:`),
      'src/app/app.ts': NGMODULE_APP,
    });

    expect(outletsOf({ 'src/app/app.ts': app })).toMatchObject({ kind: 'editable', classes: ['CngxToastOutlet'] });
    expect(shellOf(ngModule, false).outlets).toMatchObject({ kind: 'editable', classes: [] });
  });

  it.each([
    ['a spread', '  ...BASE,\n', 'decorator-dynamic'],
    ['a computed key', "  ['imports']: [RouterOutlet],\n", 'decorator-dynamic'],
    ['imports written twice', '  imports: [RouterOutlet],\n  imports: [],\n', 'duplicate-property'],
    ['a shorthand imports', '  imports,\n', 'imports-not-array'],
    ['an identifier imports', '  imports: IMPORTS,\n', 'imports-not-array'],
  ])('blocks a component decorator with %s', (_name, imports, reason) => {
    const app = readFixture('scaffold-21')['src/app/app.ts'].replace('  imports: [RouterOutlet],\n', imports);

    expect(outletsOf({ 'src/app/app.ts': app })).toEqual({ kind: 'blocked', reason, subject: 'App', file: 'src/app/app.ts' });
  });

  it('blocks an NgModule whose imports cngx cannot write safely', () => {
    const shell = (imports: string) =>
      appShellOf(
        readerOf('scaffold-21', {
          'src/main.ts': NGMODULE_MAIN,
          'src/app/app-module.ts': NGMODULE.replace('  imports: [\n    BrowserModule\n  ],', imports),
          'src/app/app.ts': NGMODULE_APP,
        }),
        'src/main.ts',
        false,
        'fixture-app',
      );
    const at = { subject: 'AppModule', file: 'src/app/app-module.ts' };

    // The NgModule decorator also names the bootstrap component, so one cngx cannot read is not followed.
    expect(shell('  ...SHARED,')).toEqual({ kind: 'unfollowed', reason: 'decorator-dynamic', ...at });
    expect(shell("  imports: [BrowserModule],\n  'imports': [],")).toEqual({ kind: 'unfollowed', reason: 'duplicate-property', ...at });
    expect(shell('  imports: MODULES,')).toMatchObject({ outlets: { kind: 'blocked', reason: 'imports-not-array', ...at } });
  });

  it('reads an outlet class imported type-only as missing', () => {
    const app = readFixture('scaffold-21')['src/app/app.ts']
      .replace("import { RouterOutlet } from '@angular/router';", "import { RouterOutlet } from '@angular/router';\nimport type { CngxToastOutlet } from '@cngx/ui/feedback';")
      .replace('imports: [RouterOutlet],', 'imports: [RouterOutlet, CngxToastOutlet],');

    expect(outletsOf({ 'src/app/app.ts': app })).toMatchObject({ kind: 'editable', classes: [] });
  });

  it('blocks an inline template that interpolates', () => {
    const read = readerOf('standalone-app', { 'src/app/app.ts': INLINE_APP.replace('<router-outlet />', '${OUTLET}') });

    expect(shellOf(read).outlets).toEqual({ kind: 'blocked', reason: 'template-interpolated', subject: 'App', file: 'src/app/app.ts' });
  });

  it('blocks a quoted inline template that lacks an outlet, but not one that holds both', () => {
    const quoted = INLINE_APP.replace('`<router-outlet />`', "'<router-outlet />'");
    const placed = INLINE_APP.replace('`<router-outlet />`', '"<cngx-banner-outlet /><router-outlet /><cngx-toast-outlet />"');

    expect(shellOf(readerOf('standalone-app', { 'src/app/app.ts': quoted })).outlets).toEqual({
      kind: 'blocked',
      reason: 'quoted-template',
      subject: 'App',
      file: 'src/app/app.ts',
    });
    expect(shellOf(readerOf('standalone-app', { 'src/app/app.ts': placed })).outlets).toMatchObject({
      kind: 'editable',
      elements: ['cngx-banner-outlet', 'cngx-toast-outlet'],
    });
  });
});

interface ReasonShape {
  readonly files?: Readonly<Record<string, string>>;
  readonly gone?: string;
  readonly ngModule?: boolean;
  readonly subject: string;
  readonly file: string;
}

const STOCK_APP = readFixture('scaffold-21')['src/app/app.ts'];
const AT_APP = { subject: 'App', file: 'src/app/app.ts' };
const AT_MODULE = { subject: 'AppModule', file: 'src/app/app-module.ts' };

function stockApp(from: string | RegExp, to: string): Readonly<Record<string, string>> {
  return { 'src/app/app.ts': STOCK_APP.replace(from, to) };
}

function moduleApp(module: string): Readonly<Record<string, string>> {
  return { 'src/main.ts': NGMODULE_MAIN, 'src/app/app-module.ts': module, 'src/app/app.ts': NGMODULE_APP };
}

// One shape per reason; the record type fails the build when a reason has none.
const REASON_SHAPES: Readonly<Record<AppShellBlockedReason, ReasonShape>> = {
  'main-missing': { gone: 'src/main.ts', subject: '', file: 'src/main.ts' },
  'no-bootstrap-call': { files: { 'src/main.ts': "import { App } from './app/app';\n" }, subject: '', file: 'src/main.ts' },
  'class-not-followed': {
    files: { 'src/main.ts': "import { bootstrapApplication } from '@angular/platform-browser';\nimport { App } from '@acme/shell';\n\nbootstrapApplication(App);\n" },
    subject: 'App',
    file: 'src/main.ts',
  },
  'no-ngmodule-decorator': { files: moduleApp('export class AppModule {}\n'), ngModule: true, ...AT_MODULE },
  'no-bootstrap-component': { files: moduleApp(NGMODULE.replace(',\n  bootstrap: [App]', '')), ngModule: true, ...AT_MODULE },
  'no-component-decorator': { files: { 'src/app/app.ts': 'export class App {}\n' }, ...AT_APP },
  'decorator-not-object': { files: stockApp(/@Component\(\{[\s\S]*?\}\)/, '@Component(CONFIG)'), ...AT_APP },
  'decorator-dynamic': { files: stockApp('  imports: [RouterOutlet],\n', '  ...BASE,\n'), ...AT_APP },
  'duplicate-property': { files: stockApp('  imports: [RouterOutlet],\n', '  imports: [RouterOutlet],\n  imports: [],\n'), ...AT_APP },
  'no-template': { files: stockApp("  templateUrl: './app.html',\n", ''), ...AT_APP },
  'two-templates': { files: stockApp("  templateUrl: './app.html',\n", "  templateUrl: './app.html',\n  template: '',\n"), ...AT_APP },
  'template-not-literal': { files: stockApp("templateUrl: './app.html'", 'templateUrl: URL'), ...AT_APP },
  'template-interpolated': { files: stockApp("templateUrl: './app.html'", 'template: `${X}`'), ...AT_APP },
  'template-file-missing': { gone: 'src/app/app.html', subject: 'App', file: 'src/app/app.html' },
  'template-parse-error': { files: { 'src/app/app.html': '<div>@if (</div>\n' }, subject: 'App', file: 'src/app/app.html' },
  'quoted-template': { files: stockApp("templateUrl: './app.html'", "template: '<router-outlet />'"), ...AT_APP },
  'imports-not-array': { files: stockApp('imports: [RouterOutlet]', 'imports: SHARED'), ...AT_APP },
  'outlet-name-bound': { files: stockApp("import { RouterOutlet } from '@angular/router';", "import { RouterOutlet } from '@angular/router';\nimport { CngxToastOutlet } from './toasts';"), subject: 'CngxToastOutlet', file: 'src/app/app.ts' },
};

const INSTALL_DOC = readFileSync(join(__dirname, '..', '..', '..', '..', '..', 'core-concepts', 'install.md'), 'utf8');

describe('the blocked app shell reasons', () => {
  it.each(Object.entries(REASON_SHAPES))('names %s with the class and the file it stopped at', (reason, shape) => {
    const tree = createFixtureTree('scaffold-21', shape.files ?? {});
    if (shape.gone !== undefined) {
      tree.delete(shape.gone);
    }
    const shell = appShellOf((path) => (tree.exists(path) ? tree.readText(path) : undefined), 'src/main.ts', shape.ngModule !== true, 'fixture-app');
    const at = shell.kind === 'unfollowed' ? shell : shell.outlets;

    expect(at).toMatchObject({ reason, subject: shape.subject, file: shape.file });
  });

  it.each(Object.keys(APP_SHELL_BLOCKED_REASONS) as AppShellBlockedReason[])('documents %s in core-concepts/install.md', (reason) => {
    expect(INSTALL_DOC).toContain(appShellBlockedText({ reason, subject: '<Class>', file: '<file>' }));
  });
});

describe('inlineTemplateOf', () => {
  it('finds the text of a backtick or quoted inline template', () => {
    const quoted = "@Component({ selector: 'x', template: '<p>it\\'s</p>' })\nexport class App {}\n";

    expect(inlineTemplateOf(INLINE_APP, 'App')).toMatchObject({ text: '<router-outlet />', quoted: false });
    expect(inlineTemplateOf(quoted, 'App')).toMatchObject({ text: "<p>it\\'s</p>", quoted: true });
    expect(inlineTemplateOf(readFixture('scaffold-21')['src/app/app.ts'], 'App')).toBeUndefined();
  });
});

describe('appShellSpecOf', () => {
  const zoneless = readFixture('scaffold-21')['src/app/app.spec.ts'];
  const zone = readFixture('scaffold-21-zone')['src/app/app.spec.ts'];

  it('reads the stock spec for its own project name only', () => {
    expect(appShellSpecOf(zoneless, 'fixture-app')).toBe('stock');
    expect(appShellSpecOf(zone, 'fixture-app')).toBe('stock');
    expect(appShellSpecOf(zoneless, 'other-app')).toBe('custom');
  });

  it('reads a CRLF checkout of the stock spec as stock', () => {
    expect(appShellSpecOf(zoneless.replace(/\n/g, '\r\n'), 'fixture-app')).toBe('stock');
  });

  it('reads the stock spec with the feedback providers as provided, raw and formatted', async () => {
    for (const stock of [zoneless, zone]) {
      const provided = providedSpec(stock);
      const formatted = await format(provided, { ...PRETTIERRC, filepath: 'src/app/app.spec.ts' });

      expect(appShellSpecOf(provided, 'fixture-app')).toBe('provided');
      expect(appShellSpecOf(formatted, 'fixture-app')).toBe('provided');
    }
  });

  it('reads one changed character as custom', () => {
    expect(appShellSpecOf(zoneless.replace('should create the app', 'should create the App'), 'fixture-app')).toBe('custom');
    expect(appShellSpecOf(providedSpec(zoneless).replace('withBanners())', 'withBanners() )'), 'fixture-app')).toBe(
      'custom',
    );
  });

  it('reads the providers added twice as custom', () => {
    const twice = providedSpec(zoneless).replace(
      '      imports: [App],\n',
      `      imports: [App],\n      providers: [${FEEDBACK_SPEC_PROVIDERS}],\n`,
    );

    expect(appShellSpecOf(twice, 'fixture-app')).toBe('custom');
  });

  it('reads no spec as absent', () => {
    expect(appShellSpecOf(undefined, 'fixture-app')).toBe('absent');
  });
});
